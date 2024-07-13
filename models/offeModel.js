const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    product:{
        type:mongoose.Schema.Types.ObjectId
    },
    category:{
        type:mongoose.Schema.Types.ObjectId
    },
    type:{
        type: String,
        enum: ['product', 'category'],
        required: true
    },
    amount:{
        type:Number,
        required:true
    },
    endDate:{
        type:Date,
        required:true
    }
},{
    timestamps: true
})


module.exports = mongoose.model('offers', offerSchema);