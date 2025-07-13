const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  type: { 
    type: String, 
    enum: [
      'order_placed',        // For business owners when customer places order
      'order_confirmed',     // For customers when order is confirmed
      'order_completed',     // For customers when order is completed
      'order_cancelled',     // For customers when order is cancelled
      'payment_received',    // For business owners when payment is received
      'review_received',     // For business owners when they get a review
      'business_verified',   // For business owners when business gets verified
      'verification_rejected', // For business owners when verification is rejected
      'message_received',    // For both when they receive a chat message
      'dispute_opened',      // For both when a dispute is opened
      'dispute_resolved',    // For both when a dispute is resolved
      'business_visited',    // For business owners when someone visits their business page
      'upcoming_order'       // For business owners about potential orders from customer activity
    ], 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  data: {
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business' },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
    reviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Review' },
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
    disputeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dispute' },
    amount: Number,
    customerName: String,
    businessName: String,
  },
  read: { 
    type: Boolean, 
    default: false 
  },
  readAt: { 
    type: Date 
  },
  actionUrl: { 
    type: String // URL to navigate to when notification is clicked
  }
}, { 
  timestamps: true 
});

// Index for efficient querying
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
