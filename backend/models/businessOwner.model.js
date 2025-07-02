const mongoose = require('mongoose');

const businessOwnerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  verified: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('BusinessOwner', businessOwnerSchema);
