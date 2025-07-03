const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'BusinessOwner' },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  isVerified: { type: Boolean, default: false },
  // Direct business location (can be different from general location)
  businessLocation: {
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    placeId: String,
    formattedAddress: String
  },
  // Business contact and details
  contactInfo: {
    phone: String,
    email: String,
    website: String,
    socialMedia: {
      facebook: String,
      instagram: String,
      twitter: String
    }
  },
  operatingHours: [{
    day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
    open: String,
    close: String,
    isClosed: { type: Boolean, default: false }
  }],
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Business', businessSchema);
