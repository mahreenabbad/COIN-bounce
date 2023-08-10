const express= require('express');
const athController= require('../controller/authController');
const blogController = require('../controller/blogController')
const commentController= require('../controller/commentController')
const auth = require('../middlewares/auth')


const router = express.Router();



router.get('/test',(req,res)=>res.json({msg:'working'}))
//user
//register
router.post('/register',(req,res)=>{
    // console.log(req.body)
    
    res.json(athController.register)
    
});
//login
router.post('/login',(req,res)=>{res.json(athController.login)});


//logout
router.post('/logout', auth,athController.logout);
//refresh
router.get('/refresh',athController.refresh)

//blog

//crud
//create
router.post('/blog',auth,blogController.create);
//get all//read all blogs
router.get('/blog/all',auth,blogController.getAll);

//read blog by id
router.get('/blog/:id',auth,blogController.getById);
//update
router.put('/blog',auth,blogController.update);

//delete
router.delete('/blog',auth,blogController.delete);

//comment
//create comment
router.post('/comment',auth,commentController.create);
//read comments by blog id
router.get('/comment/:id',auth,commentController.getById);

module.exports= router;