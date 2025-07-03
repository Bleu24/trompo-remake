const Conversation = require('../models/conversation.model');
const Message = require('../models/message.model');
const User = require('../models/user.model');
const Business = require('../models/business.model');
const Sellable = require('../models/sellable.model');

// Get or create conversation between two users
exports.getOrCreateConversation = async (req, res) => {
  try {
    const { participantId, businessId } = req.body;
    const currentUserId = req.user.userId;

    // Validate participant exists
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, participantId] },
      businessId: businessId || { $exists: false }
    }).populate('participants', 'name email role')
      .populate('lastMessage')
      .populate('businessId', 'name description');

    if (!conversation) {
      // Create new conversation
      const conversationData = {
        participants: [currentUserId, participantId],
        type: participant.role === 'admin' ? 'support' : 'direct'
      };

      if (businessId) {
        // Validate business exists
        const business = await Business.findById(businessId);
        if (!business) {
          return res.status(404).json({ message: 'Business not found' });
        }
        conversationData.businessId = businessId;
      }

      conversation = new Conversation(conversationData);
      await conversation.save();

      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'name email role')
        .populate('businessId', 'name description');
    }

    res.json(conversation);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all conversations for current user
exports.getMyConversations = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    const conversations = await Conversation.find({
      participants: currentUserId
    })
      .populate('participants', 'name email role')
      .populate('lastMessage')
      .populate('businessId', 'name description')
      .sort({ lastActivity: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Add unread count for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conversation) => {
        const unreadCount = await Message.countDocuments({
          conversationId: conversation._id,
          senderId: { $ne: currentUserId },
          'readBy.userId': { $ne: currentUserId }
        });

        return {
          ...conversation.toObject(),
          unreadCount
        };
      })
    );

    const total = await Conversation.countDocuments({
      participants: currentUserId
    });

    res.json({
      conversations: conversationsWithUnread,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get messages for a conversation
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const currentUserId = req.user.userId;

    // Verify user is part of the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: currentUserId
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found or access denied' });
    }

    const skip = (page - 1) * limit;

    const messages = await Message.find({ conversationId })
      .populate('senderId', 'name email role')
      .populate('productId', 'title description price type')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Message.countDocuments({ conversationId });

    // Mark messages as read by current user
    await Message.updateMany(
      {
        conversationId,
        senderId: { $ne: currentUserId },
        'readBy.userId': { $ne: currentUserId }
      },
      {
        $push: {
          readBy: {
            userId: currentUserId,
            readAt: new Date()
          }
        }
      }
    );

    res.json({
      messages: messages.reverse(), // Return in chronological order
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, content, messageType = 'text', productId, imageUrl } = req.body;
    const senderId = req.user.userId;

    // Verify user is part of the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: senderId
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found or access denied' });
    }

    // Validate message content
    if (!content && messageType === 'text') {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Validate product if message type is product
    let product = null;
    if (messageType === 'product') {
      if (!productId) {
        return res.status(400).json({ message: 'Product ID is required for product messages' });
      }
      product = await Sellable.findById(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
    }

    // Create message
    const messageData = {
      conversationId,
      senderId,
      content,
      messageType,
      readBy: [{ userId: senderId, readAt: new Date() }] // Mark as read by sender
    };

    if (productId) messageData.productId = productId;
    if (imageUrl) messageData.imageUrl = imageUrl;

    const message = new Message(messageData);
    await message.save();

    // Update conversation's last message and activity
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
      lastActivity: new Date()
    });

    // Populate message for response
    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'name email role')
      .populate('productId', 'title description price type businessId');

    res.status(201).json({ message: 'Message sent successfully', data: populatedMessage });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.user.userId;

    // Verify user is part of the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: currentUserId
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found or access denied' });
    }

    // Mark all unread messages as read
    const result = await Message.updateMany(
      {
        conversationId,
        senderId: { $ne: currentUserId },
        'readBy.userId': { $ne: currentUserId }
      },
      {
        $push: {
          readBy: {
            userId: currentUserId,
            readAt: new Date()
          }
        }
      }
    );

    res.json({ 
      message: 'Messages marked as read', 
      modifiedCount: result.modifiedCount 
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get unread message count
exports.getUnreadCount = async (req, res) => {
  try {
    const currentUserId = req.user.userId;

    const unreadCount = await Message.countDocuments({
      senderId: { $ne: currentUserId },
      'readBy.userId': { $ne: currentUserId },
      conversationId: { 
        $in: await Conversation.find(
          { participants: currentUserId }
        ).distinct('_id')
      }
    });

    res.json({ unreadCount });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete a message (soft delete)
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user.userId;

    const message = await Message.findOne({
      _id: messageId,
      senderId: currentUserId
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found or access denied' });
    }

    // Soft delete by updating content
    message.content = 'This message was deleted';
    message.messageType = 'text';
    message.productId = undefined;
    message.imageUrl = undefined;
    await message.save();

    res.json({ message: 'Message deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
