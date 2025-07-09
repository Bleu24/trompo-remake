const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db.config');
const { setupSocket } = require('./controllers/chat.controller');
const seed = require('./utils/seedDatabase.utils');

dotenv.config();

// Initialize database and seed if needed
async function initializeDatabase() {
  try {
    await connectDB();
    // Only seed if in development mode or if SEED_DB environment variable is set
    if (process.env.NODE_ENV === 'development' || process.env.SEED_DB === 'true') {
      await seed();
    }
  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  }
}

initializeDatabase();

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files for uploads
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/owner', require('./routes/businessOwner.routes'));
app.use('/api/businesses', require('./routes/business.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/search', require('./routes/search.routes'));
app.use('/api/customers', require('./routes/customer.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/transactions', require('./routes/transaction.routes'));
app.use('/api', require('./routes/review.routes'));

// Start server
const PORT = process.env.PORT;
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Make io available to chat routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use('/api/chat', require('./routes/chat.routes'));

setupSocket(io);

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));


module.exports = app;
