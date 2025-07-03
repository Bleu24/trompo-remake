const mongoose = require('mongoose');

const savedBusinessSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
}, { timestamps: true });

// Ensure a customer can't save the same business twice
savedBusinessSchema.index({ customerId: 1, businessId: 1 }, { unique: true });

module.exports = mongoose.model('SavedBusiness', savedBusinessSchema);
