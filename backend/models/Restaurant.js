// models/Restaurant.js
const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact: { type: String },
  description: { type: String },
  cuisineType: { type: String },
  openingHours: { type: String },
  upiId: { type: String },
  menu: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }],
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ratings: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  isPublic: { type: Boolean, default: true },
  accumulatedConvenienceFees: { type: Number, default: 0 },
  lastFeeSettlement: { type: Date }
});

module.exports = mongoose.model('Restaurant', restaurantSchema);