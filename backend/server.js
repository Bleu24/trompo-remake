const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db.config');
const { initializeSocket } = require('./utils/socket.utils');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS configuration
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Initialize Socket.IO handlers
initializeSocket(io);

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/owner', require('./routes/businessOwner.routes'));
app.use('/api/businesses', require('./routes/business.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/customer', require('./routes/customer.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/reviews', require('./routes/review.routes'));
app.use('/api/chat', require('./routes/chat.routes'));
app.use('/api/maps', require('./routes/maps.routes'));

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready at ws://localhost:${PORT}`);
  console.log(`💬 Chat functionality enabled`);
  console.log(`🌐 Connect to Socket.IO at: http://localhost:${PORT}`);
});

module.exports = app;