import axios from 'axios';

// Create an axios instance with default configurations
const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL, // Your backend base URL
  withCredentials: true, // Allows sending cookies cross-origin
  headers: {
    'Content-Type': 'application/json',
    // You can add other default headers here
  }
});

export default axiosInstance;
