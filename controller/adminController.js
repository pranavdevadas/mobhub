const session = require('express-session')
const User  = require('../model/users')
const isAdmin = require('../middlewares/isAdmin')
require('dotenv').config()
const AdminCridentials = require('../model/admincridentials')
const Coupon = require('../model/coupon')
const Order = require('../model/orders')
const Products = require('../model/products')
const puppeteer = require('puppeteer-core');




const cridentials = {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASS
}

const adminController = {

//admin home
    adminHome : async (req,res,next)=>{
        try{

            const users = await User.find()
            const orders = await Order.find()
            const products = await Products.find()
            const ordersPie = await chart()
            const ordersGraph = await monthgraph();
            const ordersYearGraph = await yeargraph();
            const paidOrders = orders.filter(order => order.paymentStatus === "Paid");
            const filteredOrders = orders.filter(order => order.paymentStatus !== "Failed" && order.status !== "Cancelled")
                  
          
            let revenue = 0;
            paidOrders.forEach(order => {
                revenue += order.totalPrice;
            });



            const order = await Order.find().populate('items.product').sort({ orderDate : -1 })

            const salesCount = await Order.aggregate([
                { $match : { 'items.status' : 'Delivered' } },
                { $count : 'salesCount' }
            ])

            let count = 0

            if (salesCount.length > 0) {
               count =  salesCount[0].salesCount;
            } else {
               count = 0; 
            }

            const orderSum = await Order.aggregate([
                { $group : { _id : null, totalAmount : { $sum : '$totalprice' } } },
            ])

            let orderAmount = 0  

            if (orderSum.length > 0) {
                orderAmount =  orderSum[0].totalAmount;
            } else {
                orderAmount = 0; 
            }

            const discountSum = await Order.aggregate([
                { $group : { _id : null, discountAmount : { $sum : '$discountAmount' } } },
            ])

            let discountAmount = 0  

            if (discountSum.length > 0) {
                discountAmount =  discountSum[0].discountAmount;
            } else {
                discountAmount = 0; 
            }

            res.render('admin/adminHome',{
                title: 'Dashboard',
                count,
                orderAmount,
                discountAmount,
                order,
                ordersPie:ordersPie,
                ordersGraph: ordersGraph,
                ordersYearGraph: ordersYearGraph,
                revenue: revenue.toFixed(2),
                orders:filteredOrders,products:products,
                users: users,
            })
            
        }
        catch(err){
            next(err)
        }
    },

//admin login get
    getadminLogin:(req,res,next)=>{
        try{
            res.render('admin/adminLogin',{title:'Admin Login'})
        }
        catch(err){
            next(err)
        }
    },
//admin login post
    postadminLogin : (req,res,next)=>{
        try{

            if(req.body.email === process.env.ADMIN_EMAIL &&  req.body.password === process.env.ADMIN_PASS){
                const admin = true
                    req.session.admin = req.body.email,
                    req.session.isAdmin = true,
                    res.redirect('/admin')
            }
            else{
                res.render('admin/adminLogin',{
                    title:'Admin Login',
                    alert:'Invalid Email or Password'
                })
            }
        }
        catch(err){
            next(err)
        }
    },
//logout
getlogout: (req, res, next) => {
        try {
            req.session.admin = null;
            res.render('admin/adminLogin',{
                title:'Admin Login',
                logout:'Logout Successfully'
            })
        } catch (err) {
            next(err);
        }
    },
    
    error:(req,res)=>{
        res.render('error404')
    },
    
// get coupon
    getCoupon: async (req,res,next) => {
        try{
            const coupon = await Coupon.find()

            res.render('admin/coupon',{
                title:'Brands',
                coupon: coupon
            })

        }
        catch(err){
            next(err)
        }
    },
//get add coupon
    getAddCoupon: (req,res,next) => {
        try{
            
            res.render('admin/addcoupon',{
                title: 'Add Coupon'
            })

        }
        catch(err){
            next(err)
        }
    },
// add coupon post
    postaddcoupon: async (req,res,next)=>{
        try{
            const existingcoupon = await Coupon.findOne({coupon:req.body.coupon})
            if(existingcoupon){
                res.render('admin/addcoupon',{
                    title:'Add Coupon',
                    alert: 'Coupon is alredy exist, try with other Coupon'
                })
            }
            else{
                const coupon = new Coupon({
                    coupon: req.body.coupon,
                    description: req.body.description,
                    percentage: req.body.percentage,
                    minimumamount: req.body.minimumamount,
                    maximumamount: req.body.maximumamount,
                    expiryDate: req.body.expiryDate
                })
                await coupon.save()
                res.redirect('/admin/coupon')
            }
        }
        catch(err){
            next(err)
        }
    },
//publish and unpublish brand
    unpublishcoupon: async (req,res,next)=>{
        try{
            const Id = req.params.Id
            await Coupon.findByIdAndUpdate(Id, { isListed: false })
            res.redirect('/admin/coupon')
        }
        catch(err){
            next(err)
        }
    },
    publishcoupon: async (req,res,next)=>{
        try{
            const Id = req.params.Id
            await Coupon.findByIdAndUpdate(Id, { isListed: true })
            res.redirect('/admin/coupon')
        }
        catch(err){
            next(err)
        }
    },
// generate report
    generateReport : async (req,res,next) => {
        try{
            const { startDate, endDate } = req.body;   

            const endDateObj = new Date(endDate);
            endDateObj.setDate(endDateObj.getDate() +1);

            const orders = await Order.aggregate([
                { $match: { orderDate: { $gte: new Date(startDate), $lte: new Date(endDateObj) } }},
                { $unwind: "$items" }, 
                // { $match: { "items.status": "Delivered" }},
                { $lookup: { 
                    from: "products", 
                    localField: "items.product",
                    foreignField: "_id",
                    as: "items.product"
                }},
                { $addFields: { "items.product": { $arrayElemAt: ["$items.product", 0] } }},
                { $group: { 
                    _id: "$_id",
                    userId: { $first: "$userId" },
                    items: { $push: "$items" },
                    totalPrice: { $first: "$totalprice" },
                    couponDiscount: { $first: "$discountAmount" },
                    billingDetails: { $first: "$billingdetails" },
                    paymentStatus: { $first: "$paymentStatus" },
                    orderDate: { $first: "$orderDate" },
                    paymentMethod: { $first: "$paymentMethod" }
                }}
            ]);

            const reportData = orders.map((order, index) => {
                let totalPrice = 0;
                order.items.forEach(product => {
                    totalPrice += product.price * product.quantity;
                });
                return {
                    orderId: order._id,
                    date: order.orderDate,
                    totalPrice,
                    products: order.items.map(product => ({
                        productName: product.product.productname,
                        quantity: product.quantity,
                        price: product.price
                    })),
                    firstName: order.billingDetails.name,
                    address: order.billingDetails.city, 
                    paymentMethod: order.paymentMethod,
                    paymentStatus: order.paymentStatus
                };
            });

            res.json({ reportData });
        }
        catch(err){
            next(err)
        }
    },
    
// graphs
    fetchdashboard:async (req, res, next) => {
      
        try {
          const users = await User.find().exec();
          const orders = await Order.find().exec();
          const products = await Products.find()
          const ordersPie = await chart();
    
          
          res.json({
            title: "Admin Home",
            users: users,
            orders: orders,
            products: products,
            ordersPie: ordersPie,
          });
        } catch (err) {
          next(err);
        }
      },

      bestselling: async (req,res,next) => {
        try {
            const bestSellingBrands = await Order.aggregate([
                { $unwind: '$items' },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'items.product',
                        foreignField: '_id',
                        as: 'product',
                    },
                },
                { $unwind: '$product' },
                {
                    $group: {
                        _id: '$product.brand',
                        totalQuantity: { $sum: '$items.quantity' },
                    },
                },
                { $sort: { totalQuantity: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: 'brands',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'brand',
                    },
                },
                { $unwind: '$brand' },
                {
                    $project: {
                        _id: '$brand._id',
                        brandName: '$brand.brand',
                        totalQuantity: 1,
                    },
                },
            ]);

            const bestSellingCategories = await Order.aggregate([
                { $unwind: '$items' },
                {
                  $lookup: {
                    from: 'products',
                    localField: 'items.product',
                    foreignField: '_id',
                    as: 'product',
                  },
                },
                { $unwind: '$product' },
                {
                  $group: {
                    _id: '$product.category',
                    totalQuantity: { $sum: '$items.quantity' },
                  },
                },
                {
                  $sort: { totalQuantity: -1 },
                },
                {
                  $limit: 10, 
                },
                {
                  $lookup: {
                    from: 'categories',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'category',
                  },
                },
                { $unwind: '$category' },
                {
                  $project: {
                    _id: '$category._id',
                    category: '$category.category',
                    totalQuantity: 1,
                  },
                },
              ]);

              const bestSellingProducts = await Order.aggregate([
                { $unwind: '$items' },
                {
                  $group: {
                    _id: '$items.product',
                    totalQuantity: { $sum: '$items.quantity' },
                  },
                },
                { $sort: { totalQuantity: -1 } },
                { $limit: 10 }, 
                {
                  $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product',
                  },
                },
                { $unwind: '$product' },
                {
                  $project: {
                    _id: '$product._id',
                    productTitle: '$product.productname',
                    totalQuantity: 1,
                  },
                },
              ]);
              
            res.render('admin/bestSelling', { 
                bestSellingBrands,
                bestSellingCategories,
                bestSellingProducts 
            });
        } catch(err) {
            next(err)
        }
    }









}
   
    async function chart() {
        try {
            const orders = await Order.find();
            const paymentMethods = {
                cashOnDelivery: 'COD',
                razorPay: 'Razorpay',
                wallet: 'Wallet'
            };
            const ordersCount = {
                cashOnDelivery: 0,
                razorPay: 0,
                wallet: 0
            };

            orders.forEach(order => {
                if (order.paymentMethod === paymentMethods.cashOnDelivery) {
                    ordersCount.cashOnDelivery++;
                } else if (order.paymentMethod === paymentMethods.razorPay) {
                    ordersCount.razorPay++;
                } else if (order.paymentMethod === paymentMethods.wallet) {
                    ordersCount.wallet++;
                }
            });

            return ordersCount;
        } catch (error) {
            console.error("An error occurred in the chart function:", error.message);
            throw error;
        }
    }



    async function monthgraph() {
        try {
            const ordersCountByMonth = await Order.aggregate([
                {
                    $project: {
                        yearMonth: {
                            $dateToString: {
                                format: "%Y-%m",
                                date: "$orderDate"
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: "$yearMonth",
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { _id: 1 }
                }
            ]);
    
            const labels = ordersCountByMonth.map(val => val._id);
            const count = ordersCountByMonth.map(val => val.count);
    
            return {
                labels: labels,
                count: count
            };
        } catch (error) {
            console.log('Error retrieving orders in monthgraph function:', error.message);
            throw error;
        }
    }
    


    async function yeargraph() {
        try {
            const ordersCountByYear = await Order.aggregate([
                {
                    $project: {
                        year: { $year: { date: '$orderDate' } },
                    },
                },
                {
                    $group: {
                        _id: '$year',
                        count: { $sum: 1 },
                    },
                },
                {
                    $sort: { _id: 1 },
                },
            ]);
    
            const labels = ordersCountByYear.map((val) => val._id.toString());
            const count = ordersCountByYear.map((val) => val.count);
    
            return {
                labels: labels,
                count: count
            };
        } catch (error) {
            console.log('Error retrieving orders in yeargraph function:', error.message);
            throw error;
        }
    }
    
module.exports= adminController