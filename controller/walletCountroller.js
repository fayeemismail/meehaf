const walletSchema = require('../models/walletModel');
const userSchema = require('../models/userModel');
require('dotenv').config();
const crypto = require('crypto');
const Razorpay = require('razorpay');

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_ID,
    key_secret: process.env.RAZORPAY_KEY
});

const addMoneyWallet = async (req, res) => {
    try {
        const { amount } = req.body;
        const userId = req.session.user_id;

        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        // Check if wallet exists
        let walletData = await walletSchema.findOne({ user: userId });

        if (!walletData) {
            // Create a new wallet entry if not exists
            walletData = []
        }

        // Create a Razorpay order
        const razorpayOrder = await razorpayInstance.orders.create({
            amount: amount * 100,
            currency: 'INR'
        });

        if (razorpayOrder) {
            return res.status(200).json({
                message: 'adding money',
                razorpayOrderId: razorpayOrder.id,
                amount: amount,
                key: process.env.RAZORPAY_ID,
                walletId: walletData._id
            });
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const confirmAddMoney = async (req, res) => {
    try {
        const { walletId, razorpayPaymentId, razorpayOrderId, razorpaySignature, amount } = req.body;
        const userId = req.session.user_id

        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        const wallet = new walletSchema({
            user : userId,
            amount : amount,
            payment_type :'Credited'
        })

        if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found' });
        }

        // Create a HMAC using the orderId and razorpayPaymentId
        const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY);
        hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
        const generatedSignature = hmac.digest('hex');

        if (generatedSignature === razorpaySignature) {
            // Update the wallet amount after successful payment verification
            
            const saving = await wallet.save();
            if(saving){
                const addingBalance = await userSchema.findOne({_id:userId});
                addingBalance.balance += parseInt(amount)
                await addingBalance.save()
            }

            res.status(200).json({ message: 'success' });
        } else {
            res.status(400).json({ message: 'Invalid signature' });
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    addMoneyWallet,
    confirmAddMoney
};
