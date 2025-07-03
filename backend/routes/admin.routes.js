const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const auth = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/roles.middleware');

// Apply admin authentication to all routes
router.use(auth, requireAdmin);

// Dashboard statistics
router.get('/dashboard/stats', adminController.getDashboardStats);

// Customer verification routes
router.get('/customer-verifications', adminController.getAllCustomerVerifications);
router.get('/customer-verifications/:id', adminController.getCustomerVerificationById);
router.put('/customer-verifications/:id', adminController.updateCustomerVerification);
router.delete('/customer-verifications/:id', adminController.deleteCustomerVerification);

// Business verification routes
router.get('/business-verifications', adminController.getAllBusinessVerifications);
router.get('/business-verifications/:id', adminController.getBusinessVerificationById);
router.put('/business-verifications/:id', adminController.updateBusinessVerification);
router.delete('/business-verifications/:id', adminController.deleteBusinessVerification);

// Review management routes
router.get('/reviews', adminController.getAllReviews);
router.get('/reviews/:id', adminController.getReviewById);
router.put('/reviews/:id', adminController.updateReview);
router.delete('/reviews/:id', adminController.deleteReview);

module.exports = router;
