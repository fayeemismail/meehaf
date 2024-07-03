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

},
    {
        timestamps: true
    });


module.exports = mongoose.model('category', categorySchema)