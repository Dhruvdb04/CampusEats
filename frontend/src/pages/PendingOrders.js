"use client"

import React, { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { 
  GraduationCap, 
  LogOut, 
  User, 
  ShoppingCart, 
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  DollarSign,
  Clipboard,
  Briefcase,
  Phone,
  MapPin,
  MoreVertical,
  Filter,
  RefreshCw,
  Copy
} from "lucide-react"
import axiosInstance from "../utils/axiosConfig"

const PendingOrders = () => {
  const { restaurantId } = useParams()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [restaurant, setRestaurant] = useState(null)
  const [userData, setUserData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("pending") // Default filter: pending
  const [expandedOrder, setExpandedOrder] = useState(null)
  const [processingOrder, setProcessingOrder] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return
  
      // Get orders for this restaurant with the current filter
      const ordersResponse = await axiosInstance.get(`/restaurant/${restaurantId}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: statusFilter }
      })
      setOrders(ordersResponse.data.orders || [])
    } catch (error) {
      console.error("Failed to fetch orders", error)
      // Don't set orders to empty array on error, keep previous state
      if (!error.response || error.response.status !== 404) {
        setOrders([]) // Only clear orders on non-404 errors
      }
    }
  }

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    // Fetch data (user, restaurant, orders)
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Get user profile
        const userResponse = await axiosInstance.get("/auth/user/profile", {
          headers: { Authorization: `Bearer ${token}` }
        })
        setUserData(userResponse.data.user)
        
        // Verify if user is admin or restaurant owner
        const role = userResponse.data.user.role
        if (role !== 'admin' && role !== 'restaurant_owner') {
          navigate('/dashboard')
          return
        }
        
        // Get restaurant details
        const restaurantResponse = await axiosInstance.get(`/restaurant/${restaurantId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setRestaurant(restaurantResponse.data.restaurant)
        
        // Get orders with current filter
        await fetchOrders()
      } catch (error) {
        console.error("Failed to fetch data", error)
        if (error.response?.status === 401) {
          handleLogout()
        } else if (error.response?.status === 403) {
          navigate('/dashboard')
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    // Set up a polling interval to refresh orders every 30 seconds
    const intervalId = setInterval(fetchOrders, 30000)
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId)
  }, [navigate, restaurantId, statusFilter])

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchOrders()
    setRefreshing(false)
  }

  const handleOrderStatus = async (orderId, newStatus) => {
    setProcessingOrder(orderId)
    try {
      const token = localStorage.getItem('token')
      await axiosInstance.patch(`/order/${orderId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` }}
      )
      
      // Update order in local state
      setOrders(orders.map(order => {
        if (order._id === orderId) {
          return { ...order, status: newStatus }
        }
        return order
      }))
      
      // If we're filtering by status, remove the updated order from the list
      if (statusFilter !== "all" && statusFilter !== newStatus) {
        setOrders(orders.filter(order => order._id !== orderId))
      }
    } catch (error) {
      console.error("Failed to update order status", error)
      alert("Failed to update order status")
    } finally {
      setProcessingOrder(null)
    }
  }

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending':
        return "bg-yellow-100 text-yellow-800"
      case 'preparing':
        return "bg-blue-100 text-blue-800"
      case 'ready':
        return "bg-green-100 text-green-800"
      case 'completed':
        return "bg-gray-100 text-gray-800"
      case 'cancelled':
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending':
        return <Clock className="h-4 w-4 mr-1" />
      case 'preparing':
        return <Briefcase className="h-4 w-4 mr-1" />
      case 'ready':
        return <CheckCircle className="h-4 w-4 mr-1" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 mr-1" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 mr-1" />
      default:
        return <Clock className="h-4 w-4 mr-1" />
    }
  }

  const toggleExpandOrder = (orderId) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null)
    } else {
      setExpandedOrder(orderId)
    }
  }

  // Format order ID to match OrderSuccess page format
  const formatOrderId = (orderId) => {
    return orderId?.substr(-6).toUpperCase() || '000000';
  }

  // Copy order ID to clipboard function
  const copyOrderId = (orderId) => {
    const formattedId = formatOrderId(orderId);
    navigator.clipboard.writeText(formattedId);
    alert('Order ID copied to clipboard!');
  };

  const renderOrderItems = (items) => {
    return items.map((item, index) => (
      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
        <div className="flex items-center">
          <span className="font-medium">{item.quantity}x</span>
          <span className="ml-2">{item.menuItem?.name || 'Item'}</span>
        </div>
        <span className="text-gray-700">₹{((item.menuItem?.price || 0) * item.quantity).toFixed(2)}</span>
      </div>
    ))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex-shrink-0 flex items-center">
                <div className="bg-blue-600 p-2 rounded-full">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">CampusEats</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/profile" className="text-gray-700 hover:text-blue-600 flex items-center">
                <User className="h-5 w-5 mr-1" />
                Profile
              </Link>
              <Link to="/orders" className="text-gray-700 hover:text-blue-600 flex items-center">
                <ShoppingCart className="h-5 w-5 mr-1" />
                Orders
              </Link>
              <button 
                onClick={handleLogout}
                className="text-gray-700 hover:text-red-600 flex items-center"
              >
                <LogOut className="h-5 w-5 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-grow container mx-auto px-4 py-6">
        <div className="bg-white shadow-lg rounded-xl p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <Link to="/dashboard" className="mr-4">
                <ArrowLeft className="h-5 w-5 text-blue-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {restaurant?.name || 'Restaurant'} - Orders
                </h1>
                <p className="text-gray-500">
                  Manage and track all incoming orders
                </p>
              </div>
            </div>
            
            {/* Filter and Refresh */}
            <div className="flex items-center space-x-3">
              <button 
                onClick={handleRefresh} 
                className={`text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50 ${refreshing ? 'animate-spin' : ''}`}
                disabled={refreshing}
              >
                <RefreshCw className="h-5 w-5" />
              </button>

              <div className="relative">
                <Filter className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="pending">Pending Orders</option>
                  <option value="completed">Completed Orders</option>
                </select>
              </div>
            </div>
          </div>

          {/* Orders List */}
          <div className="space-y-4">
            {orders.length > 0 ? (
              orders.map((order) => (
                <div 
                  key={order._id} 
                  className="bg-blue-50 rounded-lg shadow-sm overflow-hidden"
                >
                  {/* Order Header */}
                  <div className="p-4 cursor-pointer hover:bg-blue-100" onClick={() => toggleExpandOrder(order._id)}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="bg-blue-600 p-2 rounded-full mr-3">
                          <Clipboard className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center">
                            <h3 className="font-bold text-gray-900">#{formatOrderId(order._id)}</h3>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent expanding when clicking the copy button
                                copyOrderId(order._id);
                              }} 
                              className="ml-2 text-blue-500 hover:text-blue-700"
                              title="Copy to clipboard"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.user?.name || 'Customer'} • {formatDate(order.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </div>
                        <span className="font-semibold">₹{order.totalAmount.toFixed(2)}</span>
                        <MoreVertical className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  {/* Order Details (expandable) */}
                  {expandedOrder === order._id && (
                    <div className="border-t border-blue-200 p-4 bg-white">
                      {/* Order ID Section (Highlighted) */}
                      <div className="mb-4 bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <h4 className="font-medium text-gray-700 mb-2">Order ID</h4>
                        <div className="flex items-center justify-between">
                          <div className="bg-white px-4 py-2 rounded-lg border-2 border-blue-200 font-mono text-xl font-bold text-blue-800 inline-flex items-center">
                            #{formatOrderId(order._id)}
                          </div>
                          <p className="text-blue-600 font-medium">
                            Student will use this ID when collecting the order
                          </p>
                        </div>
                      </div>
                    
                      {/* Order Items */}
                      <div className="mb-4">
  <h4 className="font-medium text-gray-700 mb-2">Order Items</h4>
  <div className="bg-gray-50 p-3 rounded-lg">
    {order.items && order.items.length > 0 ? (
      renderOrderItems(order.items)
    ) : (
      <p className="text-gray-500">No items found for this order</p>
    )}
    <div className="mt-2 pt-2 border-t border-gray-200">
      <div className="flex justify-between">
        <span>Subtotal</span>
        <span>₹{order.subtotal.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-blue-600">
        <span>Convenience Fee (4%)</span>
        <span>₹{order.convenienceFee.toFixed(2)}</span>
      </div>
      <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between font-medium">
        <span>Total</span>
        <span>₹{order.totalAmount.toFixed(2)}</span>
      </div>
    </div>
  </div>
</div>

                      {/* Customer Info */}
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-700 mb-2">Customer Information</h4>
                        <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-500 mr-2" />
                            <span>{order.user?.name || 'N/A'}</span>
                          </div>
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 text-gray-500 mr-2" />
                            <span>{order.user?.phone || 'N/A'}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                            <span>{order.deliveryLocation || 'Pickup'}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                            <span>{formatDate(order.createdAt)}</span>
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 text-gray-500 mr-2" />
                            <span>Payment: {order.paymentStatus || 'Pending'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Special Instructions */}
                      {order.specialInstructions && (
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-700 mb-2">Special Instructions</h4>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-gray-600">{order.specialInstructions}</p>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 mt-4">
                        {order.status === 'pending' && (
                          <button
                            onClick={() => handleOrderStatus(order._id, 'completed')}
                            disabled={processingOrder === order._id}
                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-300"
                          >
                            {processingOrder === order._id ? (
                              <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                            ) : (
                              <CheckCircle className="h-5 w-5 mr-2" />
                            )}
                            Mark as Completed
                          </button>
                        )}
                        
                        {order.status === 'pending' && (
                          <button
                            onClick={() => handleOrderStatus(order._id, 'cancelled')}
                            disabled={processingOrder === order._id}
                            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-300"
                          >
                            {processingOrder === order._id ? (
                              <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                            ) : (
                              <XCircle className="h-5 w-5 mr-2" />
                            )}
                            Cancel Order
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Clipboard className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 mb-2">No {statusFilter !== 'all' ? statusFilter : ''} orders found</p>
                <p className="text-gray-400">When customers place orders, they will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white py-4 shadow-md mt-auto">
        <div className="text-center text-sm text-gray-500">
          © {new Date().getFullYear()} CampusEats. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

export default PendingOrders