import axios from 'axios';

// Create an axios instance
const api = axios.create({
  baseURL: 'http://localhost:5001/api', // Your backend API base URL
  headers: {
    'Content-Type': 'application/json',
  },
});

/*
  This is a request interceptor. It's a "middleware" for your frontend.
  Before any request is sent, this function runs.
  It gets the token from localStorage and adds it to the 'x-auth-token' header.
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

export default api;