const mongoose = require('mongoose')
const adminCridentialScema = mongoose.Schema({
    email:{
        type:String,
        required:true
    },
    password:{
        type:Boolean,
        default:true
    },
    
})

module.exports= mongoose.model('AdminCridentials',adminCridentialScema)