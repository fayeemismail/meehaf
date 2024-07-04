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