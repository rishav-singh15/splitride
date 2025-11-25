import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import BookRideForm from './components/BookRideForm';
import ActiveRideDisplay from './components/ActiveRideDisplay';
import DriverActiveRide from './components/DriverActiveRide';
import ProtectedRoute from './components/ProtectedRoute'; 

function App() {
  return (
    // 🛑 REMOVED <AuthProvider> here because it is already in main.jsx
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* PROTECTED ROUTES */}
          <Route path="/" element={
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
          } />
          
          <Route path="/book" element={
            <ProtectedRoute><BookRideForm /></ProtectedRoute>
          } />

          <Route path="/ride/:id" element={
            <ProtectedRoute><ActiveRideDisplay /></ProtectedRoute>
          } />

          {/* Driver Route */}
          <Route path="/driver/ride" element={
            <ProtectedRoute><DriverActiveRide /></ProtectedRoute>
          } />
        </Routes>
      </div>
    </div>
  );
}

export default App;