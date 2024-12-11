const User  = require('../model/users')
const Products  = require('../model/products')
const Category = require('../model/catogory')
const Brand = require('../model/brand')
const nodemailer = require('nodemailer')
const otpGenerator = require('otp-generator')
const passport = require('passport')
require('dotenv').config()
const Cart = require('../model/cart')
const Address = require('../model/address')
const Order = require('../model/orders')
const crypto = require('crypto');
const moment = require('moment')
const Wishlist = require('../model/wishlist')
const Wallet = require('../model/wallet')
const Transaction = require('../model/transaction')
const Coupon = require('../model/coupon')
// const pdf = require('html-pdf')
const path = require('path');
const ejs = require('ejs')
var easyinvoice = require('easyinvoice');
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const bcrypt = require('bcrypt')
const address = require('../model/address')
const coupon = require('../model/coupon')
const { log } = require('console')
const saltpassword = 10

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.NODEMAILER_EMAIL,
      pass: process.env.NODEMAILER_PASS,
    },
})


const userController = {

//home
    userHome: async(req,res,next)=>{
        try{
            const products = await Products.find({ispublished:true}).populate('category').populate('brand').limit(8)
            res.render('home',{
                title : 'Dashboard',
                products : products,
                user: req.session.user||req.user
            })
        }
        catch(err){
            next(err)
        }
    },
//login get
    getuserLogin:(req,res,next)=>{
        try{
            res.render('userLogin',{title:'Login'})
        }
        catch(err){
            next(err)
        }
    },
//login post
    postuserLogin: async (req,res,next)=>{
        try{
            const data = await User.findOne({email:req.body.email})

            if(data){
                const passwordMatch = await bcrypt.compare(req.body.password,data.pass)
                
                if(data.isVerified==false){
                    res.render('otp',{
                        title: "OTP",
                        alert: "Your account is not verified. Please check your email for the verification OTP." ,
                        email: req.body.email
                    })

                }
                else if(data.isBlocked){
                    
                    res.render('userLogin',{
                        alert: 'Sorry! You are blocked.'
                    })
                }
                else if(passwordMatch){
                    const user = true
                    req.session.user = req.body.email,
                    req.session.isUser = true,
                    req.session.userData = data

                    req.session.isLogged = true;
                    req.session.userID = data._id;

                    res.redirect('/dashboard',500,{
                        user: req.session.user
                    })
                }
                else{
                    res.render('userLogin',{
                        title:'Login',
                        alert:'Entered Email or Password is incorrect'
                    })  
                }
            }
            else{
                res.render('userRegister',{
                    title:'Sign Up',
                    signup:'Account does not exist, Please Register.'
                })
            }
        }
        catch(err){
            next(err)
        }
    },
//forgot Password
    forgotPass : (req,res,next) => {
        try {
            res.render('forgotPass',{
                title:'Forgot Password'
            })

        } catch (err) {
            next(err)
        }
    },
//forgot Password
    PostforgotPass : async (req,res,next) => {
            try {
                const { email } = req.body
                const existingUser = await User.findOne({ email : email })
                
                if (existingUser) {

                    const mailOptions = {
                        from: 'pranavdevadas2@gmail.com',
                        to: email,
                        subject: 'Reset Your Password',
                        text: `Click this link and Enter Your New Password https://mobile-hub.shop/forgot-password-email/${email} `,
                    };
        
                    await transporter.sendMail(mailOptions);
    
                    res.render('userLogin',{
                        title:'Login',
                        otpalert: 'Link Sended Successfully'
                    }) 
                } else {
                    res.render('userLogin',{
                        title:'Login',
                        alert: 'No User Found'
                    })
                }

            } catch (err) {
                next(err)
            }
        },  
//forgot Password Email
    getforgotPassMail : async (req,res,next) => {
        try {
            const email = req.params.email
            res.render('forgotpassEmail',{
                title:'Forgot Password',
                email: email
            })
            

        } catch (err) {
            next(err)
        }
    },  
//Post forgot Password Email
emailforgotPass : async (req,res,next) => {
        try {
            const email = req.params.email
            const data = await User.findOne( { email : email })
            const hashedpassword = await bcrypt.hash(req.body.password,saltpassword)

            if (!data) { 
                res.status(404).render('error404')
            } else {
                await User.findOneAndUpdate({ email : email },{
                    pass : hashedpassword
                })

                res.redirect('/login')
            }

        } catch (err) {
            next(err)
        }
    },  


// register get
    getuserRegister:(req,res,next)=>{
        try{
            res.render('userRegister',{title:'Sign up'})
        }
        catch(err){
            next(err)
        }
    },
    //register post

    postuserRegister: async (req, res, next) => {
        try {
            const existingEmail = await User.findOne({ email: req.body.email });

            if (existingEmail) {
                return res.render('userLogin', {
                    title: 'Sign up',
                    alert: 'Email id already exists. Please try with another email id.'
                });
            }

            const hashedPassword = await bcrypt.hash(req.body.password, saltpassword);

            const otp = Math.floor(100000 + Math.random() * 900000);

            const user = new User({
                name: req.body.name,
                email: req.body.email,
                phone: req.body.phone,
                pass: hashedPassword,
                otp: otp
            });

            await user.save();

            const newUser = await User.findOne({ email: req.body.email });
            await Wallet.create({ userId: newUser._id, balance: 0 });

            const referalCode = req.body.referalcode;

            if (referalCode) {
                const referrer = await User.findOne({ referalcode: referalCode });

                if (referrer) {

                    await Wallet.findOneAndUpdate({ userId: referrer._id }, { $inc: { balance: 1000 } })
                    
                    const referrerTransaction = new Transaction({
                        userId: referrer._id,
                        amount: 1000,
                        status: 'Success',
                        type: 'Credit'
                    });
                    await referrerTransaction.save();

                    await Wallet.create({ userId: newUser._id, balance: 1000 });
                    const referredUserTransaction = new Transaction({
                        userId: newUser._id,
                        amount: 1000,
                        status: 'Success',
                        type: 'Credit'
                    })
                    await referredUserTransaction.save();
                } else {

                    const mailOptions = {
                        from: 'pranavdevadas2@gmail.com',
                        to: req.body.email,
                        subject: 'OTP Verification',
                        text: `Your OTP is: ${otp}`,
                    };
        
                    await transporter.sendMail(mailOptions);

                    res.render('otp', {
                        title: 'OTP Verification',
                        email: req.body.email,
                        alert: 'Invalid referral code'
                    });
        
                }
            }

            const mailOptions = {
                from: 'pranavdevadas2@gmail.com',
                to: req.body.email,
                subject: 'OTP Verification',
                text: `Your OTP is: ${otp}`,
            };

            await transporter.sendMail(mailOptions);

            req.session.tempEmail = req.body.email;
            res.render('otp', {
                title: 'OTP Verification',
                email: req.body.email
            });
        } catch (err) {
            next(err);
        }
    },
    
//get otp
    getotp:(req,res,next)=>{
        try{
            res.render('otp',{
                title:'OTP Verification',
                email:req.session.tempEmail,
            })

            res.redirect('/login')
        }
        catch(err){
            next(err)
        }
    },
    postsendotp:(req,res,next)=>{
        try{
            
            const otp = req.body.otp

            transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return res.status(500).json({ error: 'Failed to send OTP' });
            }
            res.json({ success: 'OTP sent successfully' });
            });
        }
        catch(err){
            next(err)
        }
    },
