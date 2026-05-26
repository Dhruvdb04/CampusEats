"use client"

import React, { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { 
  GraduationCap, 
  LogOut, 
  User, 
  ShoppingCart, 
  ChevronLeft,
  Save,
  Clock,
  Store,
  Phone,
  Mail,
  Calendar,
  FileText,
  ShieldCheck,
  Award
} from "lucide-react"
import axiosInstance from "../utils/axiosConfig"

const Profile = () => {
  const navigate = useNavigate()
  const [userData, setUserData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    // Fetch user profile data
    const fetchUserProfile = async () => {
      setIsLoading(true)
      try {
        const response = await axiosInstance.get("/auth/user/profile", {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        setUserData(response.data.user)
        setFormData({
          name: response.data.user.name || '',
          phone: response.data.user.phone || ''
        })
      } catch (error) {
        console.error("Failed to fetch profile", error)
        if (error.response?.status === 401) {
          handleLogout()
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserProfile()
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const token = localStorage.getItem('token')
      const response = await axiosInstance.put("/auth/user/profile", formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      setUserData({
        ...userData,
        name: response.data.user.name,
        phone: response.data.user.phone
      })
      
      setSuccessMessage('Profile updated successfully')
      setIsEditing(false)
    } catch (error) {
      console.error("Failed to update profile", error)
      setErrorMessage(error.response?.data?.message || 'Failed to update profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  const getRoleDisplayName = (role) => {
    switch(role) {
      case 'admin':
        return 'Administrator'
      case 'restaurant_owner':
        return 'Restaurant Owner'
      case 'student':
        return 'Student'
      default:
        return role
    }
  }

  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'restaurant_owner':
        return 'bg-green-100 text-green-800'
      case 'student':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
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
                <Link to="/profile" className="text-blue-600 font-medium flex items-center">
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
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-4">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <ChevronLeft className="h-5 w-5 mr-1" />
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-white shadow-lg rounded-xl p-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4 md:mb-0">
              Your Profile
            </h1>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300 inline-flex items-center"
              >
                <User className="h-5 w-5 mr-2" />
                Edit Profile
              </button>
            )}
          </div>

          {successMessage && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Info Card */}
            <div className="md:col-span-2">
              <div className="bg-blue-50 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <User className="h-6 w-6 mr-2 text-blue-600" />
                  Profile Information
                </h2>

                {isEditing ? (
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phone">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false)
                          setFormData({
                            name: userData.name || '',
                            phone: userData.phone || ''
                          })
                          setErrorMessage('')
                          setSuccessMessage('')
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition duration-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300 flex items-center"
                      >
                        {isSaving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-5 w-5 mr-2" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="w-1/3 text-gray-500 flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Name:
                      </div>
                      <div className="w-2/3 font-medium">{userData?.name}</div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-1/3 text-gray-500 flex items-center">
                        <Mail className="h-4 w-4 mr-2" />
                        Email:
                      </div>
                      <div className="w-2/3">{userData?.email}</div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-1/3 text-gray-500 flex items-center">
                        <Phone className="h-4 w-4 mr-2" />
                        Phone:
                      </div>
                      <div className="w-2/3">{userData?.phone || 'Not provided'}</div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-1/3 text-gray-500 flex items-center">
                        <Award className="h-4 w-4 mr-2" />
                        Role:
                      </div>
                      <div className="w-2/3">
                        <span className={`px-3 py-1 rounded-full text-sm ${getRoleBadgeColor(userData?.role)}`}>
                          {getRoleDisplayName(userData?.role)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-1/3 text-gray-500 flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        Member Since:
                      </div>
                      <div className="w-2/3">{userData?.createdAt ? formatDate(userData.createdAt) : 'Unknown'}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Activity Summary Card */}
            <div className="md:col-span-1">
              <div className="bg-blue-50 rounded-lg shadow-md p-6 h-full">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <FileText className="h-6 w-6 mr-2 text-blue-600" />
                  Activity Summary
                </h2>
                
                <div className="space-y-4">
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="flex items-center">
                      <ShoppingCart className="h-5 w-5 text-blue-500 mr-2" />
                      <div>
                        <p className="text-sm text-gray-500">Orders Placed</p>
                        <p className="text-xl font-bold">{userData?.orderHistory?.length || 0}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="flex items-center">
                      <Store className="h-5 w-5 text-blue-500 mr-2" />
                      <div>
                        <p className="text-sm text-gray-500">Favorite Restaurants</p>
                        <p className="text-xl font-bold">{userData?.favouriteRestaurants?.length || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-blue-500 mr-2" />
                      <div>
                        <p className="text-sm text-gray-500">Last Login</p>
                        <p className="text-sm font-medium">Today</p>
                      </div>
                    </div>
                  </div>
                  
                  {userData?.role === 'student' && (
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <div className="flex items-center">
                        <ShieldCheck className="h-5 w-5 text-blue-500 mr-2" />
                        <div>
                          <p className="text-sm text-gray-500">Account Status</p>
                          <p className="text-sm font-medium text-green-600">Active</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            Recent Orders Section
            {/* <div className="md:col-span-3">
              <div className="bg-blue-50 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <ShoppingCart className="h-6 w-6 mr-2 text-blue-600" />
                  Recent Orders
                </h2>
                
                {userData?.orderHistory && userData.orderHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Restaurant
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {userData.orderHistory.slice(0, 5).map((order, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{order.restaurantName}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{formatDate(order.date)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">₹{order.totalAmount?.toFixed(2) ?? '0.00'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                order.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No orders placed yet</p>
                    <Link 
                      to="/"
                      className="mt-3 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300"
                    >
                      Browse Restaurants
                    </Link>
                  </div>
                )}
                
                {userData?.orderHistory && userData.orderHistory.length > 5 && (
                  <div className="mt-4 text-center">
                    <Link 
                      to="/orders"
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View All Orders
                    </Link>
                  </div>
                )}
              </div>
            </div> */}
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

export default Profile