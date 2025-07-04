const express = require('express');
const router = express.Router();
const {
  getMessages,
  createConversation,
  listConversations,
} = require('../controllers/chat.controller');

router.get('/messages', getMessages);
router.get('/conversations', listConversations);
router.post('/conversations', createConversation);

module.exports = router;
