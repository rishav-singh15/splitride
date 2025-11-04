const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// --- NEW CORS CONFIG ---
const allowedOrigins = [
  "http://localhost:5173",
  "https://splitride-six.vercel.app" // Your live Vercel frontend
];

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      // Allow requests from allowed origins and "no-origin" (like Postman)
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"] // Allow all necessary methods
};

const io = socketIo(server, {
  cors: corsOptions // Apply the same CORS options to Socket.IO
});
// --- END OF NEW CONFIG ---

// --- Middleware ---
app.use(cors(corsOptions)); // Apply CORS options to all Express routes
app.use(express.json()); // To parse JSON bodies

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected...'))
  .catch(err => console.error(err));

// --- Routes ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rides', require('./routes/rides'));
app.use('/api/notifications', require('./routes/notifications'));

// --- Socket.io Connection ---
io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);
  
  socket.on('join_ride', (rideId) => {
    socket.join(rideId);
    console.log(`Socket ${socket.id} joined ride room ${rideId}`);
  });

  socket.on('join_user_room', (userId) => {
    socket.join(userId);
    console.log(`SUCCESS: Socket ${socket.id} joined USER ROOM ${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make 'io' accessible to our routes
app.set('io', io);

// --- Start Server ---
// Render will set its own PORT environment variable
const PORT = process.env.PORT || 5001; 
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));