const mongoose = require('mongoose')
const categoryScema = mongoose.Schema({
    category:{
        type:String,
        required:true
    },
    isListed:{
        type:Boolean,
        default:true
    },
    description:{
        type:String,
        required:true
    },
    time:{
        type:Date,
        default:Date.now
    }
})

module.exports= mongoose.model('Category',categoryScema)