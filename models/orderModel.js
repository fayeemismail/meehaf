const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    },
    Products: [
        {
            Product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'products',
                required: true
            },
            name: { type: String, required: true },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true }
        }
    ],
    billingAddress: {
        userName: { type: String, required: true },
        email: { type: String, required: true },
        address: { type: String },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true },
        mobile: { type: Number, required: true }
    },
    paymentMethod: { type: String },
    totalAmount: { type: Number, required: true },
    orderStatus: { type: String, required: true },
    claimedAmount: { type: Number, default: 0 },
    offerAmount: { type: Number, default: 0 },
    paymentStatus: { type: String, required: true, default: 'Pending' }  // Corrected and added default value
}, {
    timestamps: true
});

module.exports = mongoose.model('orders', orderSchema);
