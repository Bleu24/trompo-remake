const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  region: String,
}, { timestamps: true });

module.exports = mongoose.model('Location', locationSchema);
