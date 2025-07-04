const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const admin = require('../controllers/admin.controller');

router.use(auth);

// Customer verifications
router.get('/customer-verifications', admin.getCustomerVerifications);
router.get('/customer-verifications/:id', admin.getCustomerVerification);
router.put('/customer-verifications/:id', admin.updateCustomerVerification);
router.delete('/customer-verifications/:id', admin.deleteCustomerVerification);

// Business verifications
router.get('/business-verifications', admin.getBusinessVerifications);
router.get('/business-verifications/:id', admin.getBusinessVerification);
router.put('/business-verifications/:id', admin.updateBusinessVerification);
router.delete('/business-verifications/:id', admin.deleteBusinessVerification);

// Reviews
router.get('/reviews', admin.getReviews);
router.get('/reviews/:id', admin.getReview);
router.put('/reviews/:id', admin.updateReview);
router.delete('/reviews/:id', admin.deleteReview);

module.exports = router;
