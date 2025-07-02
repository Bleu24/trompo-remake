const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
  transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', required: true },
  reason: String,
  status: { type: String, enum: ['pending', 'resolved'], default: 'pending' },
  adminNotes: String,
}, { timestamps: true });

module.exports = mongoose.model('Dispute', disputeSchema);
