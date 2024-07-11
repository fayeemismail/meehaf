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
    },
    password: {
        type: String,
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
