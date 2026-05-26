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
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import axiosInstance from "../utils/axiosConfig";

const RestaurantDashboard = () => {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [orderActionLoading, setOrderActionLoading] = useState(null);
  
  // Toggle state for menu section visibility
  const [showMenu, setShowMenu] = useState(true);
  
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

  // Fetch restaurant, menu items, orders and user data
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
        
        // Fetch pending orders
        const ordersResponse = await axiosInstance.get(`/restaurant/${restaurantId}/orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Filter orders that are pending (not completed or cancelled)
        const pending = ordersResponse.data.orders.filter(
          order => order.status !== 'completed' && order.status !== 'cancelled'
        );
        setPendingOrders(pending);
        
      } catch (error) {
        console.error("Failed to fetch data", error);
        alert("Error loading restaurant data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Set up polling for orders every 30 seconds
    const intervalId = setInterval(() => {
      refreshOrders();
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [restaurantId]);

  // Function to refresh orders
  const refreshOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const ordersResponse = await axiosInstance.get(`/restaurant/${restaurantId}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filter orders that are pending (not completed or cancelled)
      const pending = ordersResponse.data.orders.filter(
        order => order.status !== 'completed' && order.status !== 'cancelled'
      );
      setPendingOrders(pending);
    } catch (error) {
      console.error("Failed to refresh orders", error);
    }
  };

  // Check if user is owner of this restaurant
  const isOwner = userData && restaurant && 
    restaurant.admin && userData._id && 
    restaurant.admin.toString() === userData._id.toString();
  const isAdmin = userData && userData.role === 'restaurant_owner';
  const canManageMenu = isOwner || isAdmin;

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
  
  // Order management functions
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    setOrderActionLoading(orderId);
    
    try {
      const token = localStorage.getItem('token');
      await axiosInstance.put(`/order/${orderId}`, {
        status: newStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update orders in local state
      setPendingOrders(pendingOrders.map(order => 
        order._id === orderId 
          ? { ...order, status: newStatus } 
          : order
      ));
      
      // If the order is completed or cancelled, remove it from pending orders
      if (newStatus === 'completed' || newStatus === 'cancelled') {
        setPendingOrders(pendingOrders.filter(order => order._id !== orderId));
      }
      
    } catch (error) {
      console.error("Failed to update order status", error);
      alert("Error updating order status");
    } finally {
      setOrderActionLoading(null);
    }
  };
  
  // Get status badge color based on order status
  const getStatusColor = (status) => {
    switch(status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get next status options based on current status
  const getNextStatuses = (currentStatus) => {
    switch(currentStatus) {
      case 'pending':
        return ['preparing', 'cancelled'];
      case 'preparing':
        return ['ready', 'cancelled'];
      case 'ready':
        return ['completed', 'cancelled'];
      default:
        return [];
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Calculate time elapsed since order creation
  const getTimeElapsed = (createdAt) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffInMs = now - created;
    const diffInMins = Math.floor(diffInMs / 60000);
    
    if (diffInMins < 1) return 'Just now';
    if (diffInMins === 1) return '1 minute ago';
    if (diffInMins < 60) return `${diffInMins} minutes ago`;
    
    const diffInHours = Math.floor(diffInMins / 60);
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading restaurant dashboard...</p>
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

  // If user is not an owner or admin, redirect to menu page
  if (!canManageMenu) {
    navigate(`/restaurant/${restaurantId}`);
    return null;
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
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => refreshOrders()}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-300"
                title="Refresh Orders"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              
              <button
                onClick={handleAddItem}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Menu Item
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4">
        {/* Form for adding/editing menu items */}
        {showForm && (
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
        
        {/* Split Layout for Orders and Menu */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Orders Section (Left Side) - Always visible */}
          <div className={`${showMenu ? 'md:col-span-2' : 'md:col-span-3'} transition-all duration-300`}>
            <div className="bg-white rounded-lg shadow-md overflow-hidden h-full">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2 text-blue-600" />
                  Pending Orders
                  {pendingOrders.length > 0 && (
                    <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      {pendingOrders.length}
                    </span>
                  )}
                </h2>
                
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  {showMenu ? (
                    <>
                      <ChevronRight className="h-4 w-4 mr-1" />
                      Hide Menu
                    </>
                  ) : (
                    <>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Show Menu
                    </>
                  )}
                </button>
              </div>
              
              <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                {pendingOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No pending orders</p>
                    <p className="text-gray-400 text-sm mt-1">New orders will appear here</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {pendingOrders.map((order) => (
                      <div key={order._id} className="p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center">
                              <h3 className="font-semibold text-gray-900">Order #{order._id.slice(-6).toUpperCase()}</h3>
                              <span className={`ml-2 text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {formatDate(order.createdAt)} ({getTimeElapsed(order.createdAt)})
                            </p>
                          </div>
                          <span className="font-bold text-blue-600">₹{order.totalAmount?.toFixed(2) || 'N/A'}</span>
                        </div>
                        
                        {/* Order Items */}
                        <div className="mb-3 space-y-2">
                          {order.items.map((item) => (
                            <div key={item._id} className="flex justify-between text-sm">
                              <div className="flex items-start">
                                <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center mr-2">
                                  {item.quantity}
                                </span>
                                <span>{item.item.name}</span>
                              </div>
                              <span className="text-gray-700">₹{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                        
                        {/* Customer Details (if available) */}
                        {order.user && (
                          <div className="text-sm bg-gray-50 p-2 rounded mb-3">
                            <p className="font-medium">Customer: {order.user.name}</p>
                            {order.user.email && <p>Email: {order.user.email}</p>}
                            {order.user.phone && <p>Phone: {order.user.phone}</p>}
                          </div>
                        )}
                        
                        {/* Status Actions */}
                        <div className="flex justify-end space-x-2 mt-3">
                          {order.status === 'pending' && (
                            <div className="flex items-center text-orange-700 text-xs mr-auto">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              <span>New order! Please update status.</span>
                            </div>
                          )}
                          
                          {getNextStatuses(order.status).map((status) => (
                            <button
                              key={status}
                              onClick={() => handleUpdateOrderStatus(order._id, status)}
                              disabled={orderActionLoading === order._id}
                              className={`px-3 py-1 text-sm rounded ${
                                status === 'cancelled' 
                                  ? 'border border-red-300 text-red-700 hover:bg-red-50' 
                                  : 'bg-blue-600 text-white hover:bg-blue-700'
                              }`}
                            >
                              {status === 'preparing' && 'Start Preparing'}
                              {status === 'ready' && 'Mark as Ready'}
                              {status === 'completed' && 'Complete Order'}
                              {status === 'cancelled' && 'Cancel Order'}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Menu Section (Right Side) - Can be toggled */}
          {showMenu && (
            <div className="md:col-span-1">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-bold text-gray-900">Menu Items</h2>
                </div>
                
                <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                  {menuItems.length === 0 ? (
                    <div className="text-center py-12">
                      <Store className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 mb-2">No menu items available</p>
                      <button
                        onClick={handleAddItem}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Add Your First Menu Item
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {menuItems.map((item) => (
                        <div 
                          key={item._id}
                          className={`p-4 hover:bg-gray-50 ${!item.available ? 'opacity-75 bg-gray-50' : ''}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-gray-900">{item.name}</h3>
                            {item.available ? (
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                                Available
                              </span>
                            ) : (
                              <span className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded-full">
                                Unavailable
                              </span>
                            )}
                          </div>
                          
                          <div className="text-sm text-gray-600 mb-2">
                            {item.description || 'No description'}
                          </div>
                          
                          <div className="flex items-center space-x-4 mb-2">
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
                          
                          <div className="flex space-x-2 mt-2">
                            <button
                              onClick={() => handleToggleAvailability(item)}
                              disabled={actionLoading === item._id}
                              className={`p-1 text-xs rounded flex items-center ${
                                item.available 
                                  ? 'text-green-600 hover:bg-green-50' 
                                  : 'text-gray-400 hover:bg-gray-50'
                              }`}
                              title={item.available ? "Mark as unavailable" : "Mark as available"}
                            >
                              {actionLoading === item._id ? (
                                <Loader className="h-3 w-3 mr-1 animate-spin" />
                              ) : item.available ? (
                                <Eye className="h-3 w-3 mr-1" />
                              ) : (
                                <EyeOff className="h-3 w-3 mr-1" />
                              )}
                              {item.available ? "Available" : "Unavailable"}
                            </button>
                            
                            <button
                              onClick={() => handleEditItem(item)}
                              className="p-1 text-xs text-blue-600 hover:bg-blue-50 rounded flex items-center"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </button>
                            
                            <button
                              onClick={() => handleDeleteItem(item._id)}
                              disabled={actionLoading === item._id}
                              className="p-1 text-xs text-red-600 hover:bg-red-50 rounded flex items-center"
                            >
                              {actionLoading === item._id ? (
  <Loader className="h-3 w-3 mr-1 animate-spin" />
) : (
  <Trash2 className="h-3 w-3 mr-1" />
)}
Delete
</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantDashboard;