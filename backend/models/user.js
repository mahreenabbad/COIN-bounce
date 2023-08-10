const mongoose= require('mongoose');
const {Schema }= mongoose;
const userSchema = new Schema({
    name:{type:String,required:true},
    username:{type:String,required:true},
    email:{type:String,required:true},
    password:{type:String,required:true}
},
{timestamps:true}
)
//first is model 2nd is model schema 3rd database collection name
module.exports= mongoose.model('User',userSchema,'users');
