const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// --- SOCKET.IO CONFIGURATION ---
const io = socketIo(server, {
  cors: {
    // Allow connections from your Frontend (Local + Production)
    origin: [
      "http://localhost:5173", 
      "https://splitride-six.vercel.app", 
      "https://splitride.vercel.app" 
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// --- MIDDLEWARE ---
app.use(cors({
  origin: [
    "http://localhost:5173", 
    "https://splitride-six.vercel.app",
    "https://splitride.vercel.app"
  ],
  credentials: true
}));
app.use(express.json());

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- SOCKET.IO EVENTS ---
io.on('connection', (socket) => {
  console.log('⚡ New Client Connected:', socket.id);

  // Join a specific room (e.g., for a specific ride)
  socket.on('join_ride', (rideId) => {
    socket.join(rideId);
    console.log(`Socket ${socket.id} joined ride room: ${rideId}`);
  });

  // Join user's private room (for personal notifications)
  socket.on('join_user', (userId) => {
    socket.join(userId);
    console.log(`Socket ${socket.id} joined user room: ${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client Disconnected:', socket.id);
  });
});

// Make 'io' accessible in Controllers via req.app.get('io')
app.set('io', io);

// --- ROUTES ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rides', require('./routes/rides'));
app.use('/api/notifications', require('./routes/notifications')); // New Route

// --- SERVER START ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));