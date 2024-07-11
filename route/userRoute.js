//REQUIRING EXPRESS IN USER_ROUTE
const express = require('express');
const user_route = express();
const session = require('express-session')

user_route.use(session({
    secret: 'yourSecretKey', // Replace with my secret 
    resave: false,           // Forces the session to be saved back to the session store
    saveUninitialized: true, // Forces a session that is "uninitialized" to be saved to the store
  }))



//SETTING VIEW ENGINE(EJS) IN USER_ROUTE
user_route.set('view engine', 'ejs');
user_route.set('views', './views/users');



//SETTING BODYPARSER IN USER_ROUTE
const bodyParser = require('body-parser');
user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({extended:true}));


//REQUIRING USER CONTROLLER
const userController = require('../controller/userController')
const otpController = require('../controller/otpController');
const productCantroller = require('../controller/productCantroller');
const cartController = require('../controller/cartController');
const checkOutController = require('../controller/checkOutController');
const wishlistController = require('../controller/wishlistController');
const couponController = require('../controller/couponController');
const walletController = require('../controller/walletCountroller');
const passportController = require('../controller/passportController')



//REQUIRING PASSPORT
const passport = require('passport')
require('../passport')
user_route.use(passport.initialize())
user_route.use(passport.session())


// REQUIRING AUTH MIDDELEWARE
const userAuth = require('../middlewares/userAuth');
const { productBlock } = require('../controller/productCantroller');

// AUTHENTICATE GOOGLE
user_route.get('/auth/google' , passport.authenticate('google' , { scope:
  ['email', 'profile']
}));


// AUTHENTICATE CALLBACK
user_route.get('/auth/google/callback', 
  passport.authenticate( 'google', {
    successRedirect: '/success',
    failureRedirect: '/failure'
  })
)


user_route.get('/success', passportController.successGoogleLogin);
user_route.get('/failure', passportController.failureGoogleLogin);



//ROUTE FOR HOME PAGE
user_route.get('/' , userController.home);


//ROUTE FOR LOGIN PAGE LOGOUT PAGE ADDING USER OTP PAGE AUTHENTICATING USER VERIFY OTP
user_route.get('/login', userAuth.is_logout ,userController.login);
user_route.get('/register', userAuth.is_logout ,userController.register);
user_route.post('/login_post', userAuth.is_logout ,userController.addUser);
user_route.post('/verifyOtp' , userAuth.is_logout ,userController.verifyOtp);
user_route.post('/authUser', userAuth.is_logout ,userController.authUser);
user_route.get('/resendOtp' ,otpController.resendOtp);
user_route.get('/logout' ,userController.logout);



//ROUTE FOT SHOP PAGE
user_route.get('/shop' , userAuth.is_login , userController.shop);




//ROUTE FOR FORGOT PASSWORD
user_route.get('/forgotPass', userController.forgotPass);
user_route.post('/fpasswordOTP', userController.fpLink);
user_route.post('/fpOTP', userController.fpverify)
user_route.get('/fpResendOtp', otpController.fpResendOtp);
user_route.post('/newPassword', userController.newPassword);



user_route.get('/singleProduct', userAuth.is_login , userController.singleProduct);

user_route.get('/userProfile', userAuth.is_login , userController.userProfile);
user_route.get('/orderDetails', userAuth.is_login, userController.orderDetails)






// ROUTE FOR SHOW CART CHECK CART ADD AND REMOVE 
user_route.get('/cart',  userAuth.is_login , cartController.showCart);
user_route.post('/checkCart', userAuth.is_login  , cartController.checkCart)
user_route.post('/addCart', cartController.addCart);
user_route.post('/removeCart', cartController.removeCart);




user_route.post('/sortItem', productCantroller.sortProduct)





// ROUTE FOR ADD ADDRESS EDIT AND UPDATE
user_route.get('/Address', userAuth.is_login ,userController.showAddress);
user_route.post('/addAddress', userController.addAddress);
user_route.get('/editAddress', userAuth.is_login, userController.editAddress);
user_route.post('/updateAddress', userAuth.is_login, userController.updateAddress);
user_route.post('/detailsChange', userController.detailsChange)



user_route.post('/checkStock', productCantroller.checkStock);

user_route.post('/removeAddress', userController.removeAddress);


user_route.post('/increament', cartController.increament);

user_route.post('/decrement', cartController.decrement);

user_route.post('/subTotalChange', cartController.subtotal);


//ROUTE FOR CHECKOUT 
user_route.get('/checkout', userAuth.is_login, checkOutController.checkOut);
user_route.post('/placeOrder', userAuth.is_login, checkOutController.placeOrder);
user_route.get('/orderSuccess', userAuth.is_login, checkOutController.orderSuccess);
user_route.post('/checkCoupon', couponController.couponCheck);
user_route.post('/applyCoupon', couponController.applyCoupon);
user_route.get('/couponPage', userAuth.is_login, couponController.couponPage);
user_route.post('/confirm-payment', checkOutController.confirmPayment);
user_route.get('/getAvailableCoupons', userAuth.is_login, couponController.getCoupon);



user_route.post('/cancelOrder', userController.cancelOrder);
user_route.post('/returnOrder', userController.returnOrder)




//ROUTE FOR WISHLIST
user_route.get('/wishlist', userAuth.is_login, wishlistController.wishlist);
user_route.post('/addToWishlist' ,wishlistController.addToWishlist);
user_route.post('/removeWishlist', wishlistController.removeWishlit);
user_route.post('/checkWishlist', wishlistController.checkWishlist);



user_route.get('/orderPage', userAuth.is_login, userController.orderPage);


user_route.get('/walletPage', userAuth.is_login, userController.walletPage);
user_route.post('/addMoney', userAuth.is_login, walletController.addMoneyWallet);
user_route.post('/confirm-addMoney', userAuth.is_login, walletController.confirmAddMoney);





module.exports = user_route;