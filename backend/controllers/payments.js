const razorpay = require('../config/razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Payment = require('../models/payments');
const User = require('../models/User');

// Create Razorpay Order
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const user = await User.findById(req.user.id);

    // Fetch the actual order from database
    const order = await Order.findById(orderId)
      .populate('restaurant')
      .populate('items.item');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Create Razorpay order options
    const options = {
      amount: order.totalAmount * 100, // Amount in paise
      currency: 'INR',
      receipt: `order_${orderId}`,
      payment_capture: 1, // Auto capture payment
      notes: {
        orderId: orderId.toString(),
        userId: user._id.toString(),
      },
    };

    // Create order in Razorpay
    const razorpayOrder = await razorpay.orders.create(options);

    // Create payment record in database
    const payment = await Payment.create({
      order: orderId,
      user: user._id,
      razorpayOrderId: razorpayOrder.id,
      amount: order.totalAmount,
      currency: 'INR',
      status: 'created',
    });

    res.status(200).json({
      success: true,
      order: razorpayOrder,
      paymentId: payment._id,
    });

  } catch (error) {
    console.error('Payment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message,
    });
  }
};

// Verify Payment
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    // Create SHA256 signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest('hex');

    // Validate signature
    const isValid = generatedSignature === razorpay_signature;

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature',
      });
    }

    // Update payment status
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        razorpayPaymentId: razorpay_payment_id,
        status: 'captured',
        paymentDate: new Date(),
      },
      { new: true }
    ).populate('order');

    // Update order status
    await Order.findByIdAndUpdate(payment.order._id, {
      paymentStatus: 'completed',
      status: 'confirmed',
    });

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      payment,
    });

  } catch (error) {
    console.error('Verification Error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message,
    });
  }
};

// Webhook Handler (For async payment updates)
exports.paymentWebhook = async (req, res) => {
  try {
    const body = req.body;
    const signature = req.headers['x-razorpay-signature'];
    
    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(JSON.stringify(body))
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({ status: 'invalid signature' });
    }

    // Handle payment capture event
    if (body.event === 'payment.captured') {
      const payment = body.payload.payment.entity;
      
      await Payment.findOneAndUpdate(
        { razorpayOrderId: payment.order_id },
        {
          razorpayPaymentId: payment.id,
          status: 'captured',
          paymentDate: new Date(payment.created_at * 1000),
        }
      );

      await Order.findOneAndUpdate(
        { _id: payment.notes.orderId },
        { paymentStatus: 'completed' }
      );
    }

    res.json({ status: 'ok' });

  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).json({ status: 'error' });
  }
};