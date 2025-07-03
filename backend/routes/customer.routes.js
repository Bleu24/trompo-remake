const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const auth = require('../middleware/auth.middleware');

// Customer verification routes
router.post('/verification', auth, customerController.submitAccountVerification);
router.get('/verification/status', auth, customerController.getVerificationStatus);

// Saved businesses routes
router.post('/saved-businesses', auth, customerController.saveBusiness);
router.delete('/saved-businesses/:businessId', auth, customerController.unsaveBusiness);
router.get('/saved-businesses', auth, customerController.getSavedBusinesses);

module.exports = router;
