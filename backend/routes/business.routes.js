const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const {
  createBusiness,
  getAllBusinesses,
  getBusinessById,
  searchBusinesses,
  getBusinessesByOwner,
  getCategories,
  getLocations,
  uploadBusinessPhotos,
} = require('../controllers/business.controller');

router.post('/', auth, uploadBusinessPhotos, createBusiness); // Create business (authenticated)
router.get('/', getAllBusinesses);             // Public: list all
router.get('/categories', getCategories);      // Get all categories
router.get('/locations', getLocations);        // Get all locations
router.get('/owner', auth, getBusinessesByOwner); // Get businesses by owner
router.get('/search', searchBusinesses);       // Wildcard search
router.get('/:id', getBusinessById);           // Public: detail view

module.exports = router;
