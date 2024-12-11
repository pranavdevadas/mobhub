const mongoose = require('mongoose')

const walletScema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        require: true
    },
    balance: {
        type: Number,
        require: true
    }

})

module.exports = mongoose.model('wallet',walletScema)