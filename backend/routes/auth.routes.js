const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const { register, login, getProfile } = require('../controllers/auth.controller');

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, getProfile);

module.exports = router;
