const express = require('express');
const router = express.Router();
const {
  getMessages,
  createConversation,
  listConversations,
  getUserConversations,
  getConversationMessages,
  sendMessage,
  startConversation,
  searchUsers,
  markAsRead,
  getUnreadCount
} = require('../controllers/chat.controller');
const auth = require('../middleware/auth.middleware');

// Protected routes
router.get('/conversations', auth, getUserConversations);
router.get('/conversations/:conversationId/messages', auth, getConversationMessages);
router.get('/conversations/:conversationId/unread', auth, getUnreadCount);
router.post('/conversations', auth, startConversation);
router.post('/messages', auth, sendMessage);
router.post('/conversations/:conversationId/read', auth, markAsRead);
router.get('/users/search', auth, searchUsers);

// Legacy routes for testing
router.get('/messages', getMessages);

module.exports = router;
