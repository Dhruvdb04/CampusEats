//controllers/Order.js

const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const MenuItem = require('../models/MenuItem');

exports.createOrder = async (req, res) => {
  try {
    const { restaurantID, items, subtotal, convenienceFee, totalAmount: requestTotal } = req.body;
    if (!restaurantID || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Invalid order details' });
    }

    // Find Restaurant
    const restaurant = await Restaurant.findById(restaurantID);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

    // Enhance items with item name for better display later
    const enhancedItems = [];
    let calculatedSubtotal = 0;
    
    for (const item of items) {
      if (!item.quantity || !item.price) throw new Error('Invalid item details');
      
      // Get the menu item to store its name (if available)
      let menuItemData = null;
      try {
        menuItemData = await MenuItem.findById(item.item);
      } catch (err) {
        console.error('Error fetching menu item:', err);
      }
      
      // Add to total regardless of whether we found the menu item
      calculatedSubtotal += item.quantity * item.price;
      
      // Create enhanced item with name if possible
      enhancedItems.push({
        menuItem: item.item,
        quantity: item.quantity,
        price: item.price,
        name: menuItemData ? menuItemData.name : null // Store name if available
      });
    }

    // Use the provided values if available, otherwise calculate
    const finalSubtotal = subtotal || calculatedSubtotal;
    const finalConvenienceFee = convenienceFee || (finalSubtotal * 0.04);
    const finalTotal = requestTotal || (finalSubtotal + finalConvenienceFee);

    // Create Order with enhanced items that include names
    const order = await Order.create({
      user: req.user._id,
      restaurant: restaurantID,
      items: enhancedItems,
      subtotal: finalSubtotal,
      convenienceFee: finalConvenienceFee,
      totalAmount: finalTotal,
      status: 'pending'
    });

    await Restaurant.findByIdAndUpdate(restaurantID, {
      $inc: { accumulatedConvenienceFees: finalConvenienceFee }
    });

    // Update user's order history
    const user = await User.findById(req.user._id);
    user.orderHistory.push(order._id);
    await user.save();

    res.status(201).json({ message: 'Order created successfully', order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const allowedStatuses = ["pending", "preparing", "ready", "completed", "cancelled"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status: status },
      { new: true, runValidators: false } // Return updated document but skip validation
    );

    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isAdmin = req.user.role === 'admin';
    const isRestaurantOwner = req.user.role === 'restaurant_owner';
    
    if (isAdmin || isRestaurantOwner) {
      return res.status(200).json({ message: 'Order status updated successfully', order });
    }
    
    // If none, unauthorized
    return res.status(403).json({ message: 'Unauthorized access' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.finalizeOrder = async (req, res) => {
  try {
    const { orderId, restaurantId, status, paymentStatus } = req.body;
    
    if (!orderId || !restaurantId) {
      return res.status(400).json({ message: 'Order ID and Restaurant ID are required' });
    }
    
    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Update the order with finalized status
    order.status = status || 'pending';
    order.paymentStatus = paymentStatus || 'pending';
    order.isFinalized = true;
    
    // Generate a unique order number if it doesn't exist
    if (!order.orderNumber) {
      // Create order number based on timestamp and last 4 chars of ID
      const timestamp = new Date().getTime().toString().slice(-4);
      const idSuffix = order._id.toString().slice(-4);
      order.orderNumber = `${timestamp}${idSuffix}`.toUpperCase();
    }
    
    await order.save();
    
    res.status(200).json({ 
      message: 'Order finalized successfully', 
      order 
    });
  } catch (error) {
    console.error('Error finalizing order:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId)
      .populate('user', 'name email phone')
      .populate({
        path: 'items.menuItem',
        model: 'MenuItem',
        select: 'name price'
      });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    //to debug
    //console.log('Order retrieved:', JSON.stringify(order));
    
    res.status(200).json({ order });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find all orders for this user
    const orders = await Order.find({ user: userId })
      .populate('restaurant', 'name')
      .sort({ createdAt: -1 });
    
    // Format the orders for frontend display
    const formattedOrders = orders.map(order => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      restaurantName: order.restaurant ? order.restaurant.name : 'Unknown Restaurant',
      items: order.items,
      subtotal: order.subtotal,
      convenienceFee: order.convenienceFee,
      totalAmount: order.totalAmount,
      status: order.status,
      paymentStatus: order.paymentStatus || 'pending',
      createdAt: order.createdAt,
      deliveryLocation: order.deliveryLocation,
      specialInstructions: order.specialInstructions,
      estimatedTime: order.estimatedTime
    }));
    
    res.status(200).json({ orders: formattedOrders });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
};