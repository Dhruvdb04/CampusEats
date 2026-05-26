// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/Order');
const { authenticate } = require('../middleware/auth');

router.get('/user', authenticate, OrderController.getUserOrders);
router.get('/:orderId', authenticate, OrderController.getOrderById);
router.post('/', authenticate, OrderController.createOrder);
router.put('/:orderId', authenticate, OrderController.updateOrderStatus);
router.post('/finalize', authenticate, OrderController.finalizeOrder); // Add this new route
router.patch('/:orderId/status', authenticate, OrderController.updateOrderStatus); // This route is used in PendingOrders.js

module.exports = router;