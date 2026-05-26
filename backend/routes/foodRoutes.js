// routes/foodRoutes.js
const express = require('express');
const router = express.Router();
const FoodItemController = require('../controllers/FoodItem');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, FoodItemController.createMenuItem);
router.put('/:menuItemId', authenticate, FoodItemController.updateMenuItem);
router.delete('/:menuItemId', authenticate, FoodItemController.deleteMenuItem);

module.exports = router;