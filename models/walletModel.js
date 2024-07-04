const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Users',
        required:true
    },
    balance:{
        type:Number,
        required: true
    },
    transactions:[{
        amount:{
            type:Number,
            required: true
        },
        transactionMethod:{
            type: String,
            required:true,
            enum:[ 'RazorPay', 'Refund', 'Purchase' ]
        },
        date:{
            type:Date,
            default:Date.now
        }
    }]
},{
    timestamps: true
});




module.exports = mongoose.model('wallet' , walletSchema);

