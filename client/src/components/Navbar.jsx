import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell'; 
import { Map, LogOut, User } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md group-hover:bg-indigo-700 transition-colors">
              <Map size={20} />
            </div>
            <span className="text-xl font-bold text-slate-800 tracking-tight">
              Split<span className="text-indigo-600">Ride</span>
            </span>
          </Link>

          {/* Navigation Items */}
          <div className="flex items-center space-x-2 md:space-x-6">
            {user ? (
              <>
                <div className="hidden md:flex flex-col items-end mr-2">
                    <span className="text-sm font-bold text-slate-700">{user.name}</span>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
                        {user.role}
                    </span>
                </div>

                <Link 
                  to="/" 
                  className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors hidden md:block"
                >
                  Dashboard
                </Link>
                
                {/* Notification Bell (Crucial for Phase 2) */}
                <NotificationBell />
                
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut size={16} />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-indigo-600 px-3 py-2">
                    Login
                </Link>
                <Link 
                    to="/register" 
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-all shadow-sm"
                >
                    <User size={16} />
                    Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}