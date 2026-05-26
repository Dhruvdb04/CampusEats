import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import {
  Store,
  ArrowLeft,
  ShoppingCart,
  CreditCard,
  Clock,
  Check,
  Loader
} from "lucide-react";
import axiosInstance from "../utils/axiosConfig";

const OrderSummary = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { restaurantId } = useParams();
  const [orderItems, setOrderItems] = useState({});
  const [menuItems, setMenuItems] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState('');
  
  // Calculate order details
  const subtotal = Object.keys(orderItems).reduce((total, itemId) => {
    const menuItem = menuItems.find(item => item._id === itemId);
    if (menuItem) {
      return total + (menuItem.price * orderItems[itemId]);
    }
    return total;
  }, 0);
  
  const convenienceFee = subtotal * 0.04;
  const totalAmount = subtotal + convenienceFee;
  
  // Use location state to get order items from previous page
  useEffect(() => {
    if (location.state && location.state.orderItems) {
      setOrderItems(location.state.orderItems);
    } else {
      // If no order items in state, redirect back to menu
      navigate(`/restaurant/${restaurantId}`);
    }
  }, [location.state, restaurantId, navigate]);
  
  // Fetch restaurant and menu data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }
        
        // Fetch restaurant details
        const restaurantResponse = await axiosInstance.get(`/restaurant/${restaurantId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRestaurant(restaurantResponse.data.restaurant);
        
        // Fetch menu items to get details for items in the cart
        const menuResponse = await axiosInstance.get(`/restaurant/${restaurantId}/menu`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMenuItems(menuResponse.data.menuItems || []);
      } catch (error) {
        console.error("Failed to fetch data", error);
        alert("Error loading order data");
      } finally {
        setLoading(false);
      }
    };
    
    if (restaurantId) {
      fetchData();
    }
  }, [restaurantId]);
  
  const handlePlaceOrder = async () => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Format order items for API
      const formattedItems = Object.keys(orderItems).map(itemId => {
        const menuItem = menuItems.find(item => item._id === itemId);
        return {
          item: itemId,
          quantity: orderItems[itemId],
          price: menuItem.price
        };
      });
      
      // Create order
      // Update in OrderSummary.js around line 83
  const response = await axiosInstance.post('/order', {
  restaurantID: restaurantId,
  items: formattedItems,
  subtotal: subtotal,
  convenienceFee: convenienceFee,
  totalAmount: totalAmount,
  deliveryLocation: deliveryLocation
}, {
  headers: { Authorization: `Bearer ${token}` }
});
      
      // Navigate to payment page with order data
      navigate('/payment', { state: { orderData: response.data.order } });
    } catch (error) {
      console.error("Failed to place order", error);
      alert("Error placing your order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order summary...</p>
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
              <Link to={`/restaurant/${restaurantId}`} className="mr-4 text-gray-500 hover:text-blue-600">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center">
                <ShoppingCart className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Order Summary</h1>
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
          {/* Order Summary - Left Side (2/3 width on medium screens and up) */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2 text-blue-600" />
                  Your Order Details
                </h2>
              </div>
              
              <div className="p-6">
                {Object.keys(orderItems).length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Your cart is empty</p>
                    <Link 
                      to={`/restaurant/${restaurantId}`}
                      className="inline-flex items-center mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Menu
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Restaurant Info */}
                    <div className="flex items-start mb-6 pb-4 border-b">
                      <Store className="h-6 w-6 text-blue-600 mr-3" />
                      <div>
                        <h3 className="font-semibold text-gray-900">{restaurant?.name}</h3>
                        <p className="text-gray-500 text-sm">{restaurant?.description || 'No description available'}</p>
                      </div>
                    </div>
                    
                    {/* Order Items */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">Order Items</h3>
                      {Object.keys(orderItems).map(itemId => {
                        const item = menuItems.find(menuItem => menuItem._id === itemId);
                        if (!item) return null;
                        
                        return (
                          <div key={itemId} className="flex justify-between items-center py-3 border-b">
                            <div className="flex items-start">
                              <div className="bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center mr-3">
                                <span className="font-medium text-blue-600">{orderItems[itemId]}×</span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{item.name}</p>
                                <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                                {item.preparationTime && (
                                  <div className="flex items-center text-orange-700 text-sm mt-1">
                                    <Clock className="h-3 w-3 mr-1" />
                                    <span>{item.preparationTime} min</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">₹{(item.price * orderItems[itemId]).toFixed(2)}</p>
                              <p className="text-sm text-gray-500">₹{item.price} each</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Changes MADE HERE - Added delivery location input and estimated time display */}
                    {/* Delivery Location */}
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        📍 Delivery Location
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Hostel Sarojini, 3rd Floor, Room 305"
                        value={deliveryLocation}
                        onChange={(e) => setDeliveryLocation(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    {/* Estimated Time */}
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 text-blue-600 mr-2" />
                        <span className="font-medium text-gray-800">Estimated Preparation Time:</span>
                      </div>
                      <p className="text-gray-700 ml-7 mt-1">
                        Approximately {Math.max(...Object.keys(orderItems).map(itemId => {
                          const item = menuItems.find(menuItem => menuItem._id === itemId);
                          return item?.preparationTime || 15;
                        })) || 15} minutes
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Payment Summary - Right Side (1/3 width) */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
                  Payment Summary
                </h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-gray-600">Convenience Fee</span>
                      <span className="block text-xs text-gray-400">(4% of subtotal)</span>
                    </div>
                    <span className="font-medium">₹{convenienceFee.toFixed(2)}</span>
                  </div>
                  
                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">Total</span>
                      <span className="text-xl font-bold text-blue-600">₹{totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  {/* Warning for not entering the delivery location */}
                  {!deliveryLocation.trim() && (
                    <p className="text-red-500 text-xs mt-2 text-center">
                      ⚠️ Please enter your delivery location to proceed
                    </p>
                  )}

                  <button
                    onClick={handlePlaceOrder}
                    disabled={submitting || Object.keys(orderItems).length === 0 || !deliveryLocation.trim()}
                    className="w-full px-4 py-3 mt-6 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader className="h-5 w-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Check className="h-5 w-5 mr-2" />
                        Place Order
                      </>
                    )}
                  </button>
                  
                  <div className="text-center text-sm text-gray-500 mt-4">
                    By placing this order, you agree to our terms and conditions.
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

export default OrderSummary;