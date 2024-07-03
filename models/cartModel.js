const { MongoDBCollectionNamespace } = require('mongodb')
const mongoose = require('mongoose')

const cartSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required:true
        // Unique
    },
    Products:[{
        Product:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'products'
        },
        quantity:{
            type:Number,
            required:true
        }
    }]
},
{
    timestamps:true
})



module.exports = mongoose.model('cart', cartSchema )