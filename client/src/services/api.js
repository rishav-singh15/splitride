import axios from 'axios';

// Create an axios instance
const api = axios.create({
  // ⚠️ IMPORTANT: If you are running the backend LOCALLY, change this to:
  // baseURL: 'http://localhost:5000/api',
  baseURL: 'https://splitride.onrender.com/api', 
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Wait 30s before failing (Render free tier wakes up slowly)
});

/*
  1. REQUEST INTERCEPTOR
  Attaches the token to every outgoing request.
*/
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/*
  2. RESPONSE INTERCEPTOR
  Handles Token Expiry (401) and Server Errors
*/
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check for Token Expiration
    if (error.response && error.response.status === 401) {
      console.warn("Session expired. Redirecting to login...");
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    // Log helpful errors for debugging
    if (!error.response) {
      console.error("Network Error: Server might be sleeping or down.");
    }
    
    return Promise.reject(error);
  }
);

export default api;