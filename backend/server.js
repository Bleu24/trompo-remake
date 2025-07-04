const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db.config');

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

// Start server
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
