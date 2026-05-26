// routes/ratingReviewRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const RatingReviewController = require('../controllers/RatingandReview');

router.post('/', authenticate, RatingReviewController.createRatingAndReview);

router.put('/:id', authenticate, RatingReviewController.updateRatingAndReview);

router.delete('/:id', authenticate, RatingReviewController.deleteRatingAndReview);

module.exports = router;
