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

// Register a new user as customer or business owner
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!['customer', 'owner'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, role });
    await user.save();

    if (role === 'customer') {
      await Customer.create({ userId: user._id });
    } else if (role === 'owner') {
      await BusinessOwner.create({ userId: user._id });
    }

    const token = generateToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Login existing user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    const token = generateToken(user);
    res.json({ user, token });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
