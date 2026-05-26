import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, Loader, Check, Store, Clock, AlertTriangle } from 'lucide-react';
import axiosInstance from '../utils/axiosConfig';

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [paymentOption, setPaymentOption] = useState('upi');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  useEffect(() => {
    // Check if we have order data in the location state
    if (!location.state || !location.state.orderData) {
      navigate('/'); // Redirect if no order data
      return;
    }
  
    // Debug the order data structure
    console.log("Order data received:", location.state.orderData);
    
    setOrder(location.state.orderData);
    
    // Check which restaurant ID property exists
    if (location.state.orderData.restaurantID) {
      console.log("Using restaurantID:", location.state.orderData.restaurantID);
      fetchRestaurantDetails(location.state.orderData.restaurantID);
    } else if (location.state.orderData.restaurantId) {
      console.log("Using restaurantId:", location.state.orderData.restaurantId);
      fetchRestaurantDetails(location.state.orderData.restaurantId);
    } else if (location.state.orderData.restaurant) {
      console.log("Using restaurant:", location.state.orderData.restaurant);
      fetchRestaurantDetails(location.state.orderData.restaurant);
    } else {
      console.error("No restaurant ID found in order data");
      setPaymentError("No restaurant ID found in order data");
      setLoading(false);
    }
  }, [location.state, navigate]);

  const fetchRestaurantDetails = async (restaurantId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      if (!restaurantId) {
        throw new Error('Restaurant ID is undefined');
      }
      
      console.log(`Attempting to fetch restaurant with ID: ${restaurantId}`);
      
      const response = await axiosInstance.get(`/restaurant/${restaurantId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setRestaurant(response.data.restaurant);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch restaurant details", error);
      // Display a more specific error message
      setPaymentError(
        error.response?.status === 404 
          ? "Restaurant not found" 
          : error.message || "Error loading restaurant details"
      );
      setLoading(false);
    }
  };

  const createRazorpayOrder = async () => {
    setPaymentProcessing(true);
    setPaymentError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Create a Razorpay order
      const response = await axiosInstance.post('/payment/create', {
        orderId: order._id,
        // Make sure we're passing the total amount that includes convenience fee
        amount: order.totalAmount
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create payment');
      }
      
      return response.data;
    } catch (error) {
      console.error("Payment creation failed", error);
      setPaymentError(error.message || "Payment initialization failed");
      setPaymentProcessing(false);
      return null;
    }
  };

  const openRazorpayCheckout = async () => {
    const razorpayData = await createRazorpayOrder();
    if (!razorpayData) return;
    
    const options = {
      key: process.env.REACT_APP_RAZORPAY_KEY_ID,
      amount: razorpayData.order.amount,
      currency: razorpayData.order.currency,
      name: restaurant.name,
      description: `Payment for order #${order._id.substr(-6)}`,
      order_id: razorpayData.order.id,
      prefill: {
        name: localStorage.getItem('userName') || '',
        email: localStorage.getItem('userEmail') || '',
        contact: localStorage.getItem('userPhone') || '',
      },
      theme: {
        color: '#3B82F6',
      },
      handler: function(response) {
        verifyPayment(response);
      },
      modal: {
        ondismiss: function() {
          setPaymentProcessing(false);
        }
      }
    };
    
    const razorpayInstance = new window.Razorpay(options);
    razorpayInstance.open();
  };

  const verifyPayment = async (paymentResponse) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await axiosInstance.post('/payment/verify', {
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature,
        // Include order details for verification
        orderId: order._id,
        amount: order.totalAmount
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        navigate('/order-success', { 
          state: { 
            orderData: order,
            paymentData: response.data.payment 
          } 
        });
      } else {
        setPaymentError("Payment verification failed");
        setPaymentProcessing(false);
      }
    } catch (error) {
      console.error("Payment verification failed", error);
      setPaymentError(error.message || "Payment verification failed");
      setPaymentProcessing(false);
    }
  };

  const handleDirectUpiPayment = async () => {
    setPaymentProcessing(true);
    setPaymentError(null);
    
    try {
      // In a real implementation, you would:
      // 1. Get the restaurant UPI ID from the restaurant data
      // 2. Create a direct UPI payment request
      // For this example, we'll simulate the process
      
      setTimeout(() => {
        // Simulate order confirmation with full amount including convenience fee
        navigate('/order-success', { 
          state: { 
            orderData: order,
            paymentType: 'direct-upi'
          } 
        });
      }, 2000);
    } catch (error) {
      console.error("UPI payment failed", error);
      setPaymentError(error.message || "UPI payment failed");
      setPaymentProcessing(false);
    }
  };

  const handlePayment = () => {
    if (paymentOption === 'razorpay') {
      openRazorpayCheckout();
    } else {
      handleDirectUpiPayment();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 pb-8">
      {/* Header */}
      <div className="bg-white shadow-md p-6 mb-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link to="/" className="mr-4 text-gray-500 hover:text-blue-600">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center">
                <CreditCard className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Payment</h1>
                  <p className="text-gray-500">{restaurant?.name || 'Restaurant'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Payment Options - Left Side */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
                  Payment Options
                </h2>
              </div>
              
              <div className="p-6">
                {/* Payment Methods */}
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="upi"
                      name="paymentOption"
                      value="upi"
                      checked={paymentOption === 'upi'}
                      onChange={() => setPaymentOption('upi')}
                      className="h-4 w-4 text-blue-600"
                    />
                    <label htmlFor="upi" className="ml-2 block text-gray-900">
                      <div className="flex items-center">
                        <div className="bg-green-100 rounded-full p-2 mr-3">
                          <img 
                            src="/assets/upi-icon.png" 
                            alt="UPI" 
                            className="h-6 w-6"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2322c55e' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E";
                            }}
                          />
                        </div>
                        <div>
                          <span className="font-medium">UPI Direct Payment</span>
                          <p className="text-sm text-gray-500">Pay directly to restaurant using UPI ID</p>
                        </div>
                      </div>
                    </label>
                  </div>
                  
                  {paymentOption === 'upi' && (
                    <div className="mt-3 ml-6 pl-2 border-l-2 border-green-400">
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="font-semibold text-gray-800">UPI ID: {restaurant?.upiId || 'restaurant@upi'}</p>
                        <p className="text-sm text-gray-600 mt-2">
                          Use any UPI app (Google Pay, PhonePe, Paytm) to pay this restaurant directly.
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <img src="/assets/gpay.png" alt="Google Pay" className="h-8" />
                          <img src="/assets/phonepe.png" alt="PhonePe" className="h-8" />
                          <img src="/assets/paytm.png" alt="Paytm" className="h-8" />
                          <img src="/assets/bhim.png" alt="BHIM" className="h-8" />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="razorpay"
                      name="paymentOption"
                      value="razorpay"
                      checked={paymentOption === 'razorpay'}
                      onChange={() => setPaymentOption('razorpay')}
                      className="h-4 w-4 text-blue-600"
                    />
                    <label htmlFor="razorpay" className="ml-2 block text-gray-900">
                      <div className="flex items-center">
                        <div className="bg-blue-100 rounded-full p-2 mr-3">
                          <img 
                            src="/assets/razorpay-icon.png" 
                            alt="Razorpay" 
                            className="h-6 w-6"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%233b82f6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='1' y='4' width='22' height='16' rx='2' ry='2'/%3E%3Cline x1='1' y1='10' x2='23' y2='10'/%3E%3C/svg%3E";
                            }}
                          />
                        </div>
                        <div>
                          <span className="font-medium">Razorpay</span>
                          <p className="text-sm text-gray-500">Credit/Debit Card, UPI, Netbanking, Wallets</p>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
                
                {/* Error Message */}
                {paymentError && (
                  <div className="mt-6 p-4 bg-red-50 rounded-lg flex items-start">
                    <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-700">Payment Failed</p>
                      <p className="text-sm text-red-500">{paymentError}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Order Summary - Right Side */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Store className="h-5 w-5 mr-2 text-blue-600" />
                  Order Summary
                </h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order ID</span>
                    <span className="font-medium">#{order?._id?.substr(-6) || '000000'}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Items</span>
                    <span className="font-medium">{order?.items?.length || 0}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">₹{order?.subtotal?.toFixed(2) || '0.00'}</span>
                  </div>
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-gray-600">Convenience Fee</span>
                      <span className="block text-xs text-gray-400">(4% of subtotal)</span>
                    </div>
                    <span className="font-medium">₹{order?.convenienceFee?.toFixed(2) || '0.00'}</span>
                  </div>
                  
                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">Total</span>
                      <span className="text-xl font-bold text-blue-600">₹{order?.totalAmount?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={handlePayment}
                    disabled={paymentProcessing}
                    className="w-full px-4 py-3 mt-6 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {paymentProcessing ? (
                      <>
                        <Loader className="h-5 w-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5 mr-2" />
                        Pay Now
                      </>
                    )}
                  </button>
                  
                  <div className="text-center text-sm text-gray-500 mt-4">
                    <Clock className="inline h-4 w-4 mr-1 text-orange-500" />
                    Your order will be confirmed after payment.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;