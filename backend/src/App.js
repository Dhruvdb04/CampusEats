import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Signup from './pages/Signup';
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile'
import RestaurantForm from './pages/RestaurantForm';
import RestaurantMenu from './pages/RestaurantMenu'
import OrderSummary from './pages/OrderSummary';
import PaymentPage from './pages/Paymentpage';
import OrderSuccessPage from './pages/OrderSuccess';
import PendingOrders from './pages/PendingOrders'
import OrderHistory from './pages/OrderHistory';
import ContactUs from "./pages/ContactUs";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path = "/profile" element = {<Profile />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/orders" element={<OrderHistory />} />
          <Route path="/add-restaurant" element={<RestaurantForm />} />
          <Route path="/restaurant/:restaurantId" element={<RestaurantMenu />} />
          <Route path="/restaurant/:restaurantId/orders" element={<PendingOrders />} />
          <Route path="/restaurant/:restaurantId/checkout" element={<OrderSummary />} />
          {/* <Route path="/restaurant/:restaurantId/owner-view" element={<RestaurantDashboard />} /> */}
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/order-success" element={<OrderSuccessPage />} />
        
        </Routes>
      </div>
    </Router>
  );
}

export default App;