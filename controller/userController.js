const user = require('../models/userModel');
const sendOtp = require('../controller/otpController');
const OTP = require('../models/otpModel');
const bcrypt = require('bcrypt');
const products = require('../models/productModel');
const category = require('../models/categoryModel')
const Address = require('../models/addressModel');
const orderSchema = require('../models/orderModel')
const cartSchema = require('../models/cartModel');
const couponSchema = require('../models/couponModel');
const walletSchema = require('../models/walletModel');
const returnSchema = require('../models/returnModel');
const wishlistSchema = require('../models/wishlistSchema')





const home = async (req, res) => {
    try {
        const userData = req.session;
        if(userData.is_blocked == true){
            req.session.destroy()
        }
        const allProduct = await products.find();

        const falseCategories = await category.find({status:false});
       
        

        
        if(userData.user_id !== 'undefined'){
            const cartData = await cartSchema.find({user:userData.user_id}).countDocuments()
            
        }else{

        }
        const falseCategoryName = falseCategories.map(category => category.name);

        const productsInFalseCategory = allProduct.filter(product => !falseCategoryName.includes(product.category))

        res.render('home', {Products:productsInFalseCategory, User:userData});
    } catch (error) {
        console.log(error);
    }
};







const shop = async (req, res) => {
    try {

        const userId = req.session.user_id;
        const userData = await user.findOne({_id:userId})
        if(userData.is_blocked == true){
            req.session.destroy()
        }
        const page = parseInt(req.query.page) || 1;
        const limit = 12;
        const skip = (page - 1) * limit;

        // Get the search query
        const searchQuery = req.query.searchInShop || '';

        // Find products that match the search query
        const query = searchQuery ? { name: { $regex: searchQuery, $options: 'i' } } : {};

        const categoryData = await category.find()
        
        
        const allProduct = await products.find(query).skip(skip).limit(limit);

        const falseCategories = await category.find({ status: false });
        
        const falseCategoryName = falseCategories.map(category => category.name);
        

        const productsInFalseCategory = allProduct.filter(product => !falseCategoryName.includes(product.category));
        

        const totalProducts = await products.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limit);

        res.render('shop', {
            Products: productsInFalseCategory,
            currentPage: page,
            totalPages: totalPages,
            categoryData:categoryData
        });

    } catch (error) {
        console.log(error);
    }
};





const login = async (req, res) => {
    try {
        res.render('login');
    } catch (error) {
        console.log(error);
    }
};

const register = async (req, res) => {
    try {
        req.session.refferel = req.query.refferel
        console.log(req.query.refferel)
        console.log(req.session.refferel, 'session')
        res.render('register');
        
    } catch (error) {
        console.log(error);
    }
};







const addUser = async (req, res) => {
    try {
        const { name, email, mobile, password, cPassword } = req.body;
        const checkName = await user.findOne({name:name});
        if(!name || name.trim() == '' || name.length <= 3 ){
            res.render('register',{message:'Invalid Name'});
        }

        const checkEmail = await user.findOne({email:email});
        if(checkEmail){
            res.render('register' , { message1: 'email already taken' });
        }

        console.log(password, cPassword);
        if(password !== cPassword){
            res.render('register' , { message2: `password dosen't match` });
        }

        if (email) {
            const hashedPassword = await bcrypt.hash(password, 10);
            const userData = {
                name: name,
                email: email,
                mobile: mobile,
                password: hashedPassword
            };
            req.session.email = email;
            // req.query.refferel = req.session.refferel
            console.log(req.session.refferel, 'this is query refferel')


            req.session.userData = userData;
            
            
            const otp = sendOtp.sendOtp(email);

            const data = new OTP({
                email: email,
                otp: otp,
            });

            const existingData = await OTP.findOneAndDelete({email:email})


            const save = await data.save();
            if(save){
                setTimeout(async () => {
                    await OTP.deleteOne({email:data.email});
                    console.log('the otp is deleted after 120 sec')
                },120000)
            }
            

            res.render('otp');
        }
    } catch (error) {
        console.log(error);
    }
};



const verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        const otpp = parseInt(otp.join(""));
        const email = req.session.email;
        const userData = req.session.userData;
        const OTPData = await OTP.findOne({ email: email });

        if (OTPData && OTPData.otp === otpp) {
            const newUser = new user(userData);
            newUser.balance = 301 + newUser.balance
            await newUser.save();

            // Create a wallet for the new user
            const walletData = await walletSchema.create({
                user: newUser._id,
                amount: 301, // Initialize with the credited amount
                payment_type: 'Credited'
            });

            // If there's a referral, update the wallet of the referrer
            
            const userDetail = await user.findOne({ refferel: req.session.refferel });
            console.log(userDetail)
            if (userDetail) {
                // Check if the referrer already has a wallet
                let referrerWalletData = await walletSchema.findOne({ user: userDetail._id });
                

                if (referrerWalletData) {
                    // If the wallet exists, update the amount
                    userDetail.balance = 301 + userDetail.balance
                    const save = await userDetail.save()
                    const newWallet = {
                        user: userDetail._id,
                        amount:301,
                        payment_type: 'Credited'
                    }

                    const newWalletData = new walletSchema(newWallet);
                    await newWalletData.save()

                } else {
                    userDetail.balance = 301 + userDetail.balance 
                    await userDetail.save()
                    // If the wallet does not exist, create a new wallet
                    const newWallet = {
                        user: userDetail._id,
                        amount:301,
                        payment_type: 'Credited'
                    }

                    const newWalletData = new walletSchema(newWallet);
                    await newWalletData.save()
                }
            }


            

            res.render('login');
        } else {
            console.log('OTP verification failed');
            res.render('otp', { message: 'Invalid OTP, please try again' });
        }
    } catch (error) {
        console.log(error);
        res.render('otp', { message: 'An error occurred. Please try again later.' });
    }
};



