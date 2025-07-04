const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db.config');
const { setupSocket } = require('./controllers/chat.controller');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/owner', require('./routes/businessOwner.routes'));
app.use('/api/businesses', require('./routes/business.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/customers', require('./routes/customer.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api', require('./routes/review.routes'));
app.use('/api/chat', require('./routes/chat.routes'));

// Start server
const PORT = process.env.PORT;
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
setupSocket(io);

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
