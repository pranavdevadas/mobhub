const mongoose = require('mongoose')

const wishlist = new mongoose.Schema({
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
            },
            wishlistDate: {
                type: Date,
                default: Date.now
            },
        },
        
    ],
    

})

module.exports = mongoose.model('wishlist',wishlist)