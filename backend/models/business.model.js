const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'BusinessOwner' },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  coverPhoto: String, // URL to cover photo
  profilePhoto: String, // URL to profile photo
  isVerified: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Business', businessSchema);
