const mongoose = require('mongoose')

const cart = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        require: true
    },
    items: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'product',
                require: true
            },
            price: {
                type: Number,
                default: 0,                
            },
            quantity: {
                type: Number,
                required: true,
            }
        }
    ],
    totalprice: {
        type: Number,
        default: 0,
    }

})

module.exports = mongoose.model('cart',cart)