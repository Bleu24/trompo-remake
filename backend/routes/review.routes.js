const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const {
  createReview,
  updateReview,
  deleteReview,
  getReviewsByBusiness,
} = require('../controllers/review.controller');

// Public: list reviews for a business
router.get('/businesses/:id/reviews', getReviewsByBusiness);

// Customer actions
router.post('/reviews', auth, createReview);
router.put('/reviews/:id', auth, updateReview);
router.delete('/reviews/:id', auth, deleteReview);

module.exports = router;
