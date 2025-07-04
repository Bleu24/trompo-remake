const express = require('express');
const router = express.Router();
const { getMessages } = require('../controllers/chat.controller');

router.get('/messages', getMessages);

module.exports = router;
