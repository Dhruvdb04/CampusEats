// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  verified: { type: Boolean, default: false },
  role: { type: String, enum: ['admin', 'restaurant_owner', 'student'], default: 'student' },
  token: { type: String },
  resetPasswordExpires: { type: Date },
  orderHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  favouriteRestaurants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
