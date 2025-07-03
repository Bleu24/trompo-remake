const BusinessOwner = require('../models/businessOwner.model');
const User = require('../models/user.model');
const Business = require('../models/business.model');

// Register the authenticated user as a business owner
exports.registerAsOwner = async (req, res) => {
  try {
    const userId = req.user.userId;

    const existing = await BusinessOwner.findOne({ userId });
    if (existing) return res.status(400).json({ message: 'Already a business owner' });

    const owner = new BusinessOwner({ userId });
    await owner.save();

    // Optionally update role in User model
    await User.findByIdAndUpdate(userId, { role: 'owner' });

    res.status(201).json({ message: 'Business owner registered', owner });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get current owner's profile
exports.getMyOwnerProfile = async (req, res) => {
  try {
    const owner = await BusinessOwner.findOne({ userId: req.user.userId }).populate('userId', 'name email role');

    if (!owner) return res.status(404).json({ message: 'Not a business owner' });

    res.json(owner);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get businesses owned by the current user
exports.getOwnedBusinesses = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Check if user is an owner
    const user = await User.findById(userId);
    if (!user || user.role !== 'owner') {
      return res.status(403).json({ message: 'Only business owners can view owned businesses' });
    }

    // Get all businesses owned by this user
    const businesses = await Business.find({ ownerId: userId })
      .populate('categoryId', 'name')
      .populate('locationId', 'name')
      .sort({ createdAt: -1 });

    res.json(businesses);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get business statistics for the owner
exports.getBusinessStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Check if user is an owner
    const user = await User.findById(userId);
    if (!user || user.role !== 'owner') {
      return res.status(403).json({ message: 'Only business owners can view business statistics' });
    }

    const totalBusinesses = await Business.countDocuments({ ownerId: userId });
    const verifiedBusinesses = await Business.countDocuments({ ownerId: userId, isVerified: true });
    const unverifiedBusinesses = totalBusinesses - verifiedBusinesses;

    res.json({
      totalBusinesses,
      verifiedBusinesses,
      unverifiedBusinesses
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
