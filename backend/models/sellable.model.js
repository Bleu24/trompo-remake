const mongoose = require('mongoose');

const sellableSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  title: String,
  description: String,
  type: { type: String, enum: ['product', 'service'], required: true },
  price: { type: Number, required: true },
  inventory: Number, // only applicable if type is 'product'
}, { timestamps: true });

module.exports = mongoose.model('Sellable', sellableSchema);
