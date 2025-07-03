const Business = require('../models/business.model');
const Review = require('../models/review.model');

// Update business rating statistics
const updateBusinessRating = async (businessId) => {
  try {
    const reviews = await Review.find({ businessId });
    
    if (reviews.length === 0) {
      await Business.findByIdAndUpdate(businessId, {
        averageRating: 0,
        totalReviews: 0
      });
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = Math.round((totalRating / reviews.length) * 100) / 100; // Round to 2 decimal places

    await Business.findByIdAndUpdate(businessId, {
      averageRating,
      totalReviews: reviews.length
    });
  } catch (error) {
    console.error('Error updating business rating:', error);
  }
};

// Middleware to update rating after review operations
const updateRatingAfterReview = async (req, res, next) => {
  // Store the original methods
  const originalSend = res.send;
  
  // Override the send method to capture successful responses
  res.send = function(data) {
    // Check if the response was successful (status 200-299)
    if (res.statusCode >= 200 && res.statusCode < 300) {
      // Extract businessId from request or response data
      let businessId = null;
      
      // For review creation/update
      if (req.body && req.body.businessId) {
        businessId = req.body.businessId;
      }
      
      // For review deletion, we need to get businessId from the review being deleted
      if (req.method === 'DELETE' && req.originalUrl.includes('/reviews/')) {
        // This would need to be handled before deletion in the controller
        // We'll handle this in the review controller directly
      }
      
      // Parse response data to get businessId
      try {
        const responseData = typeof data === 'string' ? JSON.parse(data) : data;
        if (responseData && responseData.review && responseData.review.businessId) {
          businessId = responseData.review.businessId._id || responseData.review.businessId;
        }
      } catch (e) {
        // Ignore parsing errors
      }
      
      // Update rating if businessId is available
      if (businessId) {
        updateBusinessRating(businessId);
      }
    }
    
    // Call the original send method
    originalSend.call(this, data);
  };
  
  next();
};

module.exports = {
  updateBusinessRating,
  updateRatingAfterReview
};
