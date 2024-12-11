const express = require('express')
const router= express.Router()
const userController = require('../controller/userController')
const User = require('../model/users')
const Products  = require('../model/products')
const Brand = require('../model/brand')
const Category = require('../model/catogory')
const isUser = require('../middlewares/isUser')
const isAuth = require('../middlewares/auth')
const authController = require('../middlewares/auth')
const cartController = require('../controller/cartController')


router.get('/',userController.userHome)
router.get('/dashboard',isUser,userController.userHome)

router.get('/login',userController.getuserLogin)
router.post('/login',userController.postuserLogin)
router.get('/register',userController.getuserRegister)
router.post('/register',userController.postuserRegister)
router.get('/logout',userController.getlogout)
router.get('/forgot-password',userController.forgotPass)
router.post('/post-forgot',userController.PostforgotPass)
router.get('/forgot-password-email/:email',userController.getforgotPassMail)
router.post('/email-forgot/:email',userController.emailforgotPass)




router.get('/productdetials/:Id',isUser,userController.getProductDetials)

router.post('/sendOtp',userController.postsendotp)
router.post('/verifyOtp',userController.postverifyotp)
router.post('/resendOtp',userController.resendotp)


router.get('/auth/google',authController.googleAuth)
router.get('/auth/google/callback',authController.googleAuthCallback)

router.get('/search',userController.search)
router.get('/priceFilterr/:category?',userController.search)

router.get('/shop',userController.getshop)
router.get('/priceFilter/:category?',isUser,userController.getshop);
router.get('/categoryFilter/:category?',isUser, userController.getshop);


router.get('/check-stock/:Id',isUser,cartController.checkstock)
router.get('/addtocart/:Id',isUser,cartController.addtocart)
router.get('/cart',isUser,cartController.getcart)
router.post('/update-cart',cartController.updatecart)
router.delete('/remove-from-cart/:Id',isUser,cartController.deleteCart)

router.get('/wishlist',isUser,userController.getwishlist)
router.get('/addtowishlist/:Id',isUser,userController.addtowishlist)
router.delete('/remove-from-wishlist/:Id',userController.deleteWishlist)


router.get('/checkout',isUser,userController.checkout)
router.post('/placeorder',isUser,userController.postcheckout)

router.get('/profile',isUser,userController.myprofie)

router.get('/myaddress',isUser,userController.getmyaddress)
router.get('/addaddress',isUser,userController.addaddress)
router.post('/address-add',isUser,userController.postaddaddress)
router.get('/address/edit/:Id',isUser,userController.geteditaddress)
router.post('/address-edit/:Id',userController.posteditaddress)
router.get('/address/delete/:Id',isUser,userController.deleteAddress)

router.get('/editprofile/:Id',isUser,userController.geteditprofile)
router.post('/edituser/:Id',isUser,userController.posteditprofile)
router.get('/resetpass/:Id',isUser,userController.resetpassword)
router.post('/reset/:Id',userController.postresetpassword)



router.get('/orders',isUser,userController.getorders)
router.get('/orders/detais/:Id',isUser,userController.orderdetail)
router.patch('/cancelorder',isUser,userController.cancelorder)
router.patch('/returnorder',isUser,userController.returnorder)

router.get('/account-info',isUser,userController.getaccontdetials)

router.get('/wallet',isUser,userController.wallet)
router.post('/walletdeposite',isUser,userController.postAddAmount)    
router.get('/transaction-history', isUser, userController.getTransactionHistory)
router.post('/check-wallet-balance',isUser,userController.checkWalletBalance)

router.post('/couponcheck',userController.checkCoupon)

router.get('/downloadinvoice/:Id',isUser,userController.getOrderInvoice)







module.exports= router