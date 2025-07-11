const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const {
  registerAsOwner,
  getMyOwnerProfile,
  createOwnerProduct,
  updateOwnerProduct,
  deleteOwnerProduct,
  getOwnerBusinesses,
  getOwnerProducts,
  getOwnerTransactions,
  getBusinessAnalytics,
  getSpecificBusinessAnalytics,
  requestVerification,
  getVerificationStatus,
  uploadVerificationDocs,
} = require('../controllers/businessOwner.controller');

router.post('/register', auth, registerAsOwner);
router.get('/me', auth, getMyOwnerProfile);
router.get('/businesses', auth, getOwnerBusinesses);
router.get('/products', auth, getOwnerProducts);
router.get('/transactions', auth, getOwnerTransactions);
router.get('/analytics', auth, getBusinessAnalytics);
router.get('/analytics/:businessId', auth, getSpecificBusinessAnalytics);
router.post('/products', auth, createOwnerProduct);
router.put('/products/:id', auth, updateOwnerProduct);
router.delete('/products/:id', auth, deleteOwnerProduct);

// Verification routes
router.post('/verification/request', auth, uploadVerificationDocs, requestVerification);
router.get('/verification/status/:businessId', auth, getVerificationStatus);

module.exports = router;
