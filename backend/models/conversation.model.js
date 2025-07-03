const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  // For business-related conversations
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business'
  },
  // Conversation type: 'direct' (customer-owner), 'support' (customer-admin)
  type: {
    type: String,
    enum: ['direct', 'support'],
    default: 'direct'
  }
}, { timestamps: true });

// Ensure participants array has exactly 2 users
conversationSchema.index({ participants: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
