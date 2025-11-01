import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell'; // <-- 1. IMPORT IT

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="flex items-center justify-between p-4 bg-white shadow-md">
      <Link to="/" className="text-xl font-bold">SplitRide</Link>
      <div className="flex items-center space-x-4">
        {user ? (
          <>
            <span className="font-medium">Hi, {user.name} ({user.role})</span>
            <Link to="/dashboard" className="hover:text-blue-600">Dashboard</Link>
            
            <NotificationBell /> {/* <-- 2. ADD IT HERE */}
            
            <button
              onClick={logout}
              className="px-3 py-1 text-white bg-red-500 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:text-blue-600">Login</Link>
            <Link to="/register" className="px-3 py-1 text-white bg-blue-500 rounded hover:bg-blue-600">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}