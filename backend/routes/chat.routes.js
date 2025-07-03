const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const auth = require('../middleware/auth.middleware');

// All chat routes require authentication
router.use(auth);

// Conversation routes
router.post('/conversations', chatController.getOrCreateConversation);
router.get('/conversations', chatController.getMyConversations);

// Message routes
router.get('/conversations/:conversationId/messages', chatController.getMessages);
router.post('/messages', chatController.sendMessage);
router.put('/conversations/:conversationId/read', chatController.markAsRead);
router.delete('/messages/:messageId', chatController.deleteMessage);

// Utility routes
router.get('/unread-count', chatController.getUnreadCount);

module.exports = router;
