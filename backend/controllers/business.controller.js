const Business = require('../models/business.model');

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
      .populate('categoryId', 'name')
      .populate('locationId', 'name')
      .populate('ownerId', 'userId');

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    res.json(business);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Search businesses by name (wildcard)
exports.searchBusinesses = async (req, res) => {
  try {
    const term = req.query.q || '';
    const regex = new RegExp(term, 'i');
    const businesses = await Business.find({ name: { $regex: regex } })
      .populate('ownerId', 'name')
      .populate('categoryId', 'name')
      .populate('locationId', 'name');
    res.json(businesses);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


