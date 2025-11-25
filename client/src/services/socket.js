import io from 'socket.io-client';

// Connect to your backend server
// ⚠️ IMPORTANT: If you are running locally, change to 'http://localhost:5000'
const SOCKET_URL = 'https://splitride.onrender.com';

const socket = io(SOCKET_URL, {
  transports: ['websocket'], // Forces modern WebSocket connection (faster)
  reconnection: true,        // Keep trying to connect if internet drops
  reconnectionAttempts: 10,  // Try 10 times before giving up
  reconnectionDelay: 3000,   // Wait 3s between attempts
});

socket.on('connect', () => {
  console.log('🟢 Socket connected:', socket.id);
});

socket.on('connect_error', (err) => {
  console.error('🔴 Socket connection error:', err.message);
});

socket.on('disconnect', () => {
  console.log('Rx Socket disconnected');
});

export default socket;