const mongoose = require('mongoose');

const savedItemSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  itemType: {
    type: String,
    enum: ['business', 'product', 'service'],
    required: true
  }
}, {
  timestamps: true
});

// Compound index to ensure a customer can't save the same item twice
savedItemSchema.index({ customerId: 1, itemId: 1, itemType: 1 }, { unique: true });

module.exports = mongoose.model('SavedItem', savedItemSchema);