const authUser = async (req, res) => {
    try {
        const { userEmail, userPassword } = req.body;
        

        // Find user by email
        const userData = await user.findOne({ email: userEmail });
        

        // Check if userData exists
        if (!userData) {
            console.log('login failed - user not found');
            return res.render('login', { message: 'Create an account' });
        }

        // Check if the user is blocked
        if (userData.is_blocked == true) {
            return res.render('login', { message: 'User is Blocked' });
        }

        // Verify the password
        const checkPass = await bcrypt.compare(userPassword, userData.password);
        if (!checkPass) {
            return res.render('login', { message: 'Password is incorrect' });
        }

        // Successful login
        req.session.user_id = userData._id;
        res.redirect('/');

    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};



const logout = async (req, res) => {
    try {
        let userId = req.session.user_id;

        req.session.destroy((err) => {
            if (err) {
                console.log(err);
                return res.status(500).send("Failed to destroy session");
            }
            res.redirect('/login');
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occurred");
    }
};


const forgotPass = async (req,res) => {
    
    try {
    
        res.render('forgotPass')

    } catch (error) {
        console.log(error)
    }

}


// THIS IS FOR FORGOT PASSWORD LINK SHARE
const fpLink = async (req,res) => {
    try {
        const {email} = req.body;
        req.session.email = email
        const userData = await user.findOne({email:email});
        if(!userData){
            res.render('forgotPass', {message:`You don't have an Account register first`});
        }
        if(userData){
            const existingOtp = await OTP.findOne({email:email})
            if(existingOtp){
                await OTP.deleteOne({email:email});
                console.log('deleting the existing otp in 221 usercontroller')
            }
            const otp = sendOtp.sendOtp(email);
            const Data = new OTP({
                email:email,
                otp:otp
            });

            await Data.save()
            res.render('fpOTP')
        };
        
       
    } catch (error) {
        console.log(error)
    }

}

const fpverify = async (req, res) => {
    try {
        const { otp } = req.body;
        const email = req.session.email;
        const OTPData = await OTP.findOne({ email: email });

        if (OTPData && OTPData.otp == parseInt(otp)) {
            console.log('USER REGISTERED SUCCESSFULLY');
            res.render('changePassword');
        } else {
            console.log('USER VERIFICATION FAILED');
            res.render('fpOTP', { message: 'OTP is invalid' });
        }
    } catch (error) {
        console.log(error);
    }
};




const newPassword = async (req,res) => {

    try {
        const { Password, confirmPassword } = req.body
        const email = req.session.email
        const userData = await user.findOne({email:email});
        const hashedPassword = await bcrypt.hash(Password, 10)
        if(userData){

            userData.password = hashedPassword

            await userData.save();
            res.render('login')
        }
    } catch (error) {
        console.log(error)
    }

}




const singleProduct = async (req,res) => {

    try {
        const productData = req.query.id

        const findItem = await products.findById({_id:productData});
        const cateItem = await products.find({category:findItem.category});
       
        
        

        res.render('singleProduct', {Product:findItem, Related:cateItem})
    } catch (error) {
        console.log(error)
    }

}

const userProfile = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const userData = await user.findOne({ _id: userId });
        const userAddress = await Address.findOne({ user_id: userId });
        const orderList = await orderSchema.find({ user: userId }).sort({ createdAt: -1 }); // Sort by createdAt in ascending order
        const addresses = userAddress && userAddress.address ? userAddress.address : [];

        let coupons = await couponSchema.find({});
        if (!coupons) {
            coupons = [];
        }

        const walletData = await walletSchema.find({ user: userId }); // Use find to get an array of wallet entries

        // Check if the user has used each coupon and add the 'used' property
        coupons.forEach(coupon => {
            const userCoupon = coupon.userList.find(userCoupon => userCoupon.userId.toString() === userId);
            coupon.used = userCoupon ? userCoupon.couponUsed : false;
        });

        res.render('userProfile', { userData, addresses, orderList, coupons, walletData });
    } catch (error) {
        console.log(error);
        res.render('error', { message: "An error occurred while fetching the user profile." });
    }
};





const detailsChange = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const { name, mobile, curPassword, newPassword } = req.body;
        const userData = await user.findOne({ _id: userId });

        if (!userData) {
            return res.json({ success: false, message: 'User not found' });
        }

        if (curPassword && newPassword) {
            const checkPass = await bcrypt.compare(curPassword, userData.password);
            if (!checkPass) {
                return res.json({ success: false, message: 'The Current Password is not matching. Try again' });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            userData.password = hashedPassword;
        }

        userData.name = name;
        userData.mobile = mobile;
        
        await userData.save();
        console.log('The user details changed and saved to database successfully');
        return res.json({ success: true });
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: 'An error occurred. Please try again.' });
    }
};


const showAddress = async (req,res) => {
    try {
       res.render('addAddress')
        
    } catch (error) {
        console.log(error)
    }
}


const addAddress = async (req, res) => {
    try {
        const { name, email, mobile, address, pincode, city, state } = req.body;
        const userId = req.session.user_id;

        // Validations
        if (!name || name.trim() === '' || name.length <= 3 || !/^[a-zA-Z\s]+$/.test(name)) {
            return res.json({ success: false, message: "The Name should contain at least 3 letters and no numbers." });
        }
        if (!mobile || !/^\d{10}$/.test(mobile)) {
            return res.json({ success: false, message: "Mobile number should be exactly 10 digits." });
        }
        if (!pincode || !/^\d{6}$/.test(pincode)) {
            return res.json({ success: false, message: "Pincode should be exactly 6 digits." });
        }
        if (!city || city.trim() === '' || !/^[a-zA-Z\s]+$/.test(city)) {
            return res.json({ success: false, message: "City should only contain letters and spaces." });
        }
        if (!state || state.trim() === '' || !/^[a-zA-Z\s]+$/.test(state)) {
            return res.json({ success: false, message: "State should only contain letters and spaces." });
        }
        if (!address || address.trim() === '') {
            return res.json({ success: false, message: "Address cannot be empty." });
        }

        // Create and save a new address instance
        const newAddress = {
            name,
            mobile,
            address,
            city,
            pincode,
            state
        };

        const addressDoc = await Address.findOneAndUpdate(
            { user_id: userId },
            { $push: { address: newAddress } },
            { new: true, upsert: true }
        );

        res.json({ success: true, address: addressDoc });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "An error occurred." });
    }
};

