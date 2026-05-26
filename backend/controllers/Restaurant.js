// controllers/Restaurant.js
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order'); 

exports.createRestaurant = async (req, res) => {
  try {
    // Check if user is admin or restaurant owner
    if (req.user.role !== 'admin' && req.user.role !== 'restaurant_owner') {
      return res.status(403).json({ message: 'Unauthorized to create restaurants' });
    }

    const { name, contact, description, cuisineType, openingHours, isPublic } = req.body;
    
    // Validate required fields
    if (!name || !contact) {
      return res.status(400).json({ message: 'Name and contact are required' });
    }

    // Create restaurant with public visibility (default to true)
    const restaurant = await Restaurant.create({
      name,
      contact,
      description,
      cuisineType,
      openingHours,
      admin: req.user._id,
      menu: [],
      isPublic: isPublic !== undefined ? isPublic : true // Default public
    });

    res.status(201).json({ 
      message: 'Restaurant created successfully', 
      restaurant 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.getAllRestaurants = async (req, res) => {
  try {
    let query = {};
    
    // Role-based filtering:
    if (req.user.role === 'admin') {
      // Admin sees all restaurants
      query = {};
    } else if (req.user.role === 'restaurant_owner') {
      // Restaurant owners see only their restaurants
      query = { admin: req.user._id };
    } else if (req.user.role === 'student') {
      // Students see only public restaurants
      query = { isPublic: true };
    }

    const restaurants = await Restaurant.find(query);
    
    res.status(200).json({ 
      restaurants,
      total: restaurants.length 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.getRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const restaurant = await Restaurant.findById(restaurantId).populate('menu');
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Check if user has permission to view this restaurant
    if (
      req.user.role === 'student' && !restaurant.isPublic
    ) {
      return res.status(403).json({ message: 'This restaurant is not available' });
    }

    if (
      req.user.role === 'restaurant_owner' && 
      restaurant.admin.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Unauthorized to view this restaurant' });
    }

    res.status(200).json({ restaurant });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.updateRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
   
    const restaurant = await Restaurant.findById(restaurantId);
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Only admin or restaurant owner who created it can update
    if (
      req.user.role !== 'admin' && 
      restaurant.admin.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      restaurantId, 
      req.body, 
      { new: true }
    );

    res.status(200).json({ 
      message: 'Restaurant updated successfully', 
      restaurant: updatedRestaurant 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// New endpoint to toggle restaurant visibility
exports.toggleVisibility = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const restaurant = await Restaurant.findById(restaurantId);
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Check permissions - admin can toggle any, owner can toggle only their own
    if (
      req.user.role !== 'admin' && 
      (req.user.role !== 'restaurant_owner' || restaurant.admin.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({ message: 'Unauthorized to change restaurant visibility' });
    }

    // Toggle visibility
    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      restaurantId,
      { isPublic: !restaurant.isPublic },
      { new: true }
    );

    res.status(200).json({
      message: `Restaurant is now ${updatedRestaurant.isPublic ? 'public' : 'private'}`,
      restaurant: updatedRestaurant
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

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
    if (
      req.user.role !== 'admin' && 
      req.user.role !== 'restaurant_owner' && 
      restaurant.admin.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Unauthorized to view these orders' });
    }
    
    // Build query for orders
    let query = { restaurant: restaurantId };
    
    // Add status filter if provided
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Fetch orders with populated user data and menu items
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

exports.settleFees = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    // Only admin can settle fees
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can settle fees' });
    }
    
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    // Record the settlement amount before clearing
    const settledAmount = restaurant.accumulatedConvenienceFees;
    
    // Clear the accumulated fees and update settlement date
    restaurant.accumulatedConvenienceFees = 0;
    restaurant.lastFeeSettlement = new Date();
    await restaurant.save();
    
    return res.status(200).json({
      message: 'Convenience fees settled successfully',
      settlementAmount: settledAmount,
      settlementDate: restaurant.lastFeeSettlement
    });
  } catch (error) {
    console.error('Error settling fees:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};