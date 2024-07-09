const walletSchema = require('../models/walletModel');
const userSchema = require('../models/userModel');


const showWallet = async (req,res) => {
    try {
        const userId = req.session.user_id;
        const walletData = await walletSchema.findOne({user:userId})
        if(walletData){
            
        }
    } catch (error) {
        console.log(error)
    }
}



const addMoneyWallet = async (req,res) => {
    try {
        const amount = req.body.amount; // Ensure you are accessing the correct field
        console.log(amount);
        res.status(200).json({ message: 'Amount received', amount: amount });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}


module.exports = {
    addMoneyWallet
}