const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken.utils');
const Customer = require('../models/customer.model');
const BusinessOwner = require('../models/businessOwner.model');

// Search users by name or email (wildcard)
exports.searchUsers = async (req, res) => {
  try {
    const term = req.query.q || '';
    const regex = new RegExp(term, 'i');
    const users = await User.find({
      $or: [{ name: { $regex: regex } }, { email: { $regex: regex } }],
    }).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
