const mongoose = require('mongoose');

const sellableSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  title: { type: String, required: true },
  description: String,
  type: { type: String, enum: ['product', 'service'], required: true },
  price: { type: Number, required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  inventory: Number, // only applicable if type is 'product'
  images: [String], // array of image filenames
}, { timestamps: true });

module.exports = mongoose.model('Sellable', sellableSchema);
