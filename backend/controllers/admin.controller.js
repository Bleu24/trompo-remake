const User = require('../models/user.model');
const Business = require('../models/business.model');
const Review = require('../models/review.model');
const CustomerVerification = require('../models/customerVerification.model');
const VerificationRequest = require('../models/verificationRequest.model');

// ============= USER VERIFICATION CRUD =============

// Get all customer verification requests
exports.getAllCustomerVerifications = async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};
    
    if (status) {
      filter.status = status;
    }

    const verifications = await CustomerVerification.find(filter)
      .populate('customerId', 'name email role isVerified')
      .sort({ createdAt: -1 });

    res.json(verifications);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get customer verification by ID
exports.getCustomerVerificationById = async (req, res) => {
  try {
    const verification = await CustomerVerification.findById(req.params.id)
      .populate('customerId', 'name email role isVerified');

    if (!verification) {
      return res.status(404).json({ message: 'Verification request not found' });
    }

    res.json(verification);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update customer verification status
exports.updateCustomerVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, rejectionReason } = req.body;

    const verification = await CustomerVerification.findById(id);
    if (!verification) {
      return res.status(404).json({ message: 'Verification request not found' });
    }

    // Validate status
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be pending, approved, or rejected' });
    }

    // Update verification
    verification.status = status;
    if (adminNotes) verification.adminNotes = adminNotes;
    if (rejectionReason) verification.rejectionReason = rejectionReason;

    await verification.save();

    // If approved, update user's isVerified status
    if (status === 'approved') {
      await User.findByIdAndUpdate(verification.customerId, { isVerified: true });
    } else if (status === 'rejected') {
      await User.findByIdAndUpdate(verification.customerId, { isVerified: false });
    }

    const updatedVerification = await CustomerVerification.findById(id)
      .populate('customerId', 'name email role isVerified');

    res.json({ 
      message: 'Verification status updated successfully', 
      verification: updatedVerification 
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete customer verification request
exports.deleteCustomerVerification = async (req, res) => {
  try {
    const verification = await CustomerVerification.findByIdAndDelete(req.params.id);
    if (!verification) {
      return res.status(404).json({ message: 'Verification request not found' });
    }

    res.json({ message: 'Verification request deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ============= BUSINESS VERIFICATION CRUD =============

// Get all business verification requests
exports.getAllBusinessVerifications = async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};
    
    if (status) {
      filter.status = status;
    }

    const verifications = await VerificationRequest.find(filter)
      .populate('ownerId', 'name email')
      .populate('businessId', 'name description isVerified')
      .sort({ createdAt: -1 });

    res.json(verifications);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get business verification by ID
exports.getBusinessVerificationById = async (req, res) => {
  try {
    const verification = await VerificationRequest.findById(req.params.id)
      .populate('ownerId', 'name email')
      .populate('businessId', 'name description isVerified');

    if (!verification) {
      return res.status(404).json({ message: 'Business verification request not found' });
    }

    res.json(verification);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update business verification status
exports.updateBusinessVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const verification = await VerificationRequest.findById(id);
    if (!verification) {
      return res.status(404).json({ message: 'Business verification request not found' });
    }

    // Validate status
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be pending, approved, or rejected' });
    }

    // Update verification
    verification.status = status;
    if (adminNotes) verification.adminNotes = adminNotes;

    await verification.save();

    // If approved, update business's isVerified status
    if (status === 'approved') {
      await Business.findByIdAndUpdate(verification.businessId, { isVerified: true });
    } else if (status === 'rejected') {
      await Business.findByIdAndUpdate(verification.businessId, { isVerified: false });
    }

    const updatedVerification = await VerificationRequest.findById(id)
      .populate('ownerId', 'name email')
      .populate('businessId', 'name description isVerified');

    res.json({ 
      message: 'Business verification status updated successfully', 
      verification: updatedVerification 
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete business verification request
exports.deleteBusinessVerification = async (req, res) => {
  try {
    const verification = await VerificationRequest.findByIdAndDelete(req.params.id);
    if (!verification) {
      return res.status(404).json({ message: 'Business verification request not found' });
    }

    res.json({ message: 'Business verification request deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ============= REVIEW CRUD =============

// Get all reviews (admin only)
exports.getAllReviews = async (req, res) => {
  try {
    const { businessId, rating, page = 1, limit = 10 } = req.query;
    let filter = {};

    if (businessId) filter.businessId = businessId;
    if (rating) filter.rating = parseInt(rating);

    const skip = (page - 1) * limit;

    const reviews = await Review.find(filter)
      .populate('customerId', 'name email')
      .populate('businessId', 'name description')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments(filter);

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

// Get review by ID (admin only)
exports.getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('customerId', 'name email')
      .populate('businessId', 'name description');

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json(review);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update review (admin only)
exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Validate rating
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Update fields
    if (rating !== undefined) review.rating = rating;
    if (comment !== undefined) review.comment = comment;

    await review.save();

    const updatedReview = await Review.findById(id)
      .populate('customerId', 'name email')
      .populate('businessId', 'name description');

    res.json({ 
      message: 'Review updated successfully', 
      review: updatedReview 
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete review (admin only)
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ============= DASHBOARD STATISTICS =============

// Get admin dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalOwners = await User.countDocuments({ role: 'owner' });
    const verifiedUsers = await User.countDocuments({ isVerified: true });

    const totalBusinesses = await Business.countDocuments();
    const verifiedBusinesses = await Business.countDocuments({ isVerified: true });

    const totalReviews = await Review.countDocuments();
    const averageRating = await Review.aggregate([
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);

    const pendingCustomerVerifications = await CustomerVerification.countDocuments({ status: 'pending' });
    const pendingBusinessVerifications = await VerificationRequest.countDocuments({ status: 'pending' });

    res.json({
      users: {
        total: totalUsers,
        customers: totalCustomers,
        owners: totalOwners,
        verified: verifiedUsers
      },
      businesses: {
        total: totalBusinesses,
        verified: verifiedBusinesses,
        unverified: totalBusinesses - verifiedBusinesses
      },
      reviews: {
        total: totalReviews,
        averageRating: averageRating.length > 0 ? Math.round(averageRating[0].avgRating * 100) / 100 : 0
      },
      verifications: {
        pendingCustomers: pendingCustomerVerifications,
        pendingBusinesses: pendingBusinessVerifications
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
