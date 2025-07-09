const mongoose = require('mongoose');

const verificationRequestSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'BusinessOwner', required: true },
  personalIdUrl: { type: String, required: true }, // URL to uploaded personal ID
  businessPermitUrl: { type: String, required: true }, // URL to uploaded business permit
  notes: String, // Optional notes from business owner
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminNotes: String, // Notes from admin during review
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('VerificationRequest', verificationRequestSchema);