//post verify otp
    postverifyotp: async (req,res,next)=>{
        try {
            const email = req.body.email;
            const user = await User.findOne({ email });

            if (!user) {
                return res.status(404).json({ message: 'User not found. Please check your email and try again.' });
            }

            const userEnteredOtp = req.body.otp;

            if (user.otp === userEnteredOtp) {
                req.session.tempEmail = null;

                user.isBlocked = false;
                user.isVerified = true;
                await user.save();

                return res.status(200).json({ message: 'OTP verified successfully' });
            } else {
                return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
            }

        } catch (err) {
            next(err)
        }

        
    },
// resend otp
    resendotp: async (req,res,next)=>{
        try{

            req.session.tempEmail = req.body.email
            const userEmail = req.session.tempEmail
            
            const user = await User.findOne({email:userEmail})

            const newOTP = Math.floor(100000 + Math.random() * 900000)

            user.otp = newOTP
            await user.save()

            const mailOptions = {
                from: 'pranavdevadas2@gmail.com',
                to: req.body.email,
                subject: 'OTP Verification',
                text: `Your new OTP is: ${newOTP}`,
              }

            await transporter.sendMail(mailOptions)

            req.session.tempEmail = req.body.email
            res.render('otp',{
                title: "OTP",   
                email: req.session.tempEmail,
              })
            

        }
        catch(err){
            next(err)
        }
    },

