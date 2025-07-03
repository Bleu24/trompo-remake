const mongoose = require('mongoose');

const customerVerificationSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  documents: [String], // e.g., URLs to uploaded IDs, selfies, etc.
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminNotes: String,
  rejectionReason: String,
}, { timestamps: true });

module.exports = mongoose.model('CustomerVerification', customerVerificationSchema);
