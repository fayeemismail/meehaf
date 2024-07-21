const cartSchema = require('../models/cartModel');
const addressSchema = require('../models/addressModel');
const UserSchema = require('../models/userModel');
const orderSchema = require('../models/orderModel');
const productSchema = require('../models/productModel')
const couponSchema = require('../models/couponModel');
const walletSchema = require('../models/walletModel');
const { ObjectId } = require('mongodb');
require('dotenv').config();
const crypto = require('crypto')


//REQUIRING RAZORPAY
const razorpay = require('razorpay');
const razorpayInstance = new razorpay({
    key_id : process.env.RAZORPAY_ID,
    key_secret : process.env.RAZORPAY_KEY
});


const checkOut = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const userData = await UserSchema.findOne({ _id: userId });
        const userAddress = await addressSchema.findOne({ user_id: userId });

        const addresses = userAddress && userAddress.address ? userAddress.address : [];
        let couponData = await couponSchema.find();

        if (!couponData) {
            couponData = [];
        }

        const currentDate = new Date();
        for (let coupon of couponData) {
            if (coupon.expires < currentDate && !coupon.status) {
                coupon.status = true;
                try {
                    await coupon.save();
                    console.log(`Coupon ${coupon.couponCode} status updated to true.`);
                } catch (err) {
                    console.log(`Failed to update coupon ${coupon.couponCode}: ${err}`);
                }
            }
        }

        const cartData = await cartSchema.findOne({ user: userId }).populate('Products.Product');

        if (cartData) {
            res.render('checkOut', { userData: userData, addresses: addresses, cartData: cartData.Products, couponData: couponData });
        } else {
            res.render('checkOut', { userData: userData, addresses: addresses, cartData: [], couponData: couponData });
        }

    } catch (error) {
        console.log(error);
    }
};


const placeOrder = async (req, res) => {
    try {
        const { checkAddress, couponCode, paymentMethod } = req.body;
        
        const userId = req.session.user_id;
        const userData = await UserSchema.findOne({ _id: userId });
        const addressData = await addressSchema.findOne({ user_id: userId });
        const correctAddress = addressData.address.find(value => value.id == checkAddress ? value : '');

        const findCart = await cartSchema.findOne({ user: userId }).populate('Products.Product');

        const productDetails = await Promise.all(findCart.Products.map(async val => {
            const product = await productSchema.findById(val.Product.id);
            const price = product.offer > 0 ? product.offer : product.price;

            return {
                Product: product.id,
                name: product.name,
                quantity: val.quantity,
                price: price // Use offer price if available
            };
        }));

        console.log(productDetails);

        // Check stock availability
        for (let i = 0; i < productDetails.length; i++) {
            const product = await productSchema.findById(productDetails[i].Product);
            if (product.stock < productDetails[i].quantity) {
                return res.status(400).json({ success: false, message: `Insufficient stock for product ${product.name}` });
            }
        }

        // Deduct stock quantities
        for (let i = 0; i < productDetails.length; i++) {
            const product = await productSchema.findById(productDetails[i].Product);
            product.stock -= productDetails[i].quantity;
            await product.save();
        }

        let totalAmount = 0;
        let discountAmount = 0;

        if (couponCode) {
            const couponData = await couponSchema.findOne({ couponCode });
            if (couponData) {
                discountAmount = couponData.amount;
            }
        }

        totalAmount = productDetails.reduce((accu, val) => {
            return accu + val.quantity * val.price;
        }, 0) - discountAmount;

        const newOrderData = {
            user: userId,
            Products: productDetails,
            billingAddress: {
                userName: correctAddress.name,
                email: userData.email,
                address: correctAddress.address,
                city: correctAddress.city,
                state: correctAddress.state,
                pincode: correctAddress.pincode,
                mobile: correctAddress.mobile
            },
            paymentMethod: paymentMethod,
            totalAmount: totalAmount,
            orderStatus: 'Pending',
            paymentStatus: 'Pending'
        };

        // Coupon handling
        if (couponCode) {
            const couponData = await couponSchema.findOne({ couponCode });
            if (couponData) {
                couponData.userList.push({ userId, couponUsed: true });
                await couponData.save();
                newOrderData.claimedAmount = discountAmount;
            }
        }

        const newOrder = new orderSchema(newOrderData);
        const saving = await newOrder.save();

        if (saving) {
            // Clear the cart after the order is saved
            await cartSchema.findOneAndDelete({ user: userId });
            
            // Handle different payment methods
            if (newOrderData.paymentMethod === 'Cash on delivery') {
                res.json({ puskas: true, orderId: saving._id, cashOnDelivary: true });
            } else if (newOrderData.paymentMethod === 'Razor Pay') {
                const razorpayOrder = await razorpayInstance.orders.create({
                    amount: totalAmount * 100,
                    currency: 'INR',
                    receipt: `RECIPT_IS${newOrder._id}`
                });
                res.status(200).json({
                    message: 'Razorpay order created',
                    razorpayOrderId: razorpayOrder.id,
                    userName: userData.name,
                    orderId: newOrder._id,
                    amount: totalAmount,
                    currency: 'INR',
                    key: process.env.RAZORPAY_ID
                });
            } else if (newOrderData.paymentMethod === 'Wallet') {
                const walletData = await walletSchema.findOne({ user: userId });
                if (walletData && userData.balance >= totalAmount) {
                    userData.balance -= totalAmount;
                    await userData.save();
                    const newWalletData = new walletSchema({
                        user: userId,
                        amount: totalAmount,
                        payment_type: 'Debited'
                    });
                    await newWalletData.save();

                    // Update payment status to 'Confirmed' for wallet payments
                    newOrder.paymentStatus = 'Confirmed';
                    await newOrder.save();

                    res.json({ success: true, orderId: saving._id, wallet: true });
                } else {
                    res.send({ message1: true });
                }
            }
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: error.message });
    }
};






