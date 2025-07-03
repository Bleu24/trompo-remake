const Business = require('../models/business.model');
const VerificationRequest = require('../models/verificationRequest.model');

// Create a new business
exports.createBusiness = async (req, res) => {
  try {
    const { name, description, categoryId, locationId } = req.body;

    const business = new Business({
      name,
      description,
      ownerId: req.user.userId,
      categoryId,
      locationId,
    });

    await business.save();
    res.status(201).json({ message: 'Business created', business });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all businesses
exports.getAllBusinesses = async (req, res) => {
  try {
    const businesses = await Business.find()
      .populate('ownerId', 'name')
      .populate('categoryId', 'name')
      .populate('locationId', 'name');
    res.json(businesses);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get a business by ID
exports.getBusinessById = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id)
      .populate('ownerId', 'name')
      .populate('categoryId', 'name')
      .populate('locationId', 'name');

    if (!business) return res.status(404).json({ message: 'Business not found' });

    res.json(business);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update a business (owner only)
exports.updateBusiness = async (req, res) => {
  try {
    const { name, description, categoryId, locationId } = req.body;
    const businessId = req.params.id;

    const business = await Business.findById(businessId);
    if (!business) return res.status(404).json({ message: 'Business not found' });

    // Check if user is the owner
    if (business.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to update this business' });
    }

    const updatedBusiness = await Business.findByIdAndUpdate(
      businessId,
      { name, description, categoryId, locationId },
      { new: true }
    ).populate('ownerId', 'name')
     .populate('categoryId', 'name')
     .populate('locationId', 'name');

    res.json({ message: 'Business updated successfully', business: updatedBusiness });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update business (admin side - for policy violations)
exports.adminUpdateBusiness = async (req, res) => {
  try {
    const { name, description, categoryId, locationId, isVerified } = req.body;
    const businessId = req.params.id;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const business = await Business.findById(businessId);
    if (!business) return res.status(404).json({ message: 'Business not found' });

    const updatedBusiness = await Business.findByIdAndUpdate(
      businessId,
      { name, description, categoryId, locationId, isVerified },
      { new: true }
    ).populate('ownerId', 'name')
     .populate('categoryId', 'name')
     .populate('locationId', 'name');

    res.json({ message: 'Business updated by admin', business: updatedBusiness });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete a business (owner only)
exports.deleteBusiness = async (req, res) => {
  try {
    const businessId = req.params.id;

    const business = await Business.findById(businessId);
    if (!business) return res.status(404).json({ message: 'Business not found' });

    // Check if user is the owner
    if (business.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this business' });
    }

    await Business.findByIdAndDelete(businessId);
    res.json({ message: 'Business deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Filter businesses by location
exports.getBusinessesByLocation = async (req, res) => {
  try {
    const { locationId } = req.params;

    const businesses = await Business.find({ locationId })
      .populate('ownerId', 'name')
      .populate('categoryId', 'name')
      .populate('locationId', 'name');

    res.json(businesses);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Filter businesses by category
exports.getBusinessesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const businesses = await Business.find({ categoryId })
      .populate('ownerId', 'name')
      .populate('categoryId', 'name')
      .populate('locationId', 'name');

    res.json(businesses);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Submit business verification
exports.submitBusinessVerification = async (req, res) => {
  try {
    const { businessId, documents } = req.body;

    const business = await Business.findById(businessId);
    if (!business) return res.status(404).json({ message: 'Business not found' });

    // Check if user is the owner
    if (business.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to submit verification for this business' });
    }

    // Check if verification request already exists
    const existingRequest = await VerificationRequest.findOne({ 
      ownerId: req.user.userId,
      businessId: businessId
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'Verification request already submitted' });
    }

    const verificationRequest = new VerificationRequest({
      ownerId: req.user.userId,
      businessId: businessId,
      documents: documents || []
    });

    await verificationRequest.save();
    res.status(201).json({ message: 'Verification request submitted', verificationRequest });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


