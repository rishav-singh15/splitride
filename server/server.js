const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
// --- Define your allowed origins ---
const allowedOrigins = [
  "http://localhost:5173",
  "https://splitride-six.vercel.app" // <-- YOUR LIVE VERCEL URL
];

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"] // Allow all methods
};

const io = socketIo(server, {
  cors: corsOptions // Use the same options for Socket.io
});

// --- Middleware ---
app.use(cors(corsOptions)); // Use the options for Express
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
    socket.join(userId); 
    // --- ADD THIS LOGGING LINE ---
    console.log(`SUCCESS: Socket ${socket.id} joined USER ROOM ${userId}`);
    // --- END OF ADDITION ---
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