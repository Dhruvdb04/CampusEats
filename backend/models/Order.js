// models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  items: [{
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    name: { type: String } 
  }],
  subtotal: { type: Number, required: true }, 
  convenienceFee: { type: Number, required: true }, 
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ["pending", "preparing", "ready", "completed", "cancelled"], 
    default: "pending" 
  },
  paymentStatus: { 
    type: String, 
    enum: ["pending", "paid", "failed"], 
    default: "pending" 
  },
  specialInstructions: { type: String },
  deliveryLocation: { type: String },
  estimatedTime: { type: String },
  orderNumber: { type: String },
  isFinalized: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);