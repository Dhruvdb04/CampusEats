const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const PaymentController = require('../controllers/payments');

router.post('/create', authenticate, PaymentController.createRazorpayOrder);
router.post('/verify', authenticate, PaymentController.verifyPayment);
router.post('/webhook', PaymentController.paymentWebhook); // Webhooks usually don't require auth

module.exports = router;