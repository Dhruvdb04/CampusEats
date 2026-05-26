// routes/restaurantRoutes.js
const express = require('express');
const router = express.Router();
const RestaurantController = require('../controllers/Restaurant');
const { authenticate, checkRole } = require('../middleware/auth');
const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');

router.post('/', authenticate, checkRole('admin', 'restaurant_owner'), RestaurantController.createRestaurant);
router.get('/', authenticate, RestaurantController.getAllRestaurants);
router.get('/:restaurantId', authenticate, RestaurantController.getRestaurant);
router.put('/:restaurantId', authenticate, RestaurantController.updateRestaurant);
router.patch('/:restaurantId/toggle-visibility', authenticate, checkRole('admin', 'restaurant_owner'), RestaurantController.toggleVisibility);
router.get('/:restaurantId/orders', authenticate, checkRole('admin', 'restaurant_owner'), RestaurantController.getRestaurantOrders);
router.post('/:restaurantId/settle-fees', authenticate, checkRole('admin'), RestaurantController.settleFees);

// Get restaurant menu items
router.get('/:restaurantId/menu', authenticate, async (req, res) => {
  try {
    const { restaurantId } = req.params;
  
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    // Check if restaurant is public or user has permission
    const isAdmin = req.user && req.user.role === 'admin';
    const isOwner = req.user && restaurant.admin.toString() === req.user._id.toString();
    
    if (!restaurant.isPublic && !isAdmin && !isOwner) {
      return res.status(403).json({ message: 'This restaurant is currently not public' });
    }
    
    // Fetch menu items with populated data
    const menuItems = await MenuItem.find({ restaurant: restaurantId });
    
    res.status(200).json({ menuItems });
  } catch (error) {
    console.error('Error fetching restaurant menu:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

exports.getRestaurantOrders = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { status } = req.query; // Filter by status
    
    // Find the restaurant first to verify it exists
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    // Check if the user has permission to view orders
    const isAdmin = req.user.role === 'admin';
    const isOwner = restaurant.admin.toString() === req.user._id.toString();
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Unauthorized to view these orders' });
    }
    
    // Build query for orders
    let query = { restaurant: restaurantId };
    
    // Add status filter if provided
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Fetch orders with populated user data and menu items
    const Order = require('../models/Order'); // Make sure this is included
    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .populate({
        path: 'items.menuItem',
        model: 'MenuItem',
        select: 'name price'
      })
      .sort({ createdAt: -1 }); // Most recent orders first
    
    res.status(200).json({ orders });
  } catch (error) {
    console.error('Error fetching restaurant orders:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = router;