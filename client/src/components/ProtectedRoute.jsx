import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // Check LocalStorage for authentication data (MVP Standard)
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');

  // If no token/user found, kick them back to Login
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated, show the intended page
  return children;
};

export default ProtectedRoute;