// controllers/FoodItem.js
const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');

exports.createMenuItem = async (req, res) => {
  try {
    const { name, description, price, restaurantID, preparationTime, available } = req.body;
    if (!name || !price || !restaurantID) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Verify restaurant exists
    const restaurant = await Restaurant.findById(restaurantID);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

    // Check if user is authorized to add items to this restaurant
    const isAdmin = req.user.role === 'admin';  //any admin can do
    const isOwner = restaurant.admin.toString() === req.user._id.toString(); //only restaurant owner associated with the restaurant can do
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Unauthorized to add items to this restaurant' });
    }

    // Create Menu Item
    const menuItem = await MenuItem.create({
      name,
      price,
      restaurant: restaurantID,
      preparationTime,
      available: available !== undefined ? available : true
    });

    // Update menu reference to restaurant
    restaurant.menu.push(menuItem._id);
    await restaurant.save();

    res.status(201).json({ message: 'Menu item created successfully', menuItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.updateMenuItem = async (req, res) => {
  try {
    const { menuItemId } = req.params;
    const updateData = req.body;
    
    // Find the menu item
    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) return res.status(404).json({ message: 'Menu item not found' });
    
    // Find the associated restaurant
    const restaurant = await Restaurant.findById(menuItem.restaurant);
    if (!restaurant) return res.status(404).json({ message: 'Associated restaurant not found' });
    
    //Check if authorized to make changes
    const isAdmin = req.user.role === 'admin';
    const isOwner = restaurant.admin.toString() === req.user._id.toString();
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Unauthorized to update this menu item' });
    }
    
    // Update the item
    const updatedMenuItem = await MenuItem.findByIdAndUpdate(
      menuItemId, 
      updateData, 
      { new: true }
    );
    
    res.status(200).json({ 
      message: 'Menu item updated successfully', 
      menuItem: updatedMenuItem 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.deleteMenuItem = async (req, res) => {
  try {
    const { menuItemId } = req.params;
    
    // Find the menu item
    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) return res.status(404).json({ message: 'Menu item not found' });
    
    // Find the associated restaurant
    const restaurant = await Restaurant.findById(menuItem.restaurant);
    if (!restaurant) return res.status(404).json({ message: 'Associated restaurant not found' });
    
    // Check for authorization
    const isAdmin = req.user.role === 'admin';
    const isOwner = restaurant.admin.toString() === req.user._id.toString();
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Unauthorized to delete this menu item' });
    }
    
    // Remove menu item reference from restaurant
    await Restaurant.findByIdAndUpdate(
      menuItem.restaurant,
      { $pull: { menu: menuItemId } }
    );
    
    // Delete the menu item
    await MenuItem.findByIdAndDelete(menuItemId);
    
    res.status(200).json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};