import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

// 1. Create the Context
const AuthContext = createContext();

// 2. Create the Provider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // 3. Effect to load user on app start
  useEffect(() => {
    const loadUser = async () => {
      // OPTIMIZATION: Check if we have user data in local storage first
      // This makes the UI load instantly without waiting for the server
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
          setUser(JSON.parse(storedUser));
      }

      if (token) {
        try {
          // Verify token validity with server
          const res = await api.get('/auth'); 
          setUser(res.data);
          // Sync fresh server data to local storage
          localStorage.setItem('user', JSON.stringify(res.data));
        } catch (err) {
          console.error('Session expired', err);
          logout(); // Auto-logout if token is invalid
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  // 4. Login Function
  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      
      // 🛑 CRITICAL UPDATE: Save both Token AND User to LocalStorage
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      setToken(res.data.token);
      setUser(res.data.user);
      return true;
    } catch (err) {
      if (err.response) {
        console.error('Login failed:', err.response.data.error);
        throw new Error(err.response.data.error); // Throw to UI
      } else {
        console.error('Login failed:', err.message);
        throw new Error("Network error. Check connection.");
      }
    }
  };

  // 5. Register Function
  const register = async (userData) => {
    try {
      const res = await api.post('/auth/register', userData);
      
      // 🛑 CRITICAL UPDATE: Save both Token AND User
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      setToken(res.data.token);
      setUser(res.data.user);
      return true;
    } catch (err) {
      if (err.response) {
        console.error('Registration failed:', err.response.data.error);
        throw new Error(err.response.data.error);
      } else {
        console.error('Registration failed:', err.message);
        throw new Error("Network error. Check connection.");
      }
    }
  };

  // 6. Logout Function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user'); // Clean up user data too
    setToken(null);
    setUser(null);
  };

  // 7. Value to be passed to consuming components
  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// 8. Custom hook
export const useAuth = () => {
  return useContext(AuthContext);
};