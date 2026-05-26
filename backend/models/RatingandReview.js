// models/RatingandReview.js
const mongoose = require('mongoose');

const ratingReviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
  rating: { type: Number, required: true },
  review: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RatingandReview', ratingReviewSchema);
