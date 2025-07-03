const jwt = require('jsonwebtoken');
const Message = require('../models/message.model');
const Conversation = require('../models/conversation.model');
const User = require('../models/user.model');

// Store active users and their socket connections
const activeUsers = new Map();

// Socket.IO authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token'));
  }
};

// Initialize Socket.IO
const initializeSocket = (io) => {
  // Apply authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`User ${socket.user.name} connected with socket ID: ${socket.id}`);

    // Store active user
    activeUsers.set(socket.userId, {
      socketId: socket.id,
      user: socket.user,
      lastSeen: new Date()
    });

    // Join user to their personal room for notifications
    socket.join(`user_${socket.userId}`);

    // Emit online status to contacts
    socket.broadcast.emit('user_online', {
      userId: socket.userId,
      name: socket.user.name
    });

    // Handle joining conversation rooms
    socket.on('join_conversation', async (conversationId) => {
      try {
        // Verify user is part of the conversation
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: socket.userId
        });

        if (conversation) {
          socket.join(`conversation_${conversationId}`);
          console.log(`User ${socket.user.name} joined conversation ${conversationId}`);
        } else {
          socket.emit('error', { message: 'Unauthorized to join this conversation' });
        }
      } catch (error) {
        socket.emit('error', { message: 'Error joining conversation' });
      }
    });

    // Handle leaving conversation rooms
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
      console.log(`User ${socket.user.name} left conversation ${conversationId}`);
    });

    // Handle sending messages
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, content, messageType = 'text', productId, imageUrl } = data;

        // Verify user is part of the conversation
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: socket.userId
        });

        if (!conversation) {
          socket.emit('error', { message: 'Unauthorized to send message to this conversation' });
          return;
        }

        // Create message
        const messageData = {
          conversationId,
          senderId: socket.userId,
          content,
          messageType,
          readBy: [{ userId: socket.userId, readAt: new Date() }]
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

        // Populate message for broadcasting
        const populatedMessage = await Message.findById(message._id)
          .populate('senderId', 'name email role')
          .populate('productId', 'title description price type businessId');

        // Broadcast to all users in the conversation
        io.to(`conversation_${conversationId}`).emit('new_message', populatedMessage);

        // Send push notification to offline users
        const otherParticipants = conversation.participants.filter(
          p => p.toString() !== socket.userId
        );

        otherParticipants.forEach(participantId => {
          if (!activeUsers.has(participantId.toString())) {
            // User is offline, could send push notification here
            console.log(`Send push notification to user ${participantId}`);
          } else {
            // Send real-time notification
            io.to(`user_${participantId}`).emit('message_notification', {
              conversationId,
              senderId: socket.userId,
              senderName: socket.user.name,
              content: messageType === 'product' ? 'Sent a product' : content,
              timestamp: new Date()
            });
          }
        });

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Error sending message' });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      const { conversationId } = data;
      socket.to(`conversation_${conversationId}`).emit('user_typing', {
        userId: socket.userId,
        userName: socket.user.name,
        conversationId
      });
    });

    socket.on('typing_stop', (data) => {
      const { conversationId } = data;
      socket.to(`conversation_${conversationId}`).emit('user_stopped_typing', {
        userId: socket.userId,
        conversationId
      });
    });

    // Handle message read receipts
    socket.on('mark_messages_read', async (data) => {
      try {
        const { conversationId } = data;

        // Verify user is part of the conversation
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: socket.userId
        });

        if (!conversation) {
          socket.emit('error', { message: 'Unauthorized access to conversation' });
          return;
        }

        // Mark messages as read
        await Message.updateMany(
          {
            conversationId,
            senderId: { $ne: socket.userId },
            'readBy.userId': { $ne: socket.userId }
          },
          {
            $push: {
              readBy: {
                userId: socket.userId,
                readAt: new Date()
              }
            }
          }
        );

        // Notify other participants that messages were read
        socket.to(`conversation_${conversationId}`).emit('messages_read', {
          conversationId,
          readBy: socket.userId,
          readAt: new Date()
        });

      } catch (error) {
        console.error('Error marking messages as read:', error);
        socket.emit('error', { message: 'Error marking messages as read' });
      }
    });

    // Handle requesting online users
    socket.on('get_online_users', () => {
      const onlineUsers = Array.from(activeUsers.values()).map(user => ({
        userId: user.user._id,
        name: user.user.name,
        role: user.user.role,
        lastSeen: user.lastSeen
      }));
      socket.emit('online_users', onlineUsers);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${socket.user.name} disconnected`);
      
      // Update last seen and remove from active users
      activeUsers.delete(socket.userId);

      // Emit offline status to contacts
      socket.broadcast.emit('user_offline', {
        userId: socket.userId,
        name: socket.user.name,
        lastSeen: new Date()
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  // Periodic cleanup of inactive users
  setInterval(() => {
    const now = new Date();
    for (const [userId, userData] of activeUsers.entries()) {
      if (now - userData.lastSeen > 30 * 60 * 1000) { // 30 minutes
        activeUsers.delete(userId);
      }
    }
  }, 5 * 60 * 1000); // Check every 5 minutes
};

// Utility function to get active users
const getActiveUsers = () => {
  return Array.from(activeUsers.values());
};

// Utility function to check if user is online
const isUserOnline = (userId) => {
  return activeUsers.has(userId.toString());
};

module.exports = {
  initializeSocket,
  getActiveUsers,
  isUserOnline
};
