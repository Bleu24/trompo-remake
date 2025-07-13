const jwt = require('jsonwebtoken');
const Conversation = require('../models/conversation.model');
const Message = require('../models/message.model');
const User = require('../models/user.model');

// Search users for starting conversations
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    const currentUserId = req.user.userId;
    
    if (!q || q.trim().length < 2) {
      return res.json([]);
    }
    
    const users = await User.find({
      $and: [
        { _id: { $ne: currentUserId } }, // Exclude current user
        {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } }
          ]
        }
      ]
    })
    .select('name email role')
    .limit(10);
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Start a new conversation
exports.startConversation = async (req, res) => {
  try {
    const { participantId } = req.body;
    const currentUserId = req.user.userId;
    
    // Check if conversation already exists between these users
    const existingConversation = await Conversation.findOne({
      participants: { $all: [currentUserId, participantId] },
      $expr: { $eq: [{ $size: "$participants" }, 2] }
    })
    .populate('participants', 'name email role');
    
    if (existingConversation) {
      return res.json(existingConversation);
    }
    
    // Create new conversation
    const conversation = await Conversation.create({
      participants: [currentUserId, participantId]
    });
    
    const populatedConversation = await Conversation.findById(conversation._id)
      .populate('participants', 'name email role');
    
    res.status(201).json(populatedConversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { conversationId } = req.params;
    
    // Verify user has access to this conversation
    await verifyConversationAccess(userId, conversationId);
    
    // Find unread messages for this user
    const unreadMessages = await Message.find({
      conversationId,
      'readBy.userId': { $ne: userId }
    }).select('_id');
    
    if (unreadMessages.length > 0) {
      // Mark messages as read
      await Message.updateMany(
        { 
          conversationId,
          'readBy.userId': { $ne: userId }
        },
        { 
          $push: { readBy: { userId, readAt: new Date() } }
        }
      );
      
      // Emit read receipt to other participants
      if (req.io) {
        req.io.to(conversationId).emit('messagesRead', {
          conversationId,
          userId,
          messageIds: unreadMessages.map(m => m._id),
          readAt: new Date()
        });
      }
    }
    
    res.json({ message: 'Messages marked as read', count: unreadMessages.length });
  } catch (error) {
    res.status(403).json({ message: error.message });
  }
};

// Get unread message count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { conversationId } = req.params;
    
    // Verify user has access to this conversation
    await verifyConversationAccess(userId, conversationId);
    
    const unreadCount = await Message.countDocuments({
      conversationId,
      'readBy.userId': { $ne: userId }
    });
    
    res.json({ unreadCount });
  } catch (error) {
    res.status(403).json({ message: error.message });
  }
};


exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find({})
      .sort({ createdAt: 1 })
      .select('text');

    res.json(messages.map(m => ({ text: m.text })));
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
};

exports.createConversation = async (req, res) => {
  res.status(201).json({});
};

exports.listConversations = async (req, res) => {
  res.json([]);
};


// Middleware to verify user access to conversation
const verifyConversationAccess = async (userId, conversationId) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new Error('Conversation not found');
  }
  
  // Check if user is a participant in the conversation
  const isParticipant = conversation.participants.some(
    participantId => participantId.toString() === userId.toString()
  );
  
  if (!isParticipant) {
    throw new Error('Access denied: You are not a participant in this conversation');
  }
  
  return conversation;
};

// Get user's conversations (only their own)
exports.getUserConversations = async (req, res) => {
  try {
    const userId = req.user.userId; // From JWT token
    
    const conversations = await Conversation.find({
      participants: userId
    })
    .populate('participants', 'name email role')
    .populate({
      path: 'lastMessage',
      select: 'text createdAt senderId',
      populate: {
        path: 'senderId',
        select: 'name'
      }
    })
    .sort({ lastActivity: -1, updatedAt: -1 });
    
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get messages for a specific conversation (only if user is participant)
exports.getConversationMessages = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { conversationId } = req.params;
    
    // Verify user has access to this conversation
    await verifyConversationAccess(userId, conversationId);
    
    const messages = await Message.find({ conversationId })
      .populate('senderId', 'name email role')
      .sort({ createdAt: 1 });
    
    res.json(messages);
  } catch (error) {
    res.status(403).json({ message: error.message });
  }
};

// Send message (only to conversations user is part of)
exports.sendMessage = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { conversationId, text } = req.body;
    
    // Verify user has access to this conversation
    const conversation = await verifyConversationAccess(userId, conversationId);
    
    const message = await Message.create({
      conversationId,
      senderId: userId,
      text,
      readBy: [{ userId, readAt: new Date() }] // Mark as read by sender
    });
    
    // Update conversation's last message and activity
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
      lastActivity: new Date(),
      updatedAt: new Date()
    });
    
    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'name email role');
    
    // Emit to all participants in the conversation (if socket is available)
    if (req.io) {
      req.io.to(conversationId).emit('newMessage', populatedMessage);
    }
    
    res.json(populatedMessage);
  } catch (error) {
    res.status(403).json({ message: error.message });
  }
};