//search
    search: async (req, res, next) => {
        try{
            const searchTerm = req.query.q;
            const category = req.params.category || undefined;
            const sort = req.query.sort;

            let query = {
                $or: [
                    { productname: { $regex: searchTerm, $options: 'i' } },
                    { description: { $regex: searchTerm, $options: 'i' } },
                ]
            };

            if (category) {
                query.category = category;
            }

            let sortOptions = {};
            if (sort === 'lowToHigh') {
                sortOptions.newprice = 1;
            } else if (sort === 'highToLow') {
                sortOptions.newprice = -1;
            } else if (sort === 'A-Z') {
                sortOptions.productname = 1;
            } else if (sort === 'Z-A') {
                sortOptions.productname = -1;
            } else if (sort === 'newarrivals') {
                sortOptions.created = -1;
            }

            let searchResult = await Products.find(query).sort(sortOptions);

            res.render('search', {
                products: searchResult,
                title: 'Dashboard',
                user: req.session,
                text: searchTerm
            });
        }
        catch(err){
            next(err)
        }
    },
      
//shop 
    getshop:async(req,res,next)=>{
        try{
            
            const category = req.params.category || undefined; 
            const page = parseInt(req.query.page) || 1; 
            const limit = 7; 
            const skip = (page - 1) * limit;

            const listedCategories = await Category.find({ isListed: true });
            const categoryIds = listedCategories.map(category => category._id);
            
            let query = { ispublished: true };

            if (category) {
                query.category = category;
            }

            const totalItems = await Products.countDocuments(query);
            const totalPages = Math.ceil(totalItems / limit);

            const sort = req.query.sort || 'default';

            let sortOptions = {};
            if (sort === 'lowToHigh') {
                sortOptions = { newprice: 1 };
            } else if (sort === 'highToLow') {
                sortOptions = { newprice: -1 };
            } else if (sort === 'A-Z') {
                sortOptions = { productname: 1 };
            } else if (sort === 'Z-A') {
                sortOptions = { productname: -1 };
            } else if (sort === 'newarrivals') {
                sortOptions = { created: -1 };
            }

            const products = await Products.find(query)
                .sort(sortOptions)
                .skip(skip)
                .limit(limit)
                .populate('brand')
                .populate('category');

            const cate = await Category.find({ isListed: true });

            res.render('shop', {
                title: 'Shop',
                products: products,
                cate: cate,
                user: req.session.user || req.user,
                sort: sort,
                text: category,
                totalPages: totalPages,
                currentPage: page
            });
 
        }
        catch(err){
            next(err)
        }
    },
    
// 404  error
    error:(req,res)=>{
        res.render('error404')
    },  
//get product list 
    getproductlist:async (req,res,next)=>{
        try{
            const user = await User.find({isBlocked : false})
            const products = await Products.find({ispublished:true})
            const brand = await Brand.find({isListed:true})
            const category = await Category.find({isListed:true})
            res.render('home',{
                title : 'Home',
                category : category,
                products : products,
                brand : brand,
                user : user
            })
            
        }
        catch(err){
            next(err)
        }
},
//get product detials
    getProductDetials: async(req,res,next)=>{
        try{
            const Id = req.params.Id
            const product = await Products.find({_id:Id}).populate('category').populate('brand')
            if(!product){
                res.redirect('/')
            }
            else{
                res.render('productDetials',{
                    title :'Product Detials',
                    product : product
                })
            }
            
        }
        catch(err){
            next(err)
        }
    },
