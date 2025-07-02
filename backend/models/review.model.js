const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business' },
  rating: { type: Number, min: 1, max: 5 },
  comment: String,
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
