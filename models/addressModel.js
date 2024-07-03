const mongoose = require('mongoose');

const addressSchame = mongoose.Schema({
    user_id:{
        type:mongoose.SchemaTypes.ObjectId,
        required: true
    },
    address: [{
        name:{
            type:String, 
            required:true
        },
        mobile:{
            type:Number,
            required:true
        },
        address:{
            type:String,
            required:true
        },
        city:{
            type:String,
            required:true
        },
        pincode:{
            type:Number,
            required:true
        },
        state:{
            type:String,
            required:true
        }
    }]
});


module.exports = mongoose.model('address', addressSchame);