//checkout page
    checkout: async (req,res,next)=>{
        try{

            const itemId = req.query.itemId

            if(itemId) {
                const userId = req.session.userID
                const userCart = await Order.findById(itemId).populate({path:'items.product', model: 'product' })
                const addressDocument = await Address.findOne({ userId: userId });


                const coupon = []


                let addresses = []
    
                if (addressDocument) {
                    addresses = addressDocument.addresses || []
                }

                res.render('checkout', {
                    title: 'Checkout',
                    user: req.session ||req.user,
                    userCart,
                    addresses: addresses,
                    userData : req.session.userData,
                    coupon,
                })
            } else {
                const userId = req.session.userID
                const userCart = await Cart.findOne({userId : userId}).populate({path:'items.product', model: 'product' })
                const addressDocument = await Address.findOne({ userId: userId });

                const coupon = await Coupon.find({
                    isListed: true,
                    expiryDate: { $gt: new Date() },
                    userId: { $ne: userId } 
                });
                let addresses = []
    
                if (addressDocument) {
                    addresses = addressDocument.addresses || []
                }
    
                res.render('checkout', {
                    title: 'Checkout',
                    user: req.session ||req.user,
                    userCart,
                    addresses: addresses,
                    userData : req.session.userData,
                    coupon
                })
            }
            
        }
        catch(err){
            next(err)
        }
    },
// check out post
    postcheckout: async(req,res,next) => {
        try{
            const itemId = req.body.orderId
            const userId = req.session.userID
            const existingOrder = await Order.findOne({ _id : itemId })

            if(existingOrder) {  
                await Order.findOneAndUpdate(
                    { _id: itemId }, 
                    { paymentStatus: 'Paid' }, 
                    { new: true } 
                );

            } else {
                const { addressId, paymentMethod, totalprice, paymentStatus, discount, coupon } = req.body
                const totalprice1 = parseFloat(totalprice)
                const user = await User.findById(req.session.userID)
                const cartItems = JSON.parse(req.body.cartItem);
                let userAddress = await Address.findOne({ 'addresses._id': addressId });
                
                const address = userAddress.addresses.find(
                    (addr) => addr._id.toString() === addressId
                )
                const items = [];

                for (const item of cartItems) { 
                    if (item.quantity) { 
                        items.push({
                            product: item.product,
                            price: item.price,
                            quantity: item.quantity,
                        });
                    } else {
                        console.error(`Quantity missing for item ${item._id}`)
                    }
                }

                let NumDiscount 

                if (!discount) {
                    NumDiscount = 0
                }
                else {
                    NumDiscount = parseFloat(discount)
                }
                const order = new Order ({
                    userId : user._id,
                    items: items,
                    totalprice : totalprice1,
                    billingdetails: {
                        name: user.name,
                        buildingname: address.buildingname,
                        city: address.city,
                        state: address.state,
                        country: address.country,
                        postalCode: address.pincode,
                        phone: user.phone,
                        email: user.email,
                    },
                    amount: totalprice1 + NumDiscount ,
                    paymentMethod,
                    discountAmount: NumDiscount ,
                    paymentStatus: paymentStatus
                })

                await order.save()

                await Cart.findOneAndUpdate(
                    { userId: user._id },
                    { $set:{ items: [],totalprice: 0 } }
                )

                for(const item of order.items){
                    await Products.findByIdAndUpdate(
                        item.product,
                        { $inc: { stock : -item.quantity } },
                        { new: true }
                    )
                }

                const cartUserId = await Coupon.findOneAndUpdate(
                    { coupon : coupon },
                    { $push:{ userId : req.session.userID } },
                    { new : true }
                )

                }
                if(req.body.paymentStatus ==='Failed') {
                    res.redirect('/orders')
                } else {
                    res.render('thankyouorder')
                }
            

        }
        catch(err){
            next(err)
        }
    },
// check coupon 
    checkCoupon: async (req,res,next)=>{
        try{
            const coupon = await Coupon.findOne({ coupon : req.body.couponCode})
            if(!coupon) {
                return res.status(404).json({ message: 'coupon not found'})
            } else {

                const user = req.session.userID
                const usedCoupon = await Coupon.findOne({userId: user })
                const userId = req.session.userID
                const userCart = await Cart.findOne({ userId : userId })
                let totalAmount = userCart.totalprice
            
                const amountDividedByPercentage = Math.ceil(totalAmount * coupon.percentage/100)
                
                if (amountDividedByPercentage > coupon.maximumamount) {

                    const amountToPay = totalAmount - coupon.maximumamount
                    return res.status(200).json({ totalAmount : amountToPay, couponId : req.body.couponCode, discountAmount : coupon.maximumamount })

                } else {

                    amountToPay = totalAmount - amountDividedByPercentage
                    return res.status(200).json({ totalAmount : amountToPay, couponId : req.body.couponCode, discountAmount : amountDividedByPercentage })

                }
            }
        }
        catch(err){
            next(err)
        }
    },

