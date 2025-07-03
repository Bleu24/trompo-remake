const express = require('express');
const router = express.Router();
const mapsController = require('../controllers/maps.controller');
const auth = require('../middleware/auth.middleware');
const { requireOwner } = require('../middleware/roles.middleware');

// Public map routes
router.get('/businesses', mapsController.getBusinessesForMap);
router.get('/business/:businessId', mapsController.getBusinessMapDetails);
router.get('/search', mapsController.searchBusinessesNearLocation);
router.get('/config', mapsController.getMapConfig);

// Owner-only routes
router.put('/business/:businessId/location', auth, requireOwner, mapsController.updateBusinessLocation);

module.exports = router;
