const JWTService= require('../services/JWTService');
const UserDTO = require('../dto/user');

const auth = async(req,res,next)=>{
    try {
        const {accessToken,refreshToken}= req.cookies;
    if(!refreshToken || !accessToken){
        const error={
            status:401,
            message:'unauthrized'
        }
        return next(error);
    }
    let _id;
    try {
         _id= JWTService.verifyAccessToken(accessToken);
    } catch (error) {
        return next(error);
    }
    let user;
    try {
        user= await User.findOne({_id:_id})
    }
    
     catch (error) {
        return next(error);
    }
    const userDto = new UserDTO(user);
    req.user= userDto;
    next();
    } catch (error) {
        return next(error);
    }
    //1.access,refresh token validation
    
}

    
    module.exports= auth;