//my profile
    myprofie: async (req,res,next)=>{
        try{

            const userId = req.session.userID;
            const addressDocument = await Address.findOne({ userId: userId });

            if (addressDocument && addressDocument.addresses) {

                res.render('myprofile', {
                    title: 'My profile',
                    user: req.session.user,
                    addresses: addressDocument.addresses,
                    userId
                });
            } else {
                res.render('myprofile', {
                    title: 'My profile',
                    user: req.session.user,
                    addresses: []
                });
            }
        }
        catch(err){
            next(err)
        }
    },

//get my addres
    getmyaddress: async (req,res,next) => {
        try{
            
            const userId = req.session.userID;
        const addressDocument = await Address.findOne({ userId: userId });

        if (!addressDocument || !addressDocument.addresses || addressDocument.addresses.length === 0) {
            // No addresses found, render a message
            return res.render('myAddress', {
                user: req.session,
                addresses: [],
                message: "No addresses found. Please add an address.",
                addAddressLink: "/addaddress" // Provide a link to add a new address
            });
        }

        res.render('myAddress', {
            user: req.session,
            addresses: addressDocument.addresses
        });
        }
        catch(err){
            next(err)
        }
    },
//add new address
    addaddress: async (req,res,next) => {
        try{
            res.render('addaddress',{
                title: 'My Address',
                user: req.session
            })
        }
        catch(err){
            next(err)
        }
    },

// edit address
    geteditaddress: async (req,res,next) => {
        try{
            const addressId = req.params.Id
            const userId = req.session.userID || req.user._id;
            let userAddress = await Address.findOne({ userId: userId });

            const address = userAddress.addresses.find(
                (addr) => addr._id.toString() === addressId
            )

            res.render('editAddress',{
                title: 'Edit Address',
                address: address,
                user: req.session.userID,
                message:'Address edited successfully',
            })
        }
        catch(err){
            next(err)
        }
    },
//post edit address
    posteditaddress: async (req,res,next)=>{
        try{
            const addressId = req.params.Id
            const userId = req.session.userID || req.user._id;
            let userAddress = await Address.findOne({ 'addresses._id': addressId });
            // const { buildingname, pincode, city, state, country } = req.body
            
            const address = userAddress.addresses.find(
                (addr) => addr._id.toString() === addressId
            )

            address.buildingname = req.body.buildingname,
            address.pincode = req.body.pincode,
            address.city = req.body.city,
            address.state = req.body.state,
            address.country = req.body.country

            await userAddress.save()

            res.render('myAddress',{
                title: 'My Address',
                message: 'Successfully Address Updated',
                user: req.session.userID,
                addresses: userAddress.addresses,
                userId : req.session.userID
            })
            
    }
        catch(err){
            next(err)
        }
    },
// delete address
    deleteAddress: async (req,res,next) => {
        
        try{
            const addressId = req.params.Id
            const userId=req.session.userID
            

            const deletedAddress = await Address.findOneAndUpdate(
                { userId: userId },
                { $pull: { addresses: { _id: addressId } } },
                { new: true }
            )

            res.render('myAddress', {
                message: 'Address Deleted Successfully',
                user: req.session.userId,
                addresses: address.addresses
            });
        }
        catch(err){
            next(err)
        }
    },
//add address post
    postaddaddress: async (req,res,next)=>{
        try{
            const userId = req.session.userID || req.user._id;
            
            let userAddress = await Address.findOne({ userId: userId });

            if (!userAddress) {
                userAddress = new Address({
                    userId: userId,
                    addresses: [{
                        buildingname: req.body.buildingname,
                        pincode: req.body.pincode,
                        city: req.body.city,
                        state: req.body.state,
                        country: req.body.country
                    }]
                });
            } else {

                userAddress.addresses.push({
                    buildingname: req.body.buildingname,
                    pincode: req.body.pincode,
                    city: req.body.city,
                    state: req.body.state,
                    country: req.body.country
                });
            }

            await userAddress.save();

            res.status(200).render('myAddress',{
                message:'Address added successfully',
                user: req.session.user,
                addresses: userAddress.addresses
            })
                
            }   
            catch(err){
                next(err)
            }
        },
