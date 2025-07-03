const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const auth = require('../middleware/auth.middleware');
const { requireCustomer } = require('../middleware/roles.middleware');

// Public routes
router.get('/business/:businessId', reviewController.getReviewsByBusiness);
router.get('/:id', reviewController.getReviewById);

// Customer-only routes
router.post('/', auth, requireCustomer, reviewController.createReview);
router.put('/:id', auth, requireCustomer, reviewController.updateReview);
router.delete('/:id', auth, requireCustomer, reviewController.deleteReview);
router.get('/my/reviews', auth, requireCustomer, reviewController.getMyReviews);

module.exports = router;
