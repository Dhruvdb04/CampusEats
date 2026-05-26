"use client"

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  Store, 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  DollarSign, 
  Eye, 
  EyeOff,
  ArrowLeft,
  Loader,
  ShoppingCart,
  PlusCircle,
  MinusCircle
} from "lucide-react";
import axiosInstance from "../utils/axiosConfig";

const RestaurantMenu = () => {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  
  // Order state for students
  const [orderItems, setOrderItems] = useState({});
  const [orderTotal, setOrderTotal] = useState(0);
  
  // Form states
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
  const [currentItem, setCurrentItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    preparationTime: '',
    available: true
  });

  // Fetch restaurant, menu items and user data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }
        
        // Fetch user profile
        const userResponse = await axiosInstance.get("/auth/user/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserData(userResponse.data.user);
        
        // Fetch restaurant details
        const restaurantResponse = await axiosInstance.get(`/restaurant/${restaurantId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRestaurant(restaurantResponse.data.restaurant);
        
        // Fetch menu items
        const menuResponse = await axiosInstance.get(`/restaurant/${restaurantId}/menu`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMenuItems(menuResponse.data.menuItems || []);
        
      } catch (error) {
        console.error("Failed to fetch data", error);
        alert("Error loading restaurant data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [restaurantId]);

  // Check if user is owner of this restaurant and ADMIN have access to the Menu - FIXED
  const isOwner = userData && restaurant && 
    restaurant.admin && userData._id && 
    restaurant.admin.toString() === userData._id.toString();
  const isAdmin = userData && userData.role === 'restaurant_owner';
  const isSuperAdmin = userData && userData.role === 'admin';
  const isStudent = userData && userData.role === 'student';
  const canManageMenu = isOwner || isAdmin || isSuperAdmin;

  // Update order total whenever orderItems changes
  useEffect(() => {
    let total = 0;
    Object.keys(orderItems).forEach(itemId => {
      const menuItem = menuItems.find(item => item._id === itemId);
      if (menuItem) {
        total += menuItem.price * orderItems[itemId];
      }
    });
    setOrderTotal(total);
  }, [orderItems, menuItems]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      preparationTime: '',
      available: true
    });
    setCurrentItem(null);
    setFormMode('add');
    setShowForm(false);
  };

  const handleAddItem = () => {
    setFormMode('add');
    resetForm();
    setShowForm(true);
  };

  const handleEditItem = (item) => {
    setFormMode('edit');
    setCurrentItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price,
      preparationTime: item.preparationTime || '',
      available: item.available
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.price) {
      alert('Name and price are required');
      return;
    }
    
    setActionLoading('form');
    
    try {
      const token = localStorage.getItem('token');
      
      if (formMode === 'add') {
        // Create new menu item
        const response = await axiosInstance.post('/food', {
          ...formData,
          restaurantID: restaurantId,
          price: parseFloat(formData.price),
          preparationTime: formData.preparationTime ? parseInt(formData.preparationTime) : undefined
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setMenuItems([...menuItems, response.data.menuItem]);
        alert('Menu item added successfully');
      } else {
        // Update existing menu item
        const response = await axiosInstance.put(`/food/${currentItem._id}`, {
          ...formData,
          price: parseFloat(formData.price),
          preparationTime: formData.preparationTime ? parseInt(formData.preparationTime) : undefined
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Update the menu items list
        setMenuItems(menuItems.map(item => 
          item._id === currentItem._id ? response.data.menuItem : item
        ));
        alert('Menu item updated successfully');
      }
      
      resetForm();
    } catch (error) {
      console.error("Failed to save menu item", error);
      alert("Error saving menu item");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }
    
    setActionLoading(itemId);
    
    try {
      const token = localStorage.getItem('token');
      await axiosInstance.delete(`/food/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove from local state
      setMenuItems(menuItems.filter(item => item._id !== itemId));
      alert('Menu item deleted successfully');
    } catch (error) {
      console.error("Failed to delete menu item", error);
      alert("Error deleting menu item");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleAvailability = async (item) => {
    setActionLoading(item._id);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axiosInstance.put(`/food/${item._id}`, {
        available: !item.available
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update item in local state
      setMenuItems(menuItems.map(menuItem => 
        menuItem._id === item._id ? response.data.menuItem : menuItem
      ));
    } catch (error) {
      console.error("Failed to toggle availability", error);
      alert("Error updating item availability");
    } finally {
      setActionLoading(null);
    }
  };

  // Student order functions
  const increaseQuantity = (itemId) => {
    setOrderItems(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
  };

  const decreaseQuantity = (itemId) => {
    setOrderItems(prev => {
      const newQuantity = Math.max(0, (prev[itemId] || 0) - 1);
      const newOrderItems = { ...prev, [itemId]: newQuantity };
      
      // Remove item from order if quantity is 0
      if (newQuantity === 0) {
        delete newOrderItems[itemId];
      }
      
      return newOrderItems;
    });
  };

  const getItemQuantity = (itemId) => {
    return orderItems[itemId] || 0;
  };

  const handlePlaceOrder = () => {
    // Check if there are items in the order
    if (Object.keys(orderItems).length === 0) {
      alert('Please add items to your order');
      return;
    }
    
    // Navigate to the order summary page with the order items in state
    navigate(`/restaurant/${restaurantId}/checkout`, {
      state: {
        orderItems: orderItems
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Restaurant Not Found</h2>
          <p className="text-gray-600 mb-4">The restaurant you're looking for doesn't exist or you don't have permission to view it.</p>
          <Link to="/dashboard" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
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
              <Link to="/dashboard" className="mr-4 text-gray-500 hover:text-blue-600">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center">
                <Store className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{restaurant.name}</h1>
                  <p className="text-gray-500">{restaurant.description || 'No description available'}</p>
                </div>
              </div>
            </div>
            
            {canManageMenu && (
              <button
                onClick={handleAddItem}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Menu Item
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4">
        {/* Form for adding/editing menu items */}
        {showForm && canManageMenu && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {formMode === 'add' ? 'Add New Menu Item' : 'Edit Menu Item'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preparation Time (minutes)
                  </label>
                  <input
                    type="number"
                    name="preparationTime"
                    value={formData.preparationTime}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex items-center h-full pt-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="available"
                      checked={formData.available}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Available for ordering</span>
                  </label>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'form'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  {actionLoading === 'form' ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Item'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Student's Order Summary - Visible only when items are in the cart */}
        {isStudent && Object.keys(orderItems).length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2 text-blue-600" />
                Your Order
              </h2>
              <span className="text-xl font-bold text-blue-600">₹{orderTotal.toFixed(2)}</span>
            </div>
            
            <div className="space-y-3 mb-4">
              {Object.keys(orderItems).map(itemId => {
                const item = menuItems.find(menuItem => menuItem._id === itemId);
                if (!item) return null;
                
                return (
                  <div key={`order-${itemId}`} className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{item.name}</span>
                      <span className="text-gray-500 ml-2">
                        ({orderItems[itemId]} × ₹{item.price})
                      </span>
                    </div>
                    <span className="font-semibold">₹{(item.price * orderItems[itemId]).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
            
            <button
              onClick={handlePlaceOrder}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center justify-center"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Place Order
            </button>
          </div>
        )}
        
        {/* Menu Items - Show as grid for restaurant owners, list for students */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">Menu Items</h2>
          </div>
          
          {menuItems.length === 0 ? (
            <div className="text-center py-12">
              <Store className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 mb-2">No menu items available</p>
              {canManageMenu && !showForm && (
                <button
                  onClick={handleAddItem}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Your First Menu Item
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Admin View - Grid */}
              {canManageMenu && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                  {menuItems.map((item) => (
                    <div 
                      key={item._id}
                      className={`border rounded-lg overflow-hidden shadow-sm transition duration-200 ${
                        !item.available ? 'bg-gray-50 opacity-75' : 'bg-white'
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                          {item.available ? (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                              Available
                            </span>
                          ) : (
                            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                              Unavailable
                            </span>
                          )}
                        </div>
                        
                        {item.description && (
                          <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                        )}
                        
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center text-green-700">
                              <DollarSign className="h-4 w-4 mr-1" />
                              <span className="font-semibold">₹{item.price}</span>
                            </div>
                            
                            {item.preparationTime && (
                              <div className="flex items-center text-orange-700">
                                <Clock className="h-4 w-4 mr-1" />
                                <span>{item.preparationTime} min</span>
                              </div>
                            )}
                          </div>
                          
                          {canManageMenu && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleToggleAvailability(item)}
                                disabled={actionLoading === item._id}
                                className={`p-1.5 rounded-full ${
                                  item.available 
                                    ? 'text-green-600 hover:bg-green-50' 
                                    : 'text-gray-400 hover:bg-gray-50'
                                }`}
                                title={item.available ? "Mark as unavailable" : "Mark as available"}
                              >
                                {actionLoading === item._id ? (
                                  <Loader className="h-4 w-4 animate-spin" />
                                ) : item.available ? (
                                  <Eye className="h-4 w-4" />
                                ) : (
                                  <EyeOff className="h-4 w-4" />
                                )}
                              </button>
                              
                              <button
                                onClick={() => handleEditItem(item)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full"
                                title="Edit item"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              
                              <button
                                onClick={() => handleDeleteItem(item._id)}
                                disabled={actionLoading === item._id}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-full"
                                title="Delete item"
                              >
                                {actionLoading === item._id ? (
                                  <Loader className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Student View - List with quantity counters */}
              {isStudent && (
                <div className="divide-y">
                  {menuItems.filter(item => item.available).map((item) => (
                    <div 
                      key={item._id}
                      className="flex justify-between items-center p-4 hover:bg-gray-50 transition"
                    >
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                        {item.description && (
                          <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                        )}
                        <div className="flex items-center mt-2 space-x-4">
                          <div className="flex items-center text-green-700">
                            <DollarSign className="h-4 w-4 mr-1" />
                            <span className="font-semibold">₹{item.price}</span>
                          </div>
                          
                          {item.preparationTime && (
                            <div className="flex items-center text-orange-700">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>{item.preparationTime} min</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => decreaseQuantity(item._id)}
                          className={`p-1 rounded-full ${
                            getItemQuantity(item._id) > 0
                              ? 'text-blue-600 hover:bg-blue-50'
                              : 'text-gray-300 cursor-not-allowed'
                          }`}
                          disabled={getItemQuantity(item._id) === 0}
                        >
                          <MinusCircle className="h-6 w-6" />
                        </button>
                        
                        <span className="w-8 text-center font-medium">
                          {getItemQuantity(item._id)}
                        </span>
                        
                        <button
                          onClick={() => increaseQuantity(item._id)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded-full"
                        >
                          <PlusCircle className="h-6 w-6" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Show unavailable items at the bottom */}
                  {menuItems.filter(item => !item.available).length > 0 && (
                    <div className="p-3 bg-gray-50">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Currently Unavailable</h3>
                      {menuItems.filter(item => !item.available).map((item) => (
                        <div 
                          key={item._id}
                          className="flex justify-between items-center p-3 opacity-60"
                        >
                          <div>
                            <h3 className="font-medium text-gray-800">{item.name}</h3>
                            <div className="flex items-center mt-1">
                              <DollarSign className="h-3 w-3 mr-1 text-gray-600" />
                              <span className="text-gray-600 text-sm">₹{item.price}</span>
                            </div>
                          </div>
                          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                            Unavailable
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantMenu;