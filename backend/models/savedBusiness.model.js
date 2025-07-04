const mongoose = require('mongoose');

const savedBusinessSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
}, { timestamps: true });

module.exports = mongoose.model('SavedBusiness', savedBusinessSchema);
