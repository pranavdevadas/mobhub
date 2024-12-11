const Products  = require('../model/products')
const Brand = require('../model/brand')
const Order = require('../model/orders')
const Wallet = require('../model/wallet')
const Transaction = require('../model/transaction')



const orderController = {

    getorder: async (req,res,next) => {
        try{

            const currentPage = parseInt(req.query.page) || 1; 
            const limit = 10 
            const skip = (currentPage - 1) * limit;

            const totalItems = await Order.countDocuments()
            const totalPages = Math.ceil(totalItems / limit)

            const orders = await Order.find().skip(skip).limit(limit).sort({ orderDate : -1 })

            res.render('admin/adminOrder',{
                title: 'Order',
                order: orders,
                totalPages,
                currentPage
            })
        }
        catch(err){
            next(err)
        }
    },

    orderdetails: async (req,res,next) => {
        try{
            const orderId = req.params.Id
            const orders = await Order.findOne({ _id : orderId}).populate('items.product')
            
            res.render('admin/adminOrderDetails',{
                title: 'Order Details',
                order: orders,
            })

        }
        catch(err){
            next(err)
        }
    },

    updatestatus: async (req,res,next) => {
        try{

            const { orderId, productId, selectedStatus } = req.body;
            const order = await Order.findById(orderId);
            const userWallet = await Wallet.findOne({ userId : order.userId })
            const cancelProduct = order.items.find(item => item.product.toString() === productId)            


            const updatedOrder = await Order.findOneAndUpdate(
                { _id: orderId, 'items.product': productId },
                { $set: { 'items.$.status': selectedStatus } },
                { new: true }
            );

            if ( selectedStatus == 'Cancelled' || selectedStatus == 'Returned' ) {

                const orderItem = updatedOrder.items.find(item => item.product.toString() === productId);
                await Products.findByIdAndUpdate(productId, { $inc: { stock: orderItem.quantity } });
                selectedStatus.disabled = true;
                
            }

            if ( order.paymentStatus == 'Paid' && selectedStatus == 'Cancelled' || selectedStatus == 'Returned' ) {

                let finalAmount
                
                if (order.discountAmount > 0) {
                    let divededAmount = order.discountAmount / order.items.length
                    finalAmount = cancelProduct.price - divededAmount
                } else {
                    finalAmount = cancelProduct.price
                }


                userWallet.balance += finalAmount
                await userWallet.save();

                const transaction = new Transaction({
                    userId: order.userId ,
                    amount: finalAmount,
                    type: 'Credit', 
                    status: 'Refunded',
                    date: new Date() 
                });

                await transaction.save();
                
            }

            
            if (updatedOrder) {

                return res.json({ success: true, updatedOrder });
                
            } else {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }
            


        }
        catch(err){
            next(err)
        }
    }


}

module.exports = orderController