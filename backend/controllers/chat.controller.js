const jwt = require('jsonwebtoken');
const Conversation = require('../models/conversation.model');
const Message = require('../models/message.model');
const User = require('../models/user.model');


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
    const userId = req.user.id; // From JWT token
    
    const conversations = await Conversation.find({
      participants: userId
    })
    .populate('participants', 'name email role')
    .populate({
      path: 'lastMessage',
      select: 'text createdAt senderId'
    })
    .sort({ updatedAt: -1 });
    
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get messages for a specific conversation (only if user is participant)
exports.getConversationMessages = async (req, res) => {
  try {
    const userId = req.user.id;
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
    const userId = req.user.id;
    const { conversationId, text } = req.body;
    
    // Verify user has access to this conversation
    const conversation = await verifyConversationAccess(userId, conversationId);
    
    const message = await Message.create({
      conversationId,
      senderId: userId,
      text,
      readBy: [{ userId, readAt: new Date() }] // Mark as read by sender
    });
    
    // Update conversation's last message
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
      updatedAt: new Date()
    });
    
    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'name email role');
    
    // Emit to all participants in the conversation
    req.io.to(conversationId).emit('newMessage', populatedMessage);
    
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
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.user.name} connected`);
    
    // Join user's conversations
    socket.on('joinConversations', async () => {
      try {
        const conversations = await Conversation.find({
          participants: socket.userId
        });
        
        conversations.forEach(conv => {
          socket.join(conv._id.toString());
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to join conversations' });
      }
    });

    // Handle typing indicators (only for participants)
    socket.on('typing', async (data) => {
      try {
        const { conversationId, isTyping } = data;
        
        // Verify access
        await verifyConversationAccess(socket.userId, conversationId);
        
        socket.to(conversationId).emit('userTyping', {
          userId: socket.userId,
          userName: socket.user.name,
          isTyping
        });
      } catch (error) {
        socket.emit('error', { message: 'Access denied' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.user.name} disconnected`);
    });
  });
};
