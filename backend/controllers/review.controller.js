const Review = require('../models/review.model');
const Business = require('../models/business.model');
const User = require('../models/user.model');

// Create a review
exports.createReview = async (req, res) => {
  try {
    const customerId = req.user.userId;
    const { businessId, rating, comment } = req.body;

    // Check if user is a customer
    const user = await User.findById(customerId);
    if (!user || user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can create reviews' });
    }

    // Validate required fields
    if (!businessId || !rating) {
      return res.status(400).json({ message: 'Business ID and rating are required' });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Check if business exists
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // Check if customer already reviewed this business
    const existingReview = await Review.findOne({ customerId, businessId });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this business' });
    }

    // Create review
    const review = new Review({
      customerId,
      businessId,
      rating,
      comment
    });

    await review.save();

    const populatedReview = await Review.findById(review._id)
      .populate('customerId', 'name')
      .populate('businessId', 'name description');

    res.status(201).json({ 
      message: 'Review created successfully', 
      review: populatedReview 
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all reviews by business
exports.getReviewsByBusiness = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { page = 1, limit = 10, rating } = req.query;

    // Check if business exists
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    let filter = { businessId };
    if (rating) {
      filter.rating = parseInt(rating);
    }

    const skip = (page - 1) * limit;

    const reviews = await Review.find(filter)
      .populate('customerId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments(filter);

    // Calculate average rating for this business
    const ratingStats = await Review.aggregate([
      { $match: { businessId: business._id } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    const stats = ratingStats.length > 0 ? {
      averageRating: Math.round(ratingStats[0].averageRating * 100) / 100,
      totalReviews: ratingStats[0].totalReviews,
      ratingDistribution: ratingStats[0].ratingDistribution.reduce((acc, rating) => {
        acc[rating] = (acc[rating] || 0) + 1;
        return acc;
      }, {})
    } : {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: {}
    };

    res.json({
      reviews,
      stats,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get a review by ID
exports.getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('customerId', 'name')
      .populate('businessId', 'name description');

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json(review);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update a review (customer can only update their own review)
exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const customerId = req.user.userId;

    // Check if user is a customer
    const user = await User.findById(customerId);
    if (!user || user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can update reviews' });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if customer owns this review
    if (review.customerId.toString() !== customerId) {
      return res.status(403).json({ message: 'You can only update your own reviews' });
    }

    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Update fields
    if (rating !== undefined) review.rating = rating;
    if (comment !== undefined) review.comment = comment;

    await review.save();

    const updatedReview = await Review.findById(id)
      .populate('customerId', 'name')
      .populate('businessId', 'name description');

    res.json({ 
      message: 'Review updated successfully', 
      review: updatedReview 
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete a review (customer can only delete their own review)
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.user.userId;

    // Check if user is a customer
    const user = await User.findById(customerId);
    if (!user || user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can delete reviews' });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if customer owns this review
    if (review.customerId.toString() !== customerId) {
      return res.status(403).json({ message: 'You can only delete your own reviews' });
    }

    await Review.findByIdAndDelete(id);
    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get reviews by current customer
exports.getMyReviews = async (req, res) => {
  try {
    const customerId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;

    // Check if user is a customer
    const user = await User.findById(customerId);
    if (!user || user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can view their reviews' });
    }

    const skip = (page - 1) * limit;

    const reviews = await Review.find({ customerId })
      .populate('businessId', 'name description')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ customerId });

    res.json({
      reviews,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
