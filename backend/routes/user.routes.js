const express = require('express');
const router = express.Router();

const { searchUsers, register, login } = require('../controllers/user.controller');

// Public: search users by name or email
router.get('/search', searchUsers);

module.exports = router;
