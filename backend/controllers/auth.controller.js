const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const generateToken = require('../utils/generateToken.utils');
const Customer = require('../models/customer.model');
const BusinessOwner = require('../models/businessOwner.model');
const { upload, uploadToCloudinary, deleteFromCloudinary, extractPublicId } = require('../utils/cloudinary.utils');

exports.upload = upload;

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!['customer', 'owner'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: 'Email already exists' });

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

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user.userId;

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    // Handle profile picture upload to Cloudinary
    if (req.file) {
      // Get current user to check for existing profile picture
      const currentUser = await User.findById(userId);
      
      // Delete old profile picture if it exists
      if (currentUser && currentUser.profilePicture) {
        const publicId = extractPublicId(currentUser.profilePicture);
        if (publicId) {
          try {
            await deleteFromCloudinary(publicId);
          } catch (deleteError) {
            console.error('Failed to delete old profile picture from Cloudinary:', deleteError);
          }
        }
      }
      
      try {
        const result = await uploadToCloudinary(
          req.file.buffer,
          'profiles',
          `profile_${userId}_${Date.now()}`
        );
        updateData.profilePicture = result.secure_url;
      } catch (uploadError) {
        return res.status(400).json({ message: 'Profile picture upload failed', error: uploadError.message });
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, select: '-password' }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Profile updated successfully', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await User.findByIdAndUpdate(userId, { password: hashedNewPassword });

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete account
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete associated records based on role
    if (user.role === 'customer') {
      await Customer.findOneAndDelete({ userId });
    } else if (user.role === 'owner') {
      await BusinessOwner.findOneAndDelete({ userId });
    }

    // Delete user account
    await User.findByIdAndDelete(userId);

    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
