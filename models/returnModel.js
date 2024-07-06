const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        required: true
    },
    reason:{
        type:String,
        required: true
    },
    orderData:{
        type:mongoose.Schema.Types.ObjectId,
        required:true
    }
})

module.exports = mongoose.model('returnOrder', returnSchema)