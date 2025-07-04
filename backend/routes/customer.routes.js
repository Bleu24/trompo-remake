const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const { submitVerification, getSavedBusinesses } = require('../controllers/customer.controller');

router.post('/verification', auth, submitVerification);
router.get('/saved-businesses', auth, getSavedBusinesses);

module.exports = router;
