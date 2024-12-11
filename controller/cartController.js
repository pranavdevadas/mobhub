const Cart = require('../model/cart')
const User  = require('../model/users')
const Products  = require('../model/products')
const Category = require('../model/catogory')
const Brand = require('../model/brand')
const nodemailer = require('nodemailer')
const otpGenerator = require('otp-generator')
const passport = require('passport')
require('dotenv').config()
const cartController = {


    addtocart: async (req,res,next)=>{
        try{
            const userId = req.session.userID || req.user._id;
            const productId = req.params.Id
            const quantity = 1

            const product = await Products.findById(productId)

            if (!product || product.stock === 0) {
                return res.status(400).json({ success: false, message: "Product is out of stock." });
            }

            let usercart = await Cart.findOne({ userId: userId })

            if (!usercart) {
                const newcart = new Cart({
                    userId: userId,
                    items: [{
                        product: productId,
                        price: product.newprice,
                        quantity: quantity
                    }],
                    totalprice: product.newprice * quantity
                });

                await newcart.save();
                
            } else {
                const existingProduct = usercart.items.find(
                    (item) => item.product.toString() === productId.toString()
                )

                if (existingProduct) {
                    existingProduct.quantity += quantity;
                } else {
                    usercart.items.push({
                        product: productId,
                        price: product.newprice,
                        quantity: quantity
                    });
                }

                usercart.totalprice = usercart.items.reduce((total, item) => 
                     total + (item.price * item.quantity)
                , 0);

                await usercart.save();
            }

            return res.status(200).json({ success: true, message: "Item added to cart successfully" });
    }
        catch(err){
            console.error(err);
            return res.status(500).json({ success: false, message: "Internal server error." });
        }
    },

    checkstock: async (req, res, next) => {
        try {
            const productId = req.params.Id;
            const product = await Products.findById(productId);
    
            if (!product) {
                return res.status(404).json({ success: false, message: 'Product not found' })
                
            }

            
    
            if (!req.session.user) {
                return res.status(200).json({ success: false, message: 'Please log in to add items to your cart' })
            }
    
            const usercart = await Cart.findOne({ userId: req.session.userID }).populate('items.product');
            if (!usercart) {
                return res.status(200).json({ success: true, message: 'Product is in stock' })
            }
            
    
            const cartitem = usercart.items.find(item => item.product && item.product._id && item.product._id.toString() === productId.toString());
    
            if (!cartitem) {
                return res.status(200).json({ success: true, message: 'Product is in of stock' })
            }
    
            const maxQuantity = product.stock;
            const currentQuantity = cartitem.quantity;
            if (currentQuantity >= maxQuantity) {
                return res.status(200).json({ success: false, message: 'Maximum quantity reached for this product' })
            }
    
            return res.status(200).json({ success: true, message: 'Product is in stock' })
        } catch (err) {
            next(err);
        }
    },
    
    getcart : async (req,res,next)=>{
        try{

            const userId = req.session.userID 
            const userCart = await Cart.findOne({userId : userId}).populate({path:'items.product', model: 'product' })


            res.render('cart',{
                title: 'Cart',
                user: req.session.user||req.user,
                userCart,
            })
        }
        catch(err){
            next(err)
        }
    },

    updatecart: async (req,res,next)=>{
        try{
            const userId = req.session.userID;
            const action = req.body.action;
            const productId = req.body.productId;

            const userCart = await Cart.findOne({ userId }).populate('items.product');

            if (!userCart) {
                return res.json({ success: false, message: "User cart not found" });
            }

            const cartItem = userCart.items.find(item => item.product._id.toString() === productId);

            if (!cartItem) {
                return res.json({ success: false, message: "Product not found in the cart" });
            }

            const product = await Products.findById(productId);
            const maxQuantity = product.stock;

            if (action === 'increment') {
                if (cartItem.quantity < maxQuantity) {
                    cartItem.quantity += 1;
                } else {
                    return res.json({
                        success: false,
                        message: "Maximum quantity reached for this product",
                    });
                }
            } else if (action === 'decrement') {
                if (cartItem.quantity > 0) {
                    cartItem.quantity -= 1;
                } else {
                    return res.json({
                        success: false,
                        message: "Quantity cannot be less than zero",
                    });
                }
            } else {
                return res.json({
                    success: false,
                    message: "Invalid action",
                });
            }

            userCart.totalprice = userCart.items.reduce((total, item) => 
                 total + item.price * item.quantity
            , 0)

            await userCart.save();
            return res.json({
                success: true,
                cartItem: cartItem,
                totalprice: userCart.totalprice
            });
            
        }
        catch(err){
            next(err)
        }
    },

    deleteCart: async (req, res, next) => {
        try {
            const userId = req.session.userID;
            const productId = req.params.Id;

            const userCart = await Cart.findOne({ userId: userId })

            if (userCart) {
                const cartProductIndex = userCart.items.findIndex(item => item.product.toString() === productId);
    
                if (cartProductIndex !== -1) {
                    userCart.items.splice(cartProductIndex, 1);
                    userCart.totalprice = userCart.items.reduce((total, item) => total + item.price * item.quantity, 0)
                    
                    await userCart.save();
    
                    res.json({ success: true });
                } else {
                    res.json({ success: false, message: 'Product not found in the cart' });
                }
            } else {
                res.json({ success: false, message: 'Cart not found' });
            }
        } catch (err) {
            next(err);
        }
    }
    

}

module.exports = cartController