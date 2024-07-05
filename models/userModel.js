const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    mobile: {
        type: Number,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    is_blocked: {
        type: Boolean,
        default: false
    },
    balance:{
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Users', userSchema);
