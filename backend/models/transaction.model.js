const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business' },
  sellableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sellable' },
  amount: Number,
  status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' },
  paymentMethod: String,
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
