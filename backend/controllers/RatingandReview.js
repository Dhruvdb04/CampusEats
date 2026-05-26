// controllers/RatingAndReview.js
const RatingAndReview = require('../models/RatingandReview');
const Restaurant = require('../models/Restaurant');

// Create a new rating and review
exports.createRatingAndReview = async (req, res) => {
  try {
    const { restaurantId, rating, review } = req.body;
    if (!restaurantId || !rating) {
      return res.status(400).json({ message: 'Restaurant ID and rating are required.' });
    }

    // Optionally, you might want to verify that the restaurant exists.
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found.' });
    }

    // Create new rating and review document
    const newRatingReview = await RatingAndReview.create({
      user: req.user._id,         // Assumes user is authenticated and available in req.user
      restaurant: restaurantId,
      rating,
      review
    });

    // Optionally, update restaurant's average rating here

    res.status(201).json({
      message: 'Rating and review added successfully',
      data: newRatingReview
    });
  } catch (error) {
    console.error('Error creating rating and review:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Update an existing rating and review
exports.updateRatingAndReview = async (req, res) => {
  try {
    const { id } = req.params; // Rating review document ID
    const { rating, review } = req.body;

    // Find the rating and review document
    const ratingReview = await RatingAndReview.findById(id);
    if (!ratingReview) {
      return res.status(404).json({ message: 'Rating and review not found.' });
    }

    // Only allow the user who created the review or an admin to update it
    if (req.user.role !== 'admin' && ratingReview.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access.' });
    }

    // Update fields if provided
    ratingReview.rating = rating !== undefined ? rating : ratingReview.rating;
    ratingReview.review = review !== undefined ? review : ratingReview.review;
    await ratingReview.save();

    res.status(200).json({
      message: 'Rating and review updated successfully',
      data: ratingReview
    });
  } catch (error) {
    console.error('Error updating rating and review:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Delete a rating and review
exports.deleteRatingAndReview = async (req, res) => {
  try {
    const { id } = req.params;
    const ratingReview = await RatingAndReview.findById(id);
    if (!ratingReview) {
      return res.status(404).json({ message: 'Rating and review not found.' });
    }

    // Only allow the creator or an admin to delete the review
    if (req.user.role !== 'admin' && ratingReview.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access.' });
    }

    await RatingAndReview.deleteOne({ _id: id });
    res.status(200).json({ message: 'Rating and review deleted successfully' });
  } catch (error) {
    console.error('Error deleting rating and review:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
