import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Check, Clock, ShoppingBag, Home, Receipt, AlertTriangle, Copy } from 'lucide-react';
import axiosInstance from '../utils/axiosConfig';

const OrderSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderData, paymentData, paymentType } = location.state || {};
  const [fullOrderData, setFullOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Redirect if no order data
    if (!orderData) {
      navigate('/');
      return;
    }
    
    // Function to finalize order and fetch complete data
    const processOrder = async () => {
      try {
        // Finalize the order if needed
        if (orderData && !orderData.isFinalized) {
          await axiosInstance.post('/order/finalize', {
            orderId: orderData._id,
            restaurantId: orderData.restaurant,
            status: 'pending',
            paymentStatus: paymentType === 'direct-upi' ? 'paid' : 'pending'
          });
        }
        
        // Now fetch the complete order with populated items
        if (orderData._id) {
          const response = await axiosInstance.get(`/order/${orderData._id}`);
          console.log('Full order data:', response.data);
          setFullOrderData(response.data.order);
        }
      } catch (error) {
        console.error('Error processing order:', error);
      } finally {
        setLoading(false);
      }
    };
    
    processOrder();
  }, [orderData, navigate, paymentType]);
  
  if (!orderData && !fullOrderData) {
    return <div className="flex justify-center items-center h-screen">Order not found</div>;
  }
  
  // Use the fully populated order data if available, otherwise fall back to the original order data
  const displayOrder = fullOrderData || orderData;
  
  // Generate order ID
  const orderId = displayOrder.orderNumber || 
                  (displayOrder._id ? displayOrder._id.toString().substring(displayOrder._id.toString().length - 6).toUpperCase() : '000000');
  
  // Copy order ID to clipboard function
  const copyOrderId = () => {
    navigator.clipboard.writeText(orderId);
    alert('Order ID copied to clipboard!');
  };
  
  // Debug information
  console.log("DisplayOrder:", displayOrder);
  console.log("Items structure:", displayOrder.items);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Success Header */}
          <div className="bg-green-500 p-6 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-white text-green-500 mb-4">
              <Check className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-white">Order Confirmed!</h1>
            <p className="text-green-100 mt-1">Your order has been successfully placed.</p>
          </div>
          
          {/* Order ID Section */}
          <div className="bg-blue-50 p-6 text-center border-b">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Your Order ID</h2>
            <div className="flex items-center justify-center">
              <div className="bg-white px-6 py-3 rounded-lg border-2 border-blue-200 font-mono text-2xl font-bold text-blue-800 inline-flex items-center">
                #{orderId}
                <button 
                  onClick={copyOrderId} 
                  className="ml-2 text-blue-500 hover:text-blue-700"
                  title="Copy to clipboard"
                >
                  <Copy className="h-5 w-5" />
                </button>
              </div>
            </div>
            <p className="text-blue-600 mt-3 font-medium">
              Please show this ID when collecting your order
            </p>
          </div>
          
          {/* Order Details */}
          <div className="p-6">
            <div className="mb-6 pb-6 border-b">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <ShoppingBag className="h-5 w-5 text-gray-500 mr-2" />
                  <h2 className="text-lg font-bold text-gray-900">Order Details</h2>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">
                    {new Date().toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="font-medium">
                    {paymentType === 'direct-upi' ? 'UPI Direct Payment' : 'Razorpay'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="font-medium">₹{displayOrder.totalAmount?.toFixed(2) || '0.00'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="text-green-600 font-medium flex items-center">
                    <Check className="h-4 w-4 mr-1" /> Confirmed
                  </p>
                </div>
              </div>
            </div>
            
            {/* Order Items Section */}
            {loading ? (
              <div className="flex justify-center py-6">
                <p>Loading order details...</p>
              </div>
            ) : (
              <div className="mb-6 pb-6 border-b">
                <div className="flex items-center mb-4">
                  <ShoppingBag className="h-5 w-5 text-gray-500 mr-2" />
                  <h2 className="text-lg font-bold text-gray-900">Order Items</h2>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                
                {(displayOrder.items || []).map((item, index) => {
  // Defined variables for item details
  let itemName = "Unknown Item";
  let itemPrice = 0;
  let quantity = item.quantity || 1;
  
  // Case 1: If menuItem is properly populated as an object
  if (item.menuItem && typeof item.menuItem === 'object' && item.menuItem.name) {
    itemName = item.menuItem.name;
    itemPrice = item.menuItem.price || 0;
  }
  // Case 2: If menuItem is just an ID and we have price on the item
  else if (item.price) {
    itemName = "Item";
    itemPrice = item.price;
  }
  // Case 3: If we have direct name and price (from order creation)
  else if (item.name) {
    itemName = item.name;
    itemPrice = item.price || 0;
  }
  
  // If we still don't have item information, try to get it from original order data
  if (itemName === "Unknown Item" && orderData && orderData.items && orderData.items[index]) {
    const originalItem = orderData.items[index];
    
    // Check if original item has menuItem information
    if (originalItem.menuItem && typeof originalItem.menuItem === 'object') {
      itemName = originalItem.menuItem.name || "Item";
      itemPrice = originalItem.menuItem.price || 0;
    } else if (originalItem.price) {
      itemPrice = originalItem.price;
    }
  }
  
  return (
    <div key={index} className="flex justify-between py-2 border-b border-gray-200 last:border-b-0">
      <div className="flex">
        <span className="font-medium">{quantity}x</span>
        <span className="ml-2">{itemName}</span>
      </div>
      <span>₹{(itemPrice * quantity).toFixed(2)}</span>
    </div>
  );
})}

                  
                  <div className="flex justify-between mt-3 pt-3 border-t border-gray-300 font-medium">
                    <span>Total</span>
                    <span>₹{displayOrder.totalAmount?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Estimated Time */}
            <div className="mb-6 pb-6 border-b">
              <div className="flex items-center mb-4">
                <Clock className="h-5 w-5 text-orange-500 mr-2" />
                <h2 className="text-lg font-bold text-gray-900">Estimated Preparation Time</h2>
              </div>
              
              <div className="bg-orange-50 rounded-lg p-4">
                <p className="text-orange-800">
                  Your order will be ready in approximately{' '}
                  <span className="font-bold">
                    {displayOrder.estimatedTime || '20-30'} minutes
                  </span>
                </p>
                <p className="text-sm text-orange-700 mt-1">
                  You will receive notifications when your order is being prepared and when it's ready.
                </p>
              </div>
            </div>
            
            {/* Restaurant Instructions */}
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-5 w-5 text-blue-500 mr-2" />
                <h2 className="text-lg font-bold text-gray-900">Instructions</h2>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-blue-800">
                  Please show your order ID when collecting your order from the restaurant.
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  You can find your order in the "My Orders" section of your profile.
                </p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mt-8">
              <Link 
                to="/"
                className="flex-1 inline-flex justify-center items-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-center"
              >
                <Home className="h-5 w-5 mr-2" />
                Back to Home
              </Link>
              
              <Link 
                to="/orders"
                className="flex-1 inline-flex justify-center items-center px-4 py-3 bg-white border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition text-center"
              >
                <Receipt className="h-5 w-5 mr-2" />
                View Orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;