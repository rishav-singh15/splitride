import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

// 1. Create the Context
const AuthContext = createContext();

// 2. Create the Provider (a component that wraps your app)
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // 3. Effect to load user on app start
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const res = await api.get('/auth'); 
          setUser(res.data);
        } catch (err) {
          console.error('Failed to load user', err);
          localStorage.removeItem('token');
          setToken(null);
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
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      return true;
    } catch (err) {
      // --- UPDATE THIS BLOCK ---
      if (err.response) {
        // Server responded with an error
        console.error('Login failed:', err.response.data.error);
      } else {
        // Network error (e.g., connection refused)
        console.error('Login failed:', err.message);
      }
      return false;
      // --- END OF UPDATE ---
    }
  };

  // 5. Register Function
  const register = async (userData) => {
    try {
      const res = await api.post('/auth/register', userData);
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      return true;
    } catch (err) {
      // --- UPDATE THIS BLOCK ---
      if (err.response) {
        // Server responded with an error
        console.error('Registration failed:', err.response.data.error);
      } else {
        // Network error (e.g., connection refused)
        console.error('Registration failed:', err.message);
      }
      return false;
      // --- END OF UPDATE ---
    }
  };

  // 6. Logout Function
  const logout = () => {
    localStorage.removeItem('token');
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

// 8. Custom hook to easily use the context
export const useAuth = () => {
  return useContext(AuthContext);
};