const confirmPayment = async (req, res) => {
    try {
        const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

        // Find the order in the database
        const order = await orderSchema.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Create a HMAC using the orderId and razorpayPaymentId
        const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY);
        hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
        const generatedSignature = hmac.digest('hex');

        // Verify the payment signature
        if (generatedSignature === razorpaySignature) {
            // Payment is successful and verified
            order.paymentStatus = 'Confirmed'
            order.orderStatus = 'Pending';
            await order.save();

            res.status(200).json({ message: 'Success', orderId: order._id });
        } else {
            res.status(400).json({ message: 'Invalid signature' });
        }
    } catch (error) {
        console.error('Error confirming payment:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


const orderSuccess = async (req, res) => {
    try {
        const orderId = req.query.orderId;
        const order = await orderSchema.findById(orderId).populate('Products.Product')

        
        const productDetails = order.Products.map(item => item.Product)
        const items = await productSchema.find({_id:productDetails})
        

        res.render('orderSuccess', { cartData:order });
    } catch (error) {
        console.log(error);
    }
};



const paymentFailure = async (req,res) => {
    try {
        const { orderId } = req.body;

        // Find the order and update paymentStatus to 'failed'
        const order = await orderSchema.findByIdAndUpdate(orderId, { paymentStatus: 'Failed' }, { new: true });

        if (order) {
            res.status(200).json({ message: 'Order payment status updated to failed' });
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}


const continuePayment = async (req, res) => {
    try {
        const { amount, orderId } = req.body;
        if (amount && orderId) {
            const razorpayOrder = await razorpayInstance.orders.create({
                amount: amount * 100,
                currency: 'INR'
            });


            if (razorpayOrder) {
                return res.json({
                    message: 'paying again',
                    razorpayOrderId: razorpayOrder.id,
                    amount: amount,
                    key: process.env.RAZORPAY_ID,
                    orderId: orderId
                });
            }
        }
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};






const retryPayment = async (req, res) => {
    try {
        const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature, amount } = req.body;

       
        

        // Verify the payment using Razorpay SDK
        const crypto = require('crypto');
        const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY);
        hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
        const generatedSignature = hmac.digest('hex');

        if (generatedSignature === razorpaySignature) {
            // Find the order and update the payment status
            const order = await orderSchema.findById(orderId);
            if (order) {
                order.paymentStatus = 'Confirmed';
                await order.save();
                return res.json({ message: 'success' });
            } else {
                return res.status(404).json({ message: 'Order not found' });
            }
        } else {
            return res.status(400).json({ message: 'Invalid signature' });

        }
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};




module.exports = {
    checkOut,
    placeOrder,
    orderSuccess,
    confirmPayment,
    paymentFailure,
    continuePayment,
    retryPayment



    
}