"use client"

import React, { useState } from "react"
import { Send, Upload, X } from "lucide-react"
import axiosInstance from "../utils/axiosConfig"

const ContactUs = () => {
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
  })
  const [files, setFiles] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState({ type: "", message: "" })

  const handleChange = (e) => {
    const { name, value } = e.target
    // For subject field, enforce the 50 character limit
    if (name === "subject" && value.length > 50) {
      return
    }
    
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files)
    // Limit to 3 files
    if (files.length + selectedFiles.length > 3) {
      setFeedback({
        type: "error",
        message: "You can upload a maximum of 3 files"
      })
      return
    }
    
    // Validate file size (5MB max per file)
    const validFiles = selectedFiles.filter(file => file.size <= 5 * 1024 * 1024)
    if (validFiles.length !== selectedFiles.length) {
      setFeedback({
        type: "error",
        message: "Some files exceed the 5MB size limit and were not added"
      })
    }
    
    setFiles([...files, ...validFiles])
    // Reset the input value so the same file can be selected again
    e.target.value = ""
  }

  const removeFile = (indexToRemove) => {
    setFiles(files.filter((_, index) => index !== indexToRemove))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFeedback({ type: "", message: "" })

    try {
      const token = localStorage.getItem('token')
      
      // Prepare form data for submission
      const submitData = new FormData()
      submitData.append("subject", formData.subject)
      submitData.append("message", formData.message)
      
      // Append files if any
      files.forEach(file => {
        submitData.append("attachments", file)
      })

      const response = await axiosInstance.post("/contact", submitData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      })

      setFeedback({
        type: "success",
        message: "Your message has been sent successfully. We'll get back to you soon."
      })
      
      // Reset form
      setFormData({ subject: "", message: "" })
      setFiles([])
    } catch (error) {
      console.error("Failed to submit contact form", error)
      setFeedback({
        type: "error",
        message: error.response?.data?.message || "Failed to send message. Please try again later."
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex flex-col">
      {/* Content */}
      <div className="flex-grow container mx-auto px-4 py-8">
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Contact Us</h1>
          
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <p className="text-blue-700">
              Need help or have questions? Fill out the form below and our support team will get back to you as soon as possible.
            </p>
          </div>

          {feedback.message && (
            <div className={`p-4 rounded-lg mb-6 ${
              feedback.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}>
              {feedback.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Describe your issue in short
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  maxLength={50}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief summary of your issue"
                />
                <div className="absolute right-2 bottom-2 text-xs text-gray-500">
                  {formData.subject.length}/50
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                Description of issue
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Provide detailed information about your issue or question"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attachments (Optional - Max 3 files, 5MB each)
              </label>
              
              <div className="flex items-center space-x-2 mb-2">
                <label className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg cursor-pointer hover:bg-blue-200 transition duration-300 flex items-center">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    multiple
                  />
                </label>
                <span className="text-sm text-gray-500">
                  {files.length}/3 files added
                </span>
              </div>

              {/* File preview */}
              {files.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-2">
                  {files.map((file, index) => (
                    <div key={index} className="relative bg-gray-100 p-2 rounded-md">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center overflow-hidden">
                          <img 
                            src={URL.createObjectURL(file)} 
                            alt={`Preview ${index}`} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium truncate" style={{maxWidth: "150px"}}>
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition duration-300 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-2" />
                    Send Message
                  </>
                )}
              </button>
            </div>
          </form>
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

export default ContactUs