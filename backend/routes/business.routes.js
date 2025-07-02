const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const { createBusiness, getAllBusinesses, getBusinessById, } = require('../controllers/business.controller');

router.post('/', auth, createBusiness);        // Create business (authenticated)
router.get('/', getAllBusinesses);             // Public: list all
router.get('/:id', getBusinessById);           // Public: detail view

module.exports = router;
