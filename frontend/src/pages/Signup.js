"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, CheckCircle, Mail, User, Phone, Lock, Shield, GraduationCap } from "lucide-react"
import axiosInstance from "../utils/axiosConfig"

const Signup = () => {
  const [step, setStep] = useState("email")
  const [email, setEmail] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    confirmPassword: "",
    role: "",
    phone: "",
    otp: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await axiosInstance.post("/auth/send-otp", { email })
      setStep("otp")
      setLoading(false)
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP")
      setLoading(false)
    }
  }

  const handleOTPVerification = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Validate form data
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    try {
      const response = await axiosInstance.post("/auth/signup", {
        email,
        ...formData,
        otp: formData.otp,
      })

      setStep("success")
      setLoading(false)
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed")
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const renderProgressBar = () => {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div
            className={`flex flex-col items-center ${step === "email" || step === "otp" || step === "success" ? "text-blue-600" : "text-gray-400"}`}
          >
            <div
              className={`w-10 h-10 flex items-center justify-center rounded-full ${step === "email" || step === "otp" || step === "success" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}`}
            >
              <Mail className="h-5 w-5" />
            </div>
            <span className="text-xs mt-1">Email</span>
          </div>
          <div
            className={`flex-1 h-1 mx-2 ${step === "otp" || step === "success" ? "bg-blue-600" : "bg-gray-200"}`}
          ></div>
          <div
            className={`flex flex-col items-center ${step === "otp" || step === "success" ? "text-blue-600" : "text-gray-400"}`}
          >
            <div
              className={`w-10 h-10 flex items-center justify-center rounded-full ${step === "otp" || step === "success" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}`}
            >
              <User className="h-5 w-5" />
            </div>
            <span className="text-xs mt-1">Profile</span>
          </div>
          <div className={`flex-1 h-1 mx-2 ${step === "success" ? "bg-blue-600" : "bg-gray-200"}`}></div>
          <div className={`flex flex-col items-center ${step === "success" ? "text-blue-600" : "text-gray-400"}`}>
            <div
              className={`w-10 h-10 flex items-center justify-center rounded-full ${step === "success" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}`}
            >
              <CheckCircle className="h-5 w-5" />
            </div>
            <span className="text-xs mt-1">Complete</span>
          </div>
        </div>
      </div>
    )
  }

  const renderStep = () => {
    switch (step) {
      case "email":
        return (
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="pl-10 block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">We'll send a verification code to this email</p>
            </div>
            {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded-md">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300"
            >
              {loading ? "Sending OTP..." : "Send Verification Code"}
            </button>
            <div className="text-center mt-4">
              <Link to="/" className="text-blue-600 hover:text-blue-800 text-sm flex items-center justify-center">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to Home
              </Link>
            </div>
          </form>
        )

      case "otp":
        return (
          <form onSubmit={handleOTPVerification} className="space-y-6">
            <div className="grid grid-cols-1 gap-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="John Doe"
                    className="pl-10 block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Role</option>
                  <option value="student">Student</option>
                  <option value="restaurant_owner">Restaurant Owner</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="(123) 456-7890"
                    className="pl-10 block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    placeholder="••••••••"
                    className="pl-10 block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    placeholder="••••••••"
                    className="pl-10 block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                  Verification Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Shield className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="otp"
                    name="otp"
                    value={formData.otp}
                    onChange={handleInputChange}
                    required
                    placeholder="123456"
                    className="pl-10 block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">Enter the code sent to {email}</p>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded-md">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300"
            >
              {loading ? "Creating Account..." : "Complete Signup"}
            </button>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setStep("email")}
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center justify-center"
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to Email
              </button>
            </div>
          </form>
        )

      case "success":
        return (
          <div className="text-center space-y-6 py-6">
            <div className="flex justify-center">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Signup Successful!</h2>
            <p className="text-gray-600">Your account has been created successfully.</p>
            <Link
              to="/login"
              className="w-full block text-center bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300 shadow-md font-medium"
            >
              Go to Login
            </Link>
            <Link to="/" className="text-blue-600 hover:text-blue-800 text-sm flex items-center justify-center mt-4">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Home
            </Link>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center mb-6">
          <div className="bg-blue-600 p-3 rounded-full">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
        </Link>
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          {step === "email" ? "Start Your Signup" : step === "otp" ? "Complete Your Profile" : "Signup Complete"}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {step !== "success" && "Join CampusEats to order delicious food on campus"}
        </p>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-lg sm:rounded-xl sm:px-10">
            {renderProgressBar()}
            {renderStep()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Signup

