const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required:true
    },
    Products:[{
        Product: {
            type: mongoose.Schema.Types.ObjectId,
            ref:'products'
        }
    }]
},
{
    timestamps:true
}
);


module.exports = mongoose.model('wishlist', wishlistSchema)