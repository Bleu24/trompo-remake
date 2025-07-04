const mongoose = require('mongoose');

const customerVerificationSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  documents: [String],
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminNotes: String,
}, { timestamps: true });

module.exports = mongoose.model('CustomerVerification', customerVerificationSchema);
