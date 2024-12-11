const mongoose = require('mongoose')

const productScema =mongoose.Schema({
    productname:{
        type:String,
        required:true
    },
    category:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Category',
        required:true
    },
    brand:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Brand',
        require:true
    },
    images:[{
        type:String
    }],
    ram:{
        type:Number
    },
    storage:{
        type:Number
    },
    colour:{
        type:String
    },
    description:{
        type:String
    },
    oldprice:{
        type:Number
    },
    newprice:{
        type:Number
    },
    stock:{
        type:Number,
        default:0
    },
    ispublished:{
        type:Boolean,
        default:true
    },
    created:{
        type:Date,
        required:true,
        default:Date.now
    }

})

module.exports = mongoose.model('product',productScema)