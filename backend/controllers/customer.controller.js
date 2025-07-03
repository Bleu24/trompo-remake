const User = require('../models/user.model');
const Business = require('../models/business.model');
const SavedBusiness = require('../models/savedBusiness.model');
const CustomerVerification = require('../models/customerVerification.model');

// Submit account verification
exports.submitAccountVerification = async (req, res) => {
  try {
    const customerId = req.user.userId;
    const { documents } = req.body;

    // Check if user is a customer
    const user = await User.findById(customerId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can submit account verification' });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({ message: 'Account is already verified' });
    }

    // Check if there's already a pending verification request
    const existingRequest = await CustomerVerification.findOne({ 
      customerId, 
      status: 'pending' 
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'You already have a pending verification request' });
    }

    // Validate documents
    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({ message: 'At least one document is required for verification' });
    }

    // Create verification request
    const verificationRequest = new CustomerVerification({
      customerId,
      documents
    });

    await verificationRequest.save();

    res.status(201).json({ 
      message: 'Verification request submitted successfully', 
      request: verificationRequest 
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get customer's verification status
exports.getVerificationStatus = async (req, res) => {
  try {
    const customerId = req.user.userId;

    const user = await User.findById(customerId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'customer') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get the latest verification request
    const verificationRequest = await CustomerVerification.findOne({ customerId })
      .sort({ createdAt: -1 });

    res.json({
      isVerified: user.isVerified,
      verificationRequest: verificationRequest || null
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Save a business to favorites
exports.saveBusiness = async (req, res) => {
  try {
    const customerId = req.user.userId;
    const { businessId } = req.body;

    // Check if user is a customer
    const user = await User.findById(customerId);
    if (!user || user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can save businesses' });
    }

    // Check if business exists
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // Check if already saved
    const existingSave = await SavedBusiness.findOne({ customerId, businessId });
    if (existingSave) {
      return res.status(400).json({ message: 'Business already saved' });
    }

    // Save the business
    const savedBusiness = new SavedBusiness({ customerId, businessId });
    await savedBusiness.save();

    const populatedSave = await SavedBusiness.findById(savedBusiness._id)
      .populate('businessId', 'name description isVerified');

    res.status(201).json({ 
      message: 'Business saved successfully', 
      savedBusiness: populatedSave 
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Remove a business from favorites
exports.unsaveBusiness = async (req, res) => {
  try {
    const customerId = req.user.userId;
    const { businessId } = req.params;

    // Check if user is a customer
    const user = await User.findById(customerId);
    if (!user || user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can unsave businesses' });
    }

    // Find and remove the saved business
    const savedBusiness = await SavedBusiness.findOneAndDelete({ customerId, businessId });
    if (!savedBusiness) {
      return res.status(404).json({ message: 'Saved business not found' });
    }

    res.json({ message: 'Business removed from saved list successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// View saved businesses
exports.getSavedBusinesses = async (req, res) => {
  try {
    const customerId = req.user.userId;

    // Check if user is a customer
    const user = await User.findById(customerId);
    if (!user || user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can view saved businesses' });
    }

    const savedBusinesses = await SavedBusiness.find({ customerId })
      .populate({
        path: 'businessId',
        select: 'name description isVerified categoryId locationId',
        populate: [
          { path: 'categoryId', select: 'name' },
          { path: 'locationId', select: 'name' }
        ]
      })
      .sort({ createdAt: -1 });

    res.json(savedBusinesses);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
