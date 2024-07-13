const { name } = require('ejs');
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    status: {
        type: Boolean,
        default: true
    },
    description: {
        type: String,
        required: true
    },
    offer:{
        type:Number
    }

    },
        {
        timestamps: true
    });


module.exports = mongoose.model('category', categorySchema)