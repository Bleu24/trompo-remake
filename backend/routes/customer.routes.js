const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const { 
  submitVerification, 
  getSavedBusinesses, 
  saveItem, 
  unsaveItem, 
  getSavedItems 
} = require('../controllers/customer.controller');

router.post('/verification', auth, submitVerification);
router.get('/saved-businesses', auth, getSavedBusinesses);
router.post('/save-item', auth, saveItem);
router.delete('/unsave-item', auth, unsaveItem);
router.get('/saved-items', auth, getSavedItems);

module.exports = router;