const editAddress = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const addressId = req.query.id; // Correct query parameter name

        if (!userId || !addressId) {
            return res.status(400).send('User ID or Address ID is missing.');
        }

        const userAddress = await Address.findOne(
            { user_id: userId, 'address._id': addressId },
            { 'address.$': 1 }
        );

        if (!userAddress) {
            return res.status(404).send('Address not found.');
        }

        res.render('editAddress', { address: userAddress.address[0] });
    } catch (error) {
        console.log('Error fetching address:', error);
        res.status(500).send('Server Error');
    }
};


const updateAddress = async (req, res) => {
    try {
        console.log('Request body data:', req.body);
        const { id, name, mobile, address, city, pincode, state } = req.body;

        if (!req.session.user_id) {
            return res.status(400).json({ success: false, message: 'User is not authenticated.' });
        }

        // Validations
        if (!name || name.trim() === '' || name.length <= 3 || !/^[a-zA-Z\s]+$/.test(name)) {
            return res.json({ success: false, message: "The Name should contain at least 3 letters and no numbers." });
        }
        if (!mobile || !/^\d{10}$/.test(mobile)) {
            return res.json({ success: false, message: "Mobile number should be exactly 10 digits." });
        }
        if (!pincode || !/^\d{6}$/.test(pincode)) {
            return res.json({ success: false, message: "Pincode should be exactly 6 digits." });
        }
        if (!city || city.trim() === '' || !/^[a-zA-Z\s]+$/.test(city)) {
            return res.json({ success: false, message: "City should only contain letters and spaces." });
        }
        if (!state || state.trim() === '' || !/^[a-zA-Z\s]+$/.test(state)) {
            return res.json({ success: false, message: "State should only contain letters and spaces." });
        }
        if (!address || address.trim() === '') {
            return res.json({ success: false, message: "Address cannot be empty." });
        }

        // Update the address
        const updatedAddress = await Address.findOneAndUpdate(
            { 
                user_id: req.session.user_id, 
                'address._id': id 
            },
            {
                $set: {
                    'address.$.name': name,
                    'address.$.mobile': mobile,
                    'address.$.address': address,
                    'address.$.city': city,
                    'address.$.pincode': pincode,
                    'address.$.state': state
                }
            },
            { new: true }
        );

        

        if (!updatedAddress) {
            return res.status(404).json({ success: false, message: 'Address not found.' });
        }

        res.json({ success: true, address: updatedAddress });
    } catch (error) {
        console.log('Error updating address:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};




const removeAddress = async (req,res) => {
    try {
        const { user_id } = req.session

        const { detailsId } = req.body;
        console.log(detailsId)
        const saving = await Address.findOneAndUpdate({'address._id': detailsId}, {$pull:{address:{_id: detailsId}}});
        await saving.save()
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting address:', error);
        res.json({ success: false });
    }
}


const orderDetails = async (req,res) => {
    try {
        
        const orderId = req.query.id
        const orderDetails = await orderSchema.findById(orderId).populate('Products.Product')
        if (orderDetails) {
            res.render('orderDetails', { order:orderDetails });
        } 
        

    } catch (error) {
        console.log(error)
    }
}


const cancelOrder = async (req, res) => {
    try {
        const orderId = req.query.id;
        const orderData = await orderSchema.findOne({ _id: orderId });
        const userId = req.session.user_id;
        console.log(orderData);

        if (orderData.paymentMethod == 'Razor Pay' || orderData.paymentMethod == 'Wallet') {
            const newWallet = new walletSchema({
                user: userId,
                amount: orderData.totalAmount,
                payment_type: 'Credited' // corrected field name
            });

            const saving = await newWallet.save();
            if (saving) {
                const creditedAmount = await user.findOne({ _id: userId });
                creditedAmount.balance += orderData.totalAmount;
                orderData.orderStatus = 'canceled';

                await orderData.save();
                await creditedAmount.save();
                res.send({ cancel: true });
            } else {
                res.send({ message: false });
            }
        } else {
            orderData.orderStatus = 'canceled';
            const saving = await orderData.save();
            if (saving) {
                res.send({ success: 1 });
                console.log('canceling the order in 561');
            } else {
                res.send({ success: 0 });
            }
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({ error: 'An error occurred while canceling the order' });
    }
};




const returnOrder = async (req, res) => {
    try {
        const { orderId, reason } = req.body;
        const userId = req.session.user_id;
        const orderData = await orderSchema.findOne({ _id: orderId });

        if (!orderData) {
            return res.status(404).send({ success: false, message: 'Order not found' });
        }

        const newReturnRequest = new returnSchema({
            user: userId,
            reason: reason,
            orderData: orderId
        });

        await newReturnRequest.save();

        orderData.orderStatus = 'Return Requested';
        await orderData.save();

        res.send({ success: true });
    } catch (error) {
        console.log(error);
        res.status(500).send({ success: false, message: 'Server error' });
    }
};





const orderPage = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const userId = req.session.user_id;

        // Count the total orders for the logged-in user
        const totalOrders = await orderSchema.countDocuments({ user: userId });

        // Fetch the orders for the logged-in user with pagination
        const orders = await orderSchema.find({ user: userId })
            .populate('user')
            .populate('Products.Product')
            .sort({ _id: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.render('orderPage', {
            orders: orders,
            totalOrders: totalOrders,
            page: page,
            limit: limit
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};



const walletPage = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const userData = await user.findOne({ _id: userId });

        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;

        const wallet = await walletSchema.find({ user: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalTransactions = await walletSchema.countDocuments({ user: userId });
        const totalPages = Math.ceil(totalTransactions / limit);

        res.render('walletPage', {
            currentBalance: userData.balance,
            wallet,
            userData,
            currentPage: page,
            totalPages
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};
    

const filterProduct = async(req,res)=>{
    try {
        const price = req.query.sortByPrice
        const category = req.query.sortByCategory

        

        let query = { status: false };
        let sort;

        if (price !== 'allPrice') {
            switch (price) {
                case 'lowToHigh':
                    sort = { price: 1 };
                    break;
                case 'highToLow':
                    sort = { price: -1 };
                    break;
                case 'sortAZ': 
                    sort = { name: 1 };
                    break;
                case 'sortZA': 
                    sort = { name: -1 };
                    break;
                default:
                    sort = { price: -1 }
            }
        }

        if (category !== 'allCategories') {
            query = { ...query, category: category };
        }


        const Products = await products.find(query).sort(sort)
        res.status(200).json({ products:Products });

    } catch (error) {
        
    }
}




module.exports = {
    home,
    shop,
    login,
    register,
    addUser,
    verifyOtp,
    authUser,
    logout,
    forgotPass,
    fpLink,
    singleProduct,
    userProfile,
    fpverify,
    newPassword,
    detailsChange,
    showAddress,
    addAddress,
    editAddress,
    updateAddress,
    removeAddress,
    orderDetails,
    cancelOrder,
    returnOrder,
    orderPage,
    walletPage,
    filterProduct

};








// const authUser = async (req,res) => {
//     try {
//         const {userEmail, userPassword } = req.body
//         console.log( userEmail , userPassword );

//         const userData = await user.findOne({email: userEmail});
//         console.log('userdata-------------'+ userData)

//         if(userData.is_blocked == true){
//             res.render('login' , { message: 'User is Blocked' });
//         }

//         if(!userData){
//             console.log('login failed');
//             res.render('login' , { message: 'Create a account'});
//         }else{
//             const checkPass = await bcrypt.compare(userPassword ,userData.password );
//             if(!checkPass){
//                 res.render('login', { message: 'password not match'});
//             }else{
                
//                 res.redirect('/');

//             }
//         }
        
//     } catch (error) {
//         console.log(error)
//     }
// }