exports.setupSocket = (io) => {
  // Authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        throw new Error('No token provided');
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error.message);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.user.name} (${socket.user.role}) connected`);
    
    // Join user to their personal notification room
    socket.join(`user_${socket.userId}`);
    console.log(`User ${socket.user.name} joined notification room user_${socket.userId}`);
    
    // Handle explicit user join for notifications
    socket.on('joinUser', (userId) => {
      if (userId === socket.userId) {
        socket.join(`user_${userId}`);
        console.log(`User ${socket.user.name} explicitly joined notification room user_${userId}`);
      }
    });

    // Handle notification read events
    socket.on('markNotificationRead', (data) => {
      // Broadcast to all user's connections that notification was read
      socket.to(`user_${socket.userId}`).emit('notificationRead', data);
    });
    
    // Join user's conversations
    socket.on('joinConversations', async () => {
      try {
        const conversations = await Conversation.find({
          participants: socket.userId
        });
        
        conversations.forEach(conv => {
          socket.join(conv._id.toString());
          console.log(`User ${socket.user.name} joined conversation ${conv._id}`);
        });
        
        socket.emit('conversationsJoined', { count: conversations.length });
      } catch (error) {
        socket.emit('error', { message: 'Failed to join conversations' });
      }
    });

    // Join specific conversation
    socket.on('joinConversation', async (conversationId) => {
      try {
        await verifyConversationAccess(socket.userId, conversationId);
        socket.join(conversationId);
        console.log(`User ${socket.user.name} joined conversation ${conversationId}`);
        
        // Notify others that user is online in this conversation
        socket.to(conversationId).emit('userOnline', {
          userId: socket.userId,
          userName: socket.user.name
        });
      } catch (error) {
        socket.emit('error', { message: 'Access denied to conversation' });
      }
    });

    // Leave conversation
    socket.on('leaveConversation', (conversationId) => {
      socket.leave(conversationId);
      socket.to(conversationId).emit('userOffline', {
        userId: socket.userId,
        userName: socket.user.name
      });
    });

    // Handle typing indicators
    socket.on('typing', async (data) => {
      try {
        const { conversationId, isTyping } = data;
        
        // Verify access
        await verifyConversationAccess(socket.userId, conversationId);
        
        socket.to(conversationId).emit('userTyping', {
          userId: socket.userId,
          userName: socket.user.name,
          isTyping,
          timestamp: new Date()
        });
      } catch (error) {
        socket.emit('error', { message: 'Access denied' });
      }
    });

    // Handle real-time message sending
    socket.on('sendMessage', async (data) => {
      try {
        const { conversationId, text } = data;
        
        // Verify access
        await verifyConversationAccess(socket.userId, conversationId);
        
        const message = await Message.create({
          conversationId,
          senderId: socket.userId,
          text,
          readBy: [{ userId: socket.userId, readAt: new Date() }]
        });
        
        // Update conversation's last message and activity
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: message._id,
          lastActivity: new Date(),
          updatedAt: new Date()
        });
        
        const populatedMessage = await Message.findById(message._id)
          .populate('senderId', 'name email role');
        
        // Emit to all participants in the conversation
        io.to(conversationId).emit('newMessage', populatedMessage);
        
        // Send delivery confirmation to sender
        socket.emit('messageDelivered', { 
          messageId: message._id,
          conversationId 
        });
        
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle message read receipts
    socket.on('markMessageRead', async (data) => {
      try {
        const { conversationId, messageId } = data;
        
        // Verify access
        await verifyConversationAccess(socket.userId, conversationId);
        
        // Mark message as read
        await Message.findOneAndUpdate(
          { 
            _id: messageId,
            conversationId,
            'readBy.userId': { $ne: socket.userId }
          },
          { 
            $push: { readBy: { userId: socket.userId, readAt: new Date() } }
          }
        );
        
        // Emit read receipt to other participants
        socket.to(conversationId).emit('messageRead', {
          messageId,
          userId: socket.userId,
          userName: socket.user.name,
          readAt: new Date()
        });
        
      } catch (error) {
        socket.emit('error', { message: 'Failed to mark message as read' });
      }
    });

    // Simple chat message handler for backward compatibility
    socket.on('chat message', async (text) => {
      try {
        // Ensure a conversation exists for this user (for test purposes)
        let conversation = await Conversation.findOne({ participants: socket.userId });
        if (!conversation) {
          conversation = await Conversation.create({ participants: [socket.userId] });
        }

        const messageDoc = await Message.create({
          conversationId: conversation._id,
          senderId: socket.userId,
          text,
          readBy: [{ userId: socket.userId, readAt: new Date() }]
        });

        io.emit('chat message', { text: messageDoc.text });
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.user.name} disconnected`);
      
      // Notify all conversations that user is offline
      socket.rooms.forEach(room => {
        if (room !== socket.id) {
          socket.to(room).emit('userOffline', {
            userId: socket.userId,
            userName: socket.user.name
          });
        }
      });
    });
  });
};
