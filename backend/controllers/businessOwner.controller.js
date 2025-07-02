const BusinessOwner = require('../models/businessOwner.model');
const User = require('../models/user.model');

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
