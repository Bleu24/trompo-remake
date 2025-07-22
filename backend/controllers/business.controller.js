const Business = require('../models/business.model');
const Category = require('../models/category.model');
const Location = require('../models/location.model');
const { upload, uploadToCloudinary, deleteFromCloudinary, extractPublicId } = require('../utils/cloudinary.utils');

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

    // Upload images to Cloudinary if files were uploaded
    if (req.files) {
      if (req.files.coverPhoto && req.files.coverPhoto[0]) {
        try {
          const result = await uploadToCloudinary(
            req.files.coverPhoto[0].buffer, 
            'business/covers',
            `business_cover_${owner._id}_${Date.now()}`
          );
          businessData.coverPhoto = result.secure_url;
        } catch (uploadError) {
          return res.status(400).json({ message: 'Cover photo upload failed', error: uploadError.message });
        }
      }
      
      if (req.files.profilePhoto && req.files.profilePhoto[0]) {
        try {
          const result = await uploadToCloudinary(
            req.files.profilePhoto[0].buffer, 
            'business/profiles',
            `business_profile_${owner._id}_${Date.now()}`
          );
          businessData.profilePhoto = result.secure_url;
        } catch (uploadError) {
          return res.status(400).json({ message: 'Profile photo upload failed', error: uploadError.message });
        }
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
      // Delete old cover photo from Cloudinary
      if (business.coverPhoto) {
        const publicId = extractPublicId(business.coverPhoto);
        if (publicId) {
          try {
            await deleteFromCloudinary(publicId);
          } catch (deleteError) {
            console.error('Failed to delete cover photo from Cloudinary:', deleteError);
          }
        }
      }
      updateData.coverPhoto = null;
    }
    
    if (deleteProfilePhoto === 'true') {
      // Delete old profile photo from Cloudinary
      if (business.profilePhoto) {
        const publicId = extractPublicId(business.profilePhoto);
        if (publicId) {
          try {
            await deleteFromCloudinary(publicId);
          } catch (deleteError) {
            console.error('Failed to delete profile photo from Cloudinary:', deleteError);
          }
        }
      }
      updateData.profilePhoto = null;
    }

    // Upload new photos to Cloudinary if files were uploaded
    if (req.files) {
      if (req.files.coverPhoto && req.files.coverPhoto[0]) {
        // Delete old cover photo first
        if (business.coverPhoto) {
          const publicId = extractPublicId(business.coverPhoto);
          if (publicId) {
            try {
              await deleteFromCloudinary(publicId);
            } catch (deleteError) {
              console.error('Failed to delete old cover photo from Cloudinary:', deleteError);
            }
          }
        }
        
        try {
          const result = await uploadToCloudinary(
            req.files.coverPhoto[0].buffer,
            'business/covers',
            `business_cover_${owner._id}_${Date.now()}`
          );
          updateData.coverPhoto = result.secure_url;
        } catch (uploadError) {
          return res.status(400).json({ message: 'Cover photo upload failed', error: uploadError.message });
        }
      }
      
      if (req.files.profilePhoto && req.files.profilePhoto[0]) {
        // Delete old profile photo first
        if (business.profilePhoto) {
          const publicId = extractPublicId(business.profilePhoto);
          if (publicId) {
            try {
              await deleteFromCloudinary(publicId);
            } catch (deleteError) {
              console.error('Failed to delete old profile photo from Cloudinary:', deleteError);
            }
          }
        }
        
        try {
          const result = await uploadToCloudinary(
            req.files.profilePhoto[0].buffer,
            'business/profiles',
            `business_profile_${owner._id}_${Date.now()}`
          );
          updateData.profilePhoto = result.secure_url;
        } catch (uploadError) {
          return res.status(400).json({ message: 'Profile photo upload failed', error: uploadError.message });
        }
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

// Track business page visit and create notification
exports.trackBusinessVisit = async (req, res) => {
  try {
    const businessId = req.params.id;
    const userId = req.user.userId;

    // Get visitor information
    const User = require('../models/user.model');
    const Customer = require('../models/customer.model');
    
    const user = await User.findById(userId);
    const customer = await Customer.findOne({ userId });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const visitorData = {
      userId: userId,
      customerName: user.name || user.email || 'Anonymous User'
    };

    // Create business visit notification
    const { createBusinessVisitNotification } = require('./notification.controller');
    const notification = await createBusinessVisitNotification(businessId, visitorData);

    if (notification) {
      res.json({ message: 'Visit tracked successfully', notification });
    } else {
      res.json({ message: 'Visit noted (notification not sent to avoid spam)' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


