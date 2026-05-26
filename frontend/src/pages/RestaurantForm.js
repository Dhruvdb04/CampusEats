"use client"

import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Store, Save, Eye, EyeOff } from "lucide-react"
import axiosInstance from "../utils/axiosConfig"

const RestaurantForm = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    description: "",
    cuisineType: "",
    openingHours: "",
    isPublic: true
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem('token')
      const response = await axiosInstance.post("/restaurant", formData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      // Show success message and redirect to dashboard
      alert("Restaurant added successfully!")
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add restaurant")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-xl sm:px-10">
          <div className="mb-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
              <Store className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="mt-3 text-center text-3xl font-extrabold text-gray-900">
              Add New Restaurant
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Restaurant Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="contact" className="block text-sm font-medium text-gray-700">
                Contact Number
              </label>
              <input
                type="text"
                id="contact"
                name="contact"
                value={formData.contact}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="cuisineType" className="block text-sm font-medium text-gray-700">
                Cuisine Type
              </label>
              <input
                type="text"
                id="cuisineType"
                name="cuisineType"
                value={formData.cuisineType}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="openingHours" className="block text-sm font-medium text-gray-700">
                Opening Hours
              </label>
              <input
                type="text"
                id="openingHours"
                name="openingHours"
                value={formData.openingHours}
                onChange={handleInputChange}
                placeholder="e.g., 9 AM - 10 PM"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublic"
                name="isPublic"
                checked={formData.isPublic}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isPublic" className="ml-2 block text-sm font-medium text-gray-700 flex items-center">
                {formData.isPublic ? (
                  <>
                    <Eye className="h-4 w-4 mr-1 text-blue-500" />
                    Visible to Students (Public)
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4 mr-1 text-gray-500" />
                    Not Visible to Students (Private)
                  </>
                )}
              </label>
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-50 p-2 rounded-md">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? "Adding..." : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Add Restaurant
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default RestaurantForm