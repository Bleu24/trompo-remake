const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const { registerAsOwner, getMyOwnerProfile, } = require('../controllers/businessOwner.controller');

router.post('/register', auth, registerAsOwner);
router.get('/me', auth, getMyOwnerProfile);

module.exports = router;
