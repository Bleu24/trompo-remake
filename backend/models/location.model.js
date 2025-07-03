const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  region: String,
  address: String,
  coordinates: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  // Google Places data
  placeId: String,
  formattedAddress: String,
  city: String,
  state: String,
  country: String,
  postalCode: String
}, { timestamps: true });

module.exports = mongoose.model('Location', locationSchema);
