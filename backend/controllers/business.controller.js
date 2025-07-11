const Business = require('../models/business.model');
const Category = require('../models/category.model');
const Location = require('../models/location.model');
const multer = require('multer');
const path = require('path');

// Configure multer for business photo uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/business/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Create a new business
exports.createBusiness = async (req, res) => {
  try {
    const { name, description, categoryId, locationId } = req.body;

    // Find the business owner document
    const BusinessOwner = require('../models/businessOwner.model');
    const owner = await BusinessOwner.findOne({ userId: req.user.userId });
    if (!owner) {
      return res.status(404).json({ message: 'Business owner not found' });
    }

    const businessData = {
      name,
      description,
      ownerId: owner._id,
      categoryId,
      locationId,
    };

    // Add photo URLs if files were uploaded
    if (req.files) {
      if (req.files.coverPhoto) {
        businessData.coverPhoto = `/uploads/business/${req.files.coverPhoto[0].filename}`;
      }
      if (req.files.profilePhoto) {
        businessData.profilePhoto = `/uploads/business/${req.files.profilePhoto[0].filename}`;
      }
    }

    const business = new Business(businessData);
    await business.save();
    
    // Populate the response with related data
    await business.populate('categoryId', 'name');
    await business.populate('locationId', 'name');
    
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

// Get all businesses by owner
exports.getBusinessesByOwner = async (req, res) => {
  try {
    const BusinessOwner = require('../models/businessOwner.model');
    
    // Find the business owner document
    const owner = await BusinessOwner.findOne({ userId: req.user.userId });
    if (!owner) return res.status(404).json({ message: 'Business owner not found' });

    const businesses = await Business.find({ ownerId: owner._id })
      .populate('categoryId', 'name')
      .populate('locationId', 'name');
    
    res.json(businesses);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Search businesses
exports.searchBusinesses = async (req, res) => {
  try {
    const { q, location, category } = req.query;
    let searchCriteria = {};

    if (q) {
      searchCriteria.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }

    if (location) {
      searchCriteria.locationId = location;
    }

    if (category) {
      searchCriteria.categoryId = category;
    }

    const businesses = await Business.find(searchCriteria)
      .populate('categoryId', 'name')
      .populate('locationId', 'name')
      .populate('ownerId', 'userId');

    res.json(businesses);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all locations
exports.getLocations = async (req, res) => {
  try {
    const locations = await Location.find();
    res.json(locations);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Export multer upload middleware for business photos
exports.uploadBusinessPhotos = upload.fields([
  { name: 'coverPhoto', maxCount: 1 },
  { name: 'profilePhoto', maxCount: 1 }
]);

// Update a business
exports.updateBusiness = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, categoryId, locationId, deleteCoverPhoto, deleteProfilePhoto } = req.body;

    // Find the business and check ownership
    const business = await Business.findById(id);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // Find the business owner document to verify ownership
    const BusinessOwner = require('../models/businessOwner.model');
    const owner = await BusinessOwner.findOne({ userId: req.user.userId });
    if (!owner || business.ownerId.toString() !== owner._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this business' });
    }

    // Update business data
    const updateData = {
      name,
      description,
      categoryId,
      locationId,
    };

    // Handle photo deletion
    if (deleteCoverPhoto === 'true') {
      updateData.coverPhoto = null;
    }
    if (deleteProfilePhoto === 'true') {
      updateData.profilePhoto = null;
    }

    // Add photo URLs if files were uploaded
    if (req.files) {
      if (req.files.coverPhoto) {
        updateData.coverPhoto = `/uploads/business/${req.files.coverPhoto[0].filename}`;
      }
      if (req.files.profilePhoto) {
        updateData.profilePhoto = `/uploads/business/${req.files.profilePhoto[0].filename}`;
      }
    }

    const updatedBusiness = await Business.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('categoryId', 'name').populate('locationId', 'name');
    
    res.json({ message: 'Business updated successfully', business: updatedBusiness });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


