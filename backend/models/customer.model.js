const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  address: String,
  phone: String,
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
