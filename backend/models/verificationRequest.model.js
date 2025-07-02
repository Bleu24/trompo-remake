const mongoose = require('mongoose');

const verificationRequestSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'BusinessOwner', required: true },
  documents: [String], // e.g., URLs to uploaded IDs
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminNotes: String,
}, { timestamps: true });

module.exports = mongoose.model('VerificationRequest', verificationRequestSchema);