//get account detials
    getaccontdetials: async (req,res,next) => {
        try{
            
            const userId = req.session.userID;
            const user = await User.findById(userId)

            res.render('accountdetials',{
                user: req.session,
                users: user,
                user: req.session,
                userId
            })
        }
        catch(err){
            next(err)
        }
    },
//post edit profile
    posteditprofile: async (req,res,next) => {
        try{

            // const userId = req.params.Id
            const userId = req.session.userID;
            const addressDocument = await Address.findOne({ userId: userId });

            await User.findByIdAndUpdate(userId,{
                name:req.body.name,
                email:req.body.email,
                phone:req.body.phone,
                
            })
            res.render('accountdetials',{
                title: 'Account Detials',
                message: 'Updated Sucessfully',
                user: req.session.userID,
                userId
            })            

        }
        catch(err){
            next(err)
        }
    },
// edit profile
    geteditprofile: async (req,res,next) => {
        try{
            const userId = req.params.Id
            const user = await User.findById(userId)


            res.render('editProfile',{
                title: 'Edit Profile',
                users: user,
                user: req.session.userID,

            })
        }
        catch(err){
            next(err)
        }
    },
// reset password
    resetpassword: async (req,res,next) => {
        try{
            const userId = req.params.Id
            const users = await User.findById(userId)


            res.render('resetPassword',{
                user: req.session,
                title: 'Reset Password',
                users: users,
                user: req.session
            })
        }
        catch(err){
            next(err)
        }
    },
// post reset password
    postresetpassword: async (req,res,next)=>{
        try{
            const userId = req.params.Id
            const data = await User.findById(userId)
            const passwordMatch = await bcrypt.compare(req.body.currentpassword,data.pass)
            const hashedpassword = await bcrypt.hash(req.body.newpassword,saltpassword)

            if(passwordMatch){
                await User.findByIdAndUpdate(userId,{
                    pass : hashedpassword
                })
                res.render('accountdetials',{
                    message: 'Password Updated Successfully',
                    title: 'Account Detials',
                    users: data,
                    user: req.session,
                    userId
                })
            }
            else{
                res.render('accountdetials',{
                    alert : 'Entered Wrong current password & Try again',
                    user: req.session,
                    userId,
                })
            }
        }
        catch(err){
            next(err)
        }
    },


// get orders
    getorders: async (req,res,next) =>{
        try{
            const userId = req.session.userID 
            const page = parseInt(req.query.page) || 1; 
            const limit = 10; 
            const skip = (page - 1) * limit;

            const totalItems = await Order.countDocuments({userId : userId});
            const totalPages = Math.ceil(totalItems / limit);

            const orders = await Order.find({userId : userId}).skip(skip).limit(limit).populate('items.product').sort({ orderDate : -1 })

            
            res.render('myorders', {
                title: 'My orders',
                user: req.session,
                order: orders,
                totalPages: totalPages,
                currentPage: page
            });
        }
        catch(err){
            next(err)
        }
    },
//order details page
    orderdetail: async (req,res,next) => {
        try{
            
            const orderId = req.params.Id
            const userId = req.session.userID
            const orders = await Order.findOne({ _id : orderId}).populate('items.product')
            const user = await Order.findOne({ userId : userId })
            
        
            res.render('orderDetial',{
                title: 'Order Detials',
                user: req.session,
                order: orders,
                users: user,
            })
        }
        catch(err){
            next(err)
        }
    },
// cancel order
    cancelorder: async (req,res,next) => {
        try{

            const userId = req.session.userID 
            const userWallet = await Wallet.findOne({userId : userId})
            const { orderId, productId } = req.body;

            const order = await Order.findById(orderId);

            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }

            const cancelProduct = order.items.find(item => item.product.toString() === productId)

            if (!cancelProduct) {
                return res.status(404).json({ message: 'Product not found in order' });
            }

            await Products.findByIdAndUpdate(cancelProduct.product, { $inc: { stock: cancelProduct.quantity } });
            

            cancelProduct.status = 'Cancelled';
            await order.save();

            let finalAmount

            if (order.discountAmount > 0) {
                let divededAmount = order.discountAmount / order.items.length
                finalAmount = cancelProduct.price - divededAmount
            } else {
                finalAmount = cancelProduct.price
            }

            userWallet.balance += cancelProduct.price;
            await userWallet.save();

            const transaction = new Transaction({
                userId: userId,
                amount: finalAmount,
                type: 'Credit', 
                status: 'Refunded',
                date: new Date() 
            });

            await transaction.save();

            res.status(200).json({ message: 'Product Cancelled Successfully', cancelProduct });
            
        }
        catch(err){
            next(err)
        }
    },

