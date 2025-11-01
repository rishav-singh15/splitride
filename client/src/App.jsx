import React, { useEffect } from 'react'; // <--- MAKE SURE THIS LINE IS CORRECT
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import socket from './services/socket'; 

// Import all your components
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';

// This is a protected route component
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>; // Or a spinner
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  const { user } = useAuth();

  // This is the new block that was causing the error
  useEffect(() => {
    if (user) {
      // Join a private room based on the user's ID
      // This allows the server to send us private notifications
      socket.emit('join_user_room', user._id);
    }
  }, [user]); // This will run every time the user logs in

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="container p-4 mx-auto">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            } 
          />
          
          {/* Home Page */}
          <Route 
            path="/" 
            element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} 
          />
        </Routes>
      </main>
    </div>
  );
}