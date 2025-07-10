const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const {
  createBusiness,
  updateBusiness,
  getAllBusinesses,
  getBusinessById,
  searchBusinesses,
  getBusinessesByOwner,
  getCategories,
  getLocations,
  uploadBusinessPhotos,
} = require('../controllers/business.controller');
const { getProductsByBusiness } = require('../controllers/product.controller');

router.post('/', auth, uploadBusinessPhotos, createBusiness); // Create business (authenticated)
router.put('/:id', auth, uploadBusinessPhotos, updateBusiness); // Update business (authenticated)
router.get('/', getAllBusinesses);             // Public: list all
router.get('/categories', getCategories);      // Get all categories
router.get('/locations', getLocations);        // Get all locations
router.get('/owner', auth, getBusinessesByOwner); // Get businesses by owner
router.get('/search', searchBusinesses);       // Wildcard search
router.get('/:id', getBusinessById);           // Public: detail view
router.get('/:id/products', getProductsByBusiness); // Get products for a business (no auth required)

module.exports = router;
