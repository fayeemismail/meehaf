const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now, expires: 120 } // Expires after 120 seconds
});


module.exports = mongoose.model('otps', otpSchema);