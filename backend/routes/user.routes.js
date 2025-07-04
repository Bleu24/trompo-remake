const express = require('express');
const router = express.Router();

const { searchUsers, register, login } = require('../controllers/user.controller');

// Public: search users by name or email
router.get('/search', searchUsers);
router.post('/register', register);
router.post('/login', login);

module.exports = router;
