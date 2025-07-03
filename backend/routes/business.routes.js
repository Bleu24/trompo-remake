const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const { 
  createBusiness, 
  getAllBusinesses, 
  getBusinessById,
  updateBusiness,
  adminUpdateBusiness,
  deleteBusiness,
  getBusinessesByLocation,
  getBusinessesByCategory,
  submitBusinessVerification
} = require('../controllers/business.controller');

router.post('/', auth, createBusiness);                    // Create business (authenticated)
router.get('/', getAllBusinesses);                         // Public: list all
router.get('/:id', getBusinessById);                       // Public: detail view
router.put('/:id', auth, updateBusiness);                  // Update business (owner only)
router.put('/admin/:id', auth, adminUpdateBusiness);       // Admin update business
router.delete('/:id', auth, deleteBusiness);               // Delete business (owner only)
router.get('/location/:locationId', getBusinessesByLocation); // Filter by location
router.get('/category/:categoryId', getBusinessesByCategory); // Filter by category
router.post('/verification', auth, submitBusinessVerification); // Submit verification

module.exports = router;
