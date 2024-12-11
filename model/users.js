const mongoose= require('mongoose')
const moment = require('moment')  
const userScema = mongoose.Schema({
    name:{
        type:String,
        required: true
    },
    phone:{
        type:Number,
        required: true  
    },
    email:{
        type:String,
        required:true
    },
    pass:{
        type:String,
        required: true
    },
    isBlocked:{
        type:Boolean,
        default: false
    },
    isVerified:{
        type:Boolean,
        default: false
    },
    otp:{
        type: String,
        default: null
    },
    referalcode: {
        type: Number,
        default: function(){
            return Math.floor(100000 + Math.random() * 900000).toString();
         },
         unique:true
    },
    created:{
        type:Date,
        required: true,
        default:Date.now
    }
})




module.exports= mongoose.model('User',userScema)