// controllers/Profile.js
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');

exports.getUserProfile = async (req, res) => {
  try {
    // Find user by ID and exclude sensitive fields
    const user = await User.findById(req.user._id)
      .select('-password -token -resetPasswordExpires')
      .populate('favouriteRestaurants', 'name contact openingHours')
      .populate({
        path: 'orderHistory',
        select: 'restaurantName date total status'
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        favouriteRestaurants: user.favouriteRestaurants,
        orderHistory: user.orderHistory,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;

    // Validate input
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id, 
      { name, phone }, 
      { new: true }
    ).select('-password -token -resetPasswordExpires');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.verifyToken = async (req, res) => {
  try {
    // If we've reached this point, the token is valid (via middleware)
    const user = await User.findById(req.user._id).select('name email role');
    res.status(200).json({ 
      message: 'Token is valid', 
      user 
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};