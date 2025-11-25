import axios from 'axios';

// Create an axios instance
const api = axios.create({
  // HARDCODED FOR STABILITY:
  // We keep this pointing to Render so even if you run the frontend locally, 
  // it talks to your real database.
  baseURL: 'https://splitride.onrender.com/api', 
  headers: {
    'Content-Type': 'application/json',
  },
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
  2. RESPONSE INTERCEPTOR (NEW: Crash Prevention)
  If the backend says "Token Invalid" (401), we automatically:
  - Clear the bad token
  - Redirect to Login
  This prevents "Infinite Loading" or "Blank Screens" for old users.
*/
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Only redirect if we aren't already on the login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;