// refund order
    returnorder: async (req,res,next) => {
        try{

            const userId = req.session.userID 
            const userWallet = await Wallet.findOne({userId : userId})
            const { orderId, productId } = req.body;

            const order = await Order.findById(orderId);

            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }

            const cancelProduct = order.items.find(item => item.product.toString() === productId)

            if (!cancelProduct) {
                return res.status(404).json({ message: 'Product not found in order' });
            }

            await Products.findByIdAndUpdate(cancelProduct.product, { $inc: { stock: cancelProduct.quantity } });
            

            cancelProduct.status = 'Returned';
            await order.save();

            let finalAmount

            if (order.discountAmount > 0) {
                let divededAmount = order.discountAmount / order.items.length
                finalAmount = cancelProduct.price - divededAmount
            } else {
                finalAmount = cancelProduct.price
            }

            userWallet.balance += cancelProduct.price;
            await userWallet.save();

            const transaction = new Transaction({
                userId: userId,
                amount: finalAmount,
                type: 'Credit', 
                status: 'Refunded',
                date: new Date() 
            });

            await transaction.save();

            res.status(200).json({ message: 'Product Cancelled Successfully', cancelProduct });
            
        }
        catch(err){
            next(err)
        }
    },
//wishlist
    getwishlist: async (req,res,next) => {
        try{

            const userId = req.session.userID 
            const userWishlist = await Wishlist.findOne({ userId : userId }).populate({ path : 'items.product', model : 'product' })
            if (!userWishlist || !userWishlist.items || userWishlist.items.length === 0) {
                return res.render('wishlist', {
                    title: 'Wishlist',
                    user: req.session,
                    userWishlist: null  
                });
            }
    
            userWishlist.items.sort((a, b) => b.wishlistDate - a.wishlistDate);
    
            res.render('wishlist', {
                title: 'Wishlist',
                user: req.session,
                userWishlist: userWishlist
            });
        }
        catch(err){
            next(err)
        }
    },
// add to wishlist
    addtowishlist: async (req,res,next) => {
        try{
            const userId = req.session.userID || req.user._id;
            const productId = req.params.Id
            const quantity = 1

            const product = await Products.findById(productId)
            
            if (!product || product.stock === 0) {
                return res.status(400).json({ success: false, message: "Product is out of stock." });
            }

            let userWishlist = await Wishlist.findOne({ userId: userId })

            if (!userWishlist) {

                const newwishlist = new Wishlist({
                    userId: userId,
                    items: [{
                        product: productId,
                        price: product.newprice,
                        quantity: quantity
                    }]
                });

                await newwishlist.save();
                
            } else {

                const existingProduct = userWishlist.items.find(
                    (item) => item.product.toString() === productId.toString()
                )

                if (existingProduct) {
                    // existingProduct.quantity += quantity;
                    return true
                } else {
                    userWishlist.items.push({
                        product: productId,
                        price: product.newprice,
                        quantity: quantity
                    });
                }

                await userWishlist.save();
            }

            // return res.status(200).json({ success: true, message: "Item added to cart successfully" });
            return res.redirect('back')
        }
        catch(err){
            next(err)
        }
    },
// remove from wishlist
    deleteWishlist: async (req, res, next) => {
        try {
            const userId = req.session.userID;
            const productId = req.params.Id;

            const userWishlist = await Wishlist.findOne({ userId: userId })

            if (userWishlist) {
                const wishlistProductIndex = userWishlist.items.findIndex(item => item.product.toString() === productId);
    
                if (wishlistProductIndex !== -1) {
                    userWishlist.items.splice(wishlistProductIndex, 1);
                    
                    await userWishlist.save();
    
                    res.json({ success: true });
                } else {
                    res.json({ success: false, message: 'Product not found in the wishlist' });
                }
            } else {
                res.json({ success: false, message: 'Wishlist not found' });
            }
        } catch (err) {
            next(err);
        }
    },
