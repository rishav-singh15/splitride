import io from 'socket.io-client';

// Connect to your backend server
// Make sure this port matches your backend's port (5001)
const socket = io('https://splitride.onrender.com');

socket.on('connect', () => {
  console.log('Socket.io connected:', socket.id);
});

socket.on('disconnect', () => {
  console.log('Socket.io disconnected');
});

export default socket;