//src/pages/OrderHistory.js

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap,
  LogOut,
  User,
  ShoppingCart,
  ChevronLeft,
  Clock,
  Filter,
  Calendar,
  AlertCircle,
  Eye,
  Download
} from "lucide-react";
import axiosInstance from "../utils/axiosConfig";

const OrderHistory  = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  // changes made for clock and calendar icons
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/dashboard");
      return;
    }

    // Fetch user orders
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const response = await axiosInstance.get("/order/user", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(response.data.orders);
      } catch (error) {
        console.error("Failed to fetch orders", error);
        setErrorMessage(
          error.response?.data?.message || "Failed to fetch orders"
        );
        if (error.response?.status === 401) {
          handleLogout();
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/dashboard");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const options = { year: "numeric", month: "long", day: "numeric" };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (error) {
      return "Invalid Date";
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    try {
      const options = { hour: "2-digit", minute: "2-digit" };
      return new Date(dateString).toLocaleTimeString(undefined, options);
    } catch (error) {
      return "";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-purple-100 text-purple-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "pending":
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  // modifications for clock and calendar icons
  const filterOrders = (orders) => {
    let filtered = filter === "all" ? orders : orders.filter((order) => order.status === filter);
    if (dateFrom) {
      filtered = filtered.filter(order => new Date(order.createdAt) >= new Date(dateFrom));
    }
    if (dateTo) {
      filtered = filtered.filter(order => new Date(order.createdAt) <= new Date(dateTo + 'T23:59:59'));
    }
    return filtered;
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const OrderModal = ({ order, onClose }) => {
    if (!order) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden w-full max-w-3xl">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Order #{order.orderNumber || "N/A"}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Restaurant</p>
                <p className="font-medium">{order.restaurantName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Order Date</p>
                <p className="font-medium">
                  {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                    order.status
                  )}`}
                >
                  {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Status</p>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${getPaymentStatusColor(
                    order.paymentStatus
                  )}`}
                >
                  {order.paymentStatus?.charAt(0).toUpperCase() +
                    order.paymentStatus?.slice(1)}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Delivery Location</p>
                <p className="font-medium">
                  {order.deliveryLocation || "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Estimated Time</p>
                <p className="font-medium">
                  {order.estimatedTime || "Not available"}
                </p>
              </div>
            </div>

            <h4 className="font-bold text-lg mb-3">Order Items</h4>
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              {order.items && order.items.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {order.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center pb-2 border-b border-gray-200"
                      >
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-500">
                            Quantity: {item.quantity}
                          </p>
                        </div>
                        <p className="text-gray-900">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between">
                      <p className="text-gray-600">Subtotal</p>
                      <p>₹{order.subtotal?.toFixed(2) ?? "0.00"}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-gray-600">Convenience Fee</p>
                      <p>₹{order.convenienceFee?.toFixed(2) ?? "0.00"}</p>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-300">
                      <p>Total</p>
                      <p>₹{order.totalAmount?.toFixed(2) ?? "0.00"}</p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-center text-gray-500">No items found</p>
              )}
            </div>

            {order.specialInstructions && (
              <div className="mb-6">
                <h4 className="font-bold text-lg mb-2">Special Instructions</h4>
                <p className="bg-yellow-50 p-3 rounded-lg text-gray-700">
                  {order.specialInstructions}
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition duration-300"
              >
                Close
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300 flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Download Receipt
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const filteredOrders = filterOrders(orders);

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
                <span className="ml-2 text-xl font-bold text-gray-900">
                  CampusEats
                </span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-4">
                <Link
                  to="/profile"
                  className="text-gray-700 hover:text-blue-600 flex items-center"
                >
                  <User className="h-5 w-5 mr-1" />
                  Profile
                </Link>
                <Link
                  to="/orders"
                  className="text-blue-600 font-medium flex items-center"
                >
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
          <Link
            to="/dashboard"
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-white shadow-lg rounded-xl p-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4 md:mb-0">
              Your Orders
            </h1>
            
            {/* modifications for clock and calendar icons */}
            <div className="flex flex-wrap items-center gap-3">
              <Filter className="h-5 w-5 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <button
                onClick={() => setShowDateFilter(!showDateFilter)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition ${showDateFilter ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
              >
                <Calendar className="h-4 w-4" />
                Filter by Date
              </button>

              {showDateFilter && (
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-500 text-sm">to</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {(dateFrom || dateTo) && (
                    <button
                      onClick={() => { setDateFrom(''); setDateTo(''); }}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
            

          {errorMessage && (
            <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {errorMessage}
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your orders...</p>
            </div>
          ) : filteredOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Order #
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Restaurant
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Total
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 transition duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          #{order.orderNumber || index + 1}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {order.restaurantName || "Unknown Restaurant"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-3.5 w-3.5 mr-1 text-blue-400" />
                          {formatDate(order.createdAt)}
                        </div>
                        <div className="flex items-center text-xs text-gray-400 mt-1">
                          <Clock className="h-3 w-3 mr-1 text-gray-400" />
                          {formatTime(order.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">
                          ₹{order.totalAmount?.toFixed(2) ?? "0.00"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status?.charAt(0).toUpperCase() +
                            order.status?.slice(1) || "Unknown"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-lg">
              <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No orders found
              </h3>
              <p className="text-gray-500 mb-6">
                {filter === "all"
                  ? "You haven't placed any orders yet."
                  : `You don't have any ${filter} orders.`}
              </p>
              {filter !== "all" ? (
                <button
                  onClick={() => setFilter("all")}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition duration-300"
                >
                  View All Orders
                </button>
              ) : (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300"
                >
                  Browse Restaurants
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

      {/* Order Detail Modal */}
      {showModal && <OrderModal order={selectedOrder} onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default OrderHistory;