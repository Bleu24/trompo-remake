const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const { 
  registerAsOwner, 
  getMyOwnerProfile, 
  getOwnedBusinesses,
  getBusinessStats
} = require('../controllers/businessOwner.controller');

router.post('/register', auth, registerAsOwner);
router.get('/me', auth, getMyOwnerProfile);
router.get('/businesses', auth, getOwnedBusinesses);
router.get('/stats', auth, getBusinessStats);

module.exports = router;
