"use client"

import React, { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { 
  GraduationCap, 
  LogOut, 
  Store, 
  ShoppingCart, 
  User, 
  Search,
  PlusCircle,
  BarChart2,
  Activity,
  Eye,
  EyeOff,
  Menu,
  MessageSquare,
  ClipboardList
} from "lucide-react"
import axiosInstance from "../utils/axiosConfig"

const Dashboard = () => {
  const navigate = useNavigate()
  const [userData, setUserData] = useState(null)
  const [restaurants, setRestaurants] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [toggleLoading, setToggleLoading] = useState(null)
  const [expandedRestaurant, setExpandedRestaurant] = useState(null)
  const [settlingFees, setSettlingFees] = useState(null)

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    // Fetch user data and restaurants
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Get user profile
        const userResponse = await axiosInstance.get("/auth/user/profile", {
          headers: { Authorization: `Bearer ${token}` }
        })
        console.log("User data received:", userResponse.data.user); // Debug
        console.log("User data structure:", JSON.stringify(userResponse.data));
        setUserData(userResponse.data.user)
        console.log("userData set to:", userResponse.data.user)
        
        // Get restaurants (the backend will filter based on role)
        const restaurantResponse = await axiosInstance.get("/restaurant", {
          headers: { Authorization: `Bearer ${token}` }
        })
        setRestaurants(restaurantResponse.data.restaurants || [])
      } catch (error) {
        console.error("Failed to fetch data", error)
        if (error.response?.status === 401) {
          handleLogout()
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const handleToggleVisibility = async (restaurantId) => {
    setToggleLoading(restaurantId)
    try {
      const token = localStorage.getItem('token')
      await axiosInstance.patch(`/restaurant/${restaurantId}/toggle-visibility`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      // Update restaurant in local state
      setRestaurants(restaurants.map(restaurant => {
        if (restaurant._id === restaurantId) {
          return { ...restaurant, isPublic: !restaurant.isPublic }
        }
        return restaurant
      }))
    } catch (error) {
      console.error("Failed to toggle visibility", error)
      alert("Failed to change visibility status")
    } finally {
      setToggleLoading(null)
    }
  }

  const handleSettleFees = async (restaurantId) => {
    setSettlingFees(restaurantId)
    try {
      const token = localStorage.getItem('token')
      const response = await axiosInstance.post(
        `/restaurant/${restaurantId}/settle-fees`,
        {},
        { headers: { Authorization: `Bearer ${token}` }}
      )
      
      // Update restaurant in local state
      setRestaurants(restaurants.map(restaurant => {
        if (restaurant._id === restaurantId) {
          return { 
            ...restaurant, 
            accumulatedConvenienceFees: 0,
            lastFeeSettlement: new Date()
          }
        }
        return restaurant
      }))
      
      alert(`Fees settled successfully! Amount: ₹${response.data.settlementAmount.toFixed(2)}`)
    } catch (error) {
      console.error('Failed to settle fees', error)
      alert('Failed to settle convenience fees')
    } finally {
      setSettlingFees(null)
    }
  }

  const handleRestaurantClick = (restaurantId) => {
    // For students, navigate directly to menu
    if (userData?.role === 'student') {
      navigate(`/restaurant/${restaurantId}`)
      return
    }
    
    // For admin and restaurant_owner, toggle dropdown
    if (expandedRestaurant === restaurantId) {
      setExpandedRestaurant(null)
    } else {
      setExpandedRestaurant(restaurantId)
    }
  }

  const filteredRestaurants = restaurants.filter(restaurant => 
    restaurant.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Render different content based on user role
  const renderRoleBasedContent = () => {
    if (!userData) return null
    
    switch(userData.role) {
      case 'admin':
        return (
          <div className="mb-6 bg-blue-50 p-4 rounded-lg">
            <h2 className="text-xl font-bold text-blue-800 mb-2">Admin Dashboard</h2>
            <p className="text-blue-600">
              Admin Console
            </p>
          </div>
        )
      case 'restaurant_owner':
        return (
          <div className="mb-6 bg-green-50 p-4 rounded-lg">
            <h2 className="text-xl font-bold text-green-800 mb-2">Restaurant Owner Dashboard</h2>
            <p className="text-green-600 mb-4">
              Manage your restaurants and view your performance stats.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded-lg shadow-sm flex items-center">
                <Activity className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Total Restaurants</p>
                  <p className="text-2xl font-bold">{restaurants.length}</p>
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm flex items-center">
                <BarChart2 className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="text-2xl font-bold">Active</p>
                </div>
              </div>
            </div>
          </div>
        )
      case 'student':
        return (
          <div className="mb-6 bg-yellow-50 p-4 rounded-lg">
            <h2 className="text-xl font-bold text-yellow-800 mb-2">Student Dashboard</h2>
            <p className="text-yellow-600">
              Enjoy! 
            </p>
          </div>
        )
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
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
              <div className="flex items-center space-x-4">
                <Link to="/profile" className="text-gray-700 hover:text-blue-600 flex items-center">
                  <User className="h-5 w-5 mr-1" />
                  Profile
                </Link>
                <Link to="/orders" className="text-gray-700 hover:text-blue-600 flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-1" />
                  Orders
                </Link>
                <Link to="/contact" className="text-gray-700 hover:text-blue-600 flex items-center">
                <MessageSquare className="h-5 w-5 mr-1" />
                  Contact Us
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
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-grow container mx-auto px-4 py-8">
        <div className="bg-white shadow-lg rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome, {userData?.name || 'User'}
            </h1>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search restaurants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Conditional Add Restaurant Button */}
              {(userData?.role === 'admin' || userData?.role === 'restaurant_owner') && (
                <Link
                  to="/add-restaurant"
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300"
                >
                  <PlusCircle className="h-5 w-5 mr-2" />
                  Add Restaurant
                </Link>
              )}
            </div>
          </div>

          {/* Role-based content */}
          {renderRoleBasedContent()}

          {/* Restaurants Grid */}
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {userData?.role === 'restaurant_owner' ? 'Your Restaurants' : 'Available Restaurants'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRestaurants.map((restaurant) => (
              <div 
                key={restaurant._id} 
                className="bg-blue-50 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition duration-300"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Store className="h-8 w-8 text-blue-600 mr-3" />
                      <h2 
                        className="text-xl font-bold text-gray-900 cursor-pointer hover:text-blue-600"
                        onClick={() => handleRestaurantClick(restaurant._id)}
                      >
                        {restaurant.name}
                      </h2>
                    </div>
                    
                    {/* Visibility toggle button for admin/owner */}
                    {(userData?.role === 'admin' || 
                     (userData?.role === 'restaurant_owner' && restaurant.admin === userData._id)) && (
                      <button 
                        onClick={() => handleToggleVisibility(restaurant._id)}
                        disabled={toggleLoading === restaurant._id}
                        className={`p-2 rounded-full ${
                          restaurant.isPublic ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                        } hover:bg-opacity-80 transition-colors`}
                        title={restaurant.isPublic ? "Currently Public - Click to make Private" : "Currently Private - Click to make Public"}
                      >
                        {toggleLoading === restaurant._id ? (
                          <div className="w-5 h-5 border-2 border-t-transparent border-blue-600 rounded-full animate-spin"></div>
                        ) : restaurant.isPublic ? (
                          <Eye className="h-5 w-5" />
                        ) : (
                          <EyeOff className="h-5 w-5" />
                        )}
                      </button>
                    )}
                  </div>

                  <p className="text-gray-600 mb-4">{restaurant.description || 'No description available'}</p>
                  
                  {/* Visibility indicator */}
                  {(userData?.role === 'admin' || userData?.role === 'restaurant_owner') && (
                    <div className={`mb-3 text-sm rounded-md inline-flex items-center px-2 py-1 ${
                      restaurant.isPublic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {restaurant.isPublic ? (
                        <>
                          <Eye className="h-3 w-3 mr-1" />
                          Public
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3 mr-1" />
                          Private
                        </>
                      )}
                    </div>
                  )}
                  
                  {/* Options dropdown for admin and restaurant_owner */}
                  {(userData?.role === 'admin' || userData?.role === 'restaurant_owner') && 
                    expandedRestaurant === restaurant._id && (
                    <div className="mt-2 mb-4 bg-white rounded-lg shadow-md p-2 border border-gray-200">
                      <Link
                        to={`/restaurant/${restaurant._id}`}
                        className="flex items-center p-2 hover:bg-blue-50 rounded-md text-gray-700 hover:text-blue-600"
                      >
                        <Menu className="h-5 w-5 mr-2" />
                        View Menu
                      </Link>
                      <Link
                        to={`/restaurant/${restaurant._id}/orders`}
                        className="flex items-center p-2 hover:bg-blue-50 rounded-md text-gray-700 hover:text-blue-600"
                      >
                        <ClipboardList className="h-5 w-5 mr-2" />
                        Pending Orders
                      </Link>
                    </div>
                  )}

                  {/* Accumulated Fees Section (Visible only to Admin) */}
                  {userData?.role === 'admin' && (
                    <div className="mt-2 p-3 bg-blue-100 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-blue-800 font-medium">Pending Fees:</span>
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-blue-800">₹{restaurant.accumulatedConvenienceFees?.toFixed(2) || '0.00'}</span>
                          <span className="text-xs text-blue-600">
                            {restaurant.lastFeeSettlement 
                              ? `Last settled: ${new Date(restaurant.lastFeeSettlement).toLocaleDateString()}`
                              : 'Never settled'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSettleFees(restaurant._id);
                        }}
                        disabled={settlingFees === restaurant._id}
                        className="mt-2 w-full py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center justify-center"
                      >
                        {settlingFees === restaurant._id ? (
                          <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                        ) : null}
                        Settle Fees
                      </button>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {restaurant.cuisineType || 'Various'} | {restaurant.contact}
                    </span>
                    {userData?.role === 'student' && (
                      <Link
                        to={`/restaurant/${restaurant._id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View Menu
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredRestaurants.length === 0 && (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Store className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 mb-2">No restaurants found</p>
              
              {userData?.role === 'restaurant_owner' && (
                <Link 
                  to="/add-restaurant"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300"
                >
                  <PlusCircle className="h-5 w-5 mr-2" />
                  Add Your First Restaurant
                </Link>
              )}
            </div>
          )}
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

export default Dashboard