// wallet 
    wallet: async (req, res, next) => {
        try {
            const userId = req.session.userID 
            const userWallet = await Wallet.findOne({userId : userId})

            const currentPage = parseInt(req.query.page) || 1; 
            const limit = 10; 
            const skip = (currentPage - 1) * limit;

            const totalItems = await Transaction.countDocuments({userId : userId});
            const totalPages = Math.ceil(totalItems / limit);

            const transactions = await Transaction.find({ userId: req.session.userID }).skip(skip).limit(limit).sort({ date: -1 });

            res.render('wallet',{
                title: 'Wallet',
                user: req.session,
                userData : req.session.userData,
                userWallet,
                transactions,
                totalPages,
                currentPage
            })
        } catch (err) {
            next(err);
        }
    },
//add amout to wallet
    postAddAmount: async (req,res,next)=>{
        try{
            const userId = req.session.userID;
            const amount = parseFloat(req.body.amount);

            let userWallet = await Wallet.findOne({ userId: userId });
            if (!userWallet) {
                userWallet = new Wallet({
                    userId: userId,
                    balance: amount
                });

            } else {
                userWallet.balance += amount;
            }

            await userWallet.save();

            const transaction = new Transaction({
                userId: userId,
                amount: amount,
                type: 'Credit', 
                status: 'Success',
                date: new Date() 
            });

            await transaction.save();

            res.status(200).json({ success: true });

        }
        catch(err){
            next(err)
        }
    },
//transaction
    getTransactionHistory: async (req, res, next) => {
        try {
            const userId = req.session.userID;
            const transactions = await Transaction.find({ userId }).sort({ date: -1 });
            res.json(transactions);
        } catch (err) {
            next(err);
        }
    },
// check wallet balance 
    checkWalletBalance: async (req,res,next) => {
        try {

            const userId = req.session.userID;
            const { totalPrice } = req.body;
    
            const userWallet = await Wallet.findOne({ userId: userId });
    
            if (!userWallet) {
                return res.status(404).json({ success: false, message: 'Wallet not found' });
            }
    
            if (userWallet.balance+1 <= totalPrice) {
                return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
                
            } else {
                res.json({ success: true, balance: userWallet.balance });
                userWallet.balance -= totalPrice;
                await userWallet.save();

                const transaction = new Transaction({
                    userId: userId,
                    amount: '-' + totalPrice,
                    type: 'Debit',
                    status: 'Success',
                    date: new Date()
                });
                await transaction.save();
                
            }
            

        } catch(err){
            next(err)
        }
    },
    //invoice
    getOrderInvoice : async(req,res,next) => {
        try{
    
            const categoryData = await Category.find({isListed : true})
            const orderId = req.params.Id;
            const userId = req.session.userID;
            const order = await Order.findOne({ _id : orderId}).populate('items.product')
            const user = await Order.findOne({ userId : userId })

            const invoiceTemplatePath = path.join(__dirname, '..', 'views', 'invoice.ejs');
            const invoiceHtml = await ejs.renderFile(invoiceTemplatePath, {  order, user });

            const pdfPath = path.join(__dirname, '..', 'views', 'invoice.pdf');
            // const browser = await puppeteer.launch({
            //     executablePath: '/usr/bin/google-chrome',
            //     headless: true
            // });
            const browser = await puppeteer.launch({
                dumpio: true,
                headless: true,
                executablePath: "/usr/bin/chromium-browser",
                args: ["--disable-setuid-sandbox", "--no-sandbox", "--disable-gpu"],
            });
            const page = await browser.newPage();
            await page.setContent(invoiceHtml);
            await page.pdf({ path: pdfPath, format: 'A4' });
            await browser.close();

            res.download(pdfPath, 'invoice.pdf', (err) => {
                if (err) {
                    throw err;
                }
                fs.unlinkSync(pdfPath);
            });
            
    
        } catch (err){
            next(err)
        }
    },
    







//logout
    getlogout: (req, res, next) => {
        try {
            req.session.user = null
            req.user = null
            
            res.render('userLogin',{
                title:'Login',
                logout:'Logout Successfully',
                
            })
        } catch (err) {
            next(err);
        }
    },







    
}


module.exports= userController