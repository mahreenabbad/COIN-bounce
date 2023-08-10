
const Joi = require("joi");
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const UserDTO = require('../dto/user');
const RefreshToken= require('../models/token');
const JWTService = require('../services/JWTService');



const passwordPattern = "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*_=+-]).{8,16}$";

const authController ={
    async register(req,res,next){
        //1.valid user input
        const userRegistrationSchema =  Joi.object({
            username:Joi.string().min(5).max(30).required(),
            name:Joi.string().max(30).required(),
            email:Joi.string().email().required(),
            password:Joi.string().pattern(passwordPattern).required(),
            confirmPassword:Joi.ref('password'),
        });
        const {error} =  userRegistrationSchema.validate(req.body);
        //2.if error in validation -> return errror via middleware
        if(error){
            return next(error);
        }    
        //3.if email or username is already registered -> return an error
        const {username,name,email,password}= req.body;
        try{
            const emailInUse = await User.exists({email});
            const usernameInUse = await User.exists({username});
            if(emailInUse){
                const error={
                    status:409,
                    message:'email already registered'
                }
                return next(error);
            }
            if(usernameInUse){
                const error ={
                    status:409,
                    message:'username already registered'
                }
                return next(error);
            }
        }
        catch(error){
            return next(error);
        }
        //4. password hash
        const hashedPassword = await bcrypt.hash(password,10)
        //5.store data in db 
        let accessToken;
        let refreshToken;
        let user;
        try {
            const userToRegister = new User({
                username,
                email,
                name,
                password:hashedPassword
            })
            
            user= await userToRegister.save();
           //token genration
           accessToken= JWTService.signAccessToken({_id:user._id,username},'30m');
           refreshToken= JWTService.signRefreshToken({_id:user.id},'60m');
        } catch (error) {
            return next(error);
        }
        //store refresh token in database
       await JWTService.storeRefreshToken(refreshToken,user._id);
        //send token in cokkies
        res.cookie('accessToken',accessToken,{
            maxAge:1000*60*60*24,
            httpOnly:true
        });
        res.cookie('refreshToken',refreshToken,{
            maxAge:1000*60*60*24,
            httpOnly:true    
        })
             //6.response send
       const userDTO = new UserDTO(user);

   
        return res.status(201).json({user:userDTO,auth:true});

    },
    async login(req,res,next){
        //1.validate user input
        //2.if validation error,return error
        //3.match usename and password
        //4.return response

        //expect input data to be in such shape
        const userLoginSchema = Joi.object({
            username:Joi.string().min(5).max(10).required(),
            password:Joi.string().pattern(passwordPattern)
        });
        const {error}=userLoginSchema.validate(req.body);
        if(error){
            return next(error)
        }
        const {username,password}=req.body;
        //const username = req.body.username;
        //const password = req.body.password;
        let user;
        try {
            //match username
            user= await User.findOne({username:username});
           if(!user){
            const error={
                status : 401,
                message:'invalid username ',
            }
            return next(error);
           }
           //match password
           const match = await bcrypt.compare(password,user.password);
           if(!match){
            const error={
                status:401,
                message:'invalid password',
            }
            return next(error);
           }
        } 
        catch (error) {
            return next(error);
        }
        const accessToken = JWTService.signAccessToken({_id:user._id,},'30m');
        const refreshToken = JWTService.signRefreshToken({_id:user._id},'60m');
        //update refresh token in db
        try {
          await  RefreshToken.updateOne({
            _id:user._id
        },
        {token:refreshToken},
        {upsert:true}
        )
        } catch (error) {
            return next(error);
        }
        


        res.cookie('accessToken',accessToken,{
            maxAge:1000*60*60*24,
            httpOnly:true
        });
        res.cookie('refreshToken',refreshToken,{
            maxAge:1000*60*60*24,
            httpOnly:true
        });

        const userDto = new UserDTO(user);
        return res.status(200).json({user:userDto,auth:true})
    },
    async logout(req,res,next){
        console.log(req);
        //1 delete refresh tokenfrom db
        const {refreshToken}= req.cookies;
        try {
          await  RefreshToken.deleteOne({token:refreshToken});
        } catch (error) {
            return next(error);
        }
        //delete cookie
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        //2 response
        res.status(200).json({user:null,auth:false})

    },
    async refresh(req,res,next){
        //1.get refresh token from cookies
        //2.verify refresh token
        //3.generate new token
        //4.update database,return response
        const originalRefreshToken = req.cookies.refreshToken;
        let id;
        try {
            id =JWTService.verifyRefreshToken(originalRefreshToken)._id;
        } catch (e) {
            const error={
                status :401,
                message:'unauthrized'
            }
            return next(error);
        }
        try {
            const match=RefreshToken.findOne({_id:id,token:originalRefreshToken});
            if(!match){
                const error={
                    status:401,
                    message:'unauthrized'
                }
                return next(error)
            }
        } catch (error) {
            return next(error)
        }
        try {
            const accessToken= JWTService.signAccessToken({_id:id},'30m');
            const refreshToken=JWTService.signRefreshToken({_id:id},'60m');
           await RefreshToken.updateOne({_id:id},{token:refreshToken});
           res.cookie('accessToken',accessToken,{
            maxAge:1000*60*60*24,
            httpOnly:true
           })
           res.cookie('refreshToken',refreshToken,{
            maxAge:1000*60*60*24,
            httpOnly:true
           });
        } catch (error) {
            return next(error)
        }
        const user= await User.findOne({_id:id});
        const userDto= new UserDTO(user);
        return res.status(200).json({user:userDto,auth:true});

        
    }
}

module.exports=authController;