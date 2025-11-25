import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import BookRideForm from './components/BookRideForm';
import ActiveRideDisplay from './components/ActiveRideDisplay';
import DriverActiveRide from './components/DriverActiveRide';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute'; // Assuming you have this

function App() {
  return (
    <AuthProvider>
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

            {/* 🛑 CRITICAL FIX: The :id parameter is required here */}
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
    </AuthProvider>
  );
}

export default App;