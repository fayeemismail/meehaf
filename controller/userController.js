const user = require('../models/userModel');
const sendOtp = require('../controller/otpController');
const OTP = require('../models/otpModel');
const bcrypt = require('bcrypt');
const products = require('../models/productModel');
const category = require('../models/categoryModel')
const Address = require('../models/addressModel');
const orderSchema = require('../models/orderModel')
const cartSchema = require('../models/cartModel')





const home = async (req, res) => {
    try {
        const userData = req.session;
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
        const allProduct = await products.find();

        const falseCategories = await category.find({status:false});

        const falseCategoryName = falseCategories.map(category => category.name);

        const productsInFalseCategory = allProduct.filter(product => !falseCategoryName.includes(product.category))

        res.render('shop', {Products:productsInFalseCategory});
      
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

            req.session.userData = userData;
            
            
            const otp = sendOtp.sendOtp(email);

            const data = new OTP({
                email: email,
                otp: otp,
            });

            const existingData = await OTP.findOneAndDelete({email:email})


            await data.save();
            setTimeout(async () => {
                await OTP.deleteOne({email:data.email});
                console.log('the otp is deleted after 120 sec')
            },120000)
            

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
            await newUser.save();
            console.log('User registered successfully');
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
        console.log(`User ${userId} logging out`);

        req.session.destroy((err) => {
            if (err) {
                console.log(err);
                return res.status(500).send("Failed to destroy session");
            }
            console.log('Session destroyed');
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

        const orderList = await orderSchema.find({user:userId});

        const addresses = userAddress && userAddress.address ? userAddress.address : [];

        res.render('userProfile', { userData: userData, addresses: addresses, orderList:orderList });
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


const cancelOrder = async (req,res) => {
    try {
        const orderId = req.query.id
        const orderData = await orderSchema.findOne({_id:orderId})
        console.log(orderData)
        orderData.orderStatus = 'canceled'
        const saving = await orderData.save();
        if(saving){
            res.send({success: 1})
            console.log('canceling the order in 561')
        }else{
            res.send({success: 0})
        }
    } catch (error) {
        console.log(error)
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






