const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { 
    origin: "http://localhost:5173", // This will be your React frontend address
    methods: ["GET", "POST"]
  }
});

// --- Middleware ---
app.use(cors());
app.use(express.json()); // To parse JSON bodies

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected...'))
  .catch(err => console.error(err));

// --- Routes (We will create these next) ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rides', require('./routes/rides'));
// app.use('/api/users', require('./routes/users'));

// --- Socket.io Connection ---
io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);
  
  socket.on('join_ride', (rideId) => {
    socket.join(rideId);
    console.log(`Socket ${socket.id} joined room ${rideId}`);
  });
  socket.on('join_user_room', (userId) => {
    socket.join(userId); // Socket joins a room named after its own User ID
    console.log(`Socket ${socket.id} joined user room ${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make 'io' accessible to our routes (for emitting events from controllers)
app.set('io', io);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/rides', require('./routes/rides'));
app.use('/api/notifications', require('./routes/notifications'));

// --- Start Server ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));