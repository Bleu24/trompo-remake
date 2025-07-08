const Customer = require('../models/customer.model');
const SavedBusiness = require('../models/savedBusiness.model');
const SavedItem = require('../models/savedItem.model');
const Business = require('../models/business.model');
const Sellable = require('../models/sellable.model');
const CustomerVerification = require('../models/customerVerification.model');

exports.submitVerification = async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const customer = await Customer.findOne({ userId: req.user.userId });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const { documents } = req.body;
    const verification = new CustomerVerification({ customerId: customer._id, documents });
    await verification.save();
    res.status(201).json({ message: 'Verification submitted', verification });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getSavedBusinesses = async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const customer = await Customer.findOne({ userId: req.user.userId });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const saved = await SavedBusiness.find({ customerId: customer._id }).populate('businessId');
    res.json(saved);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Save an item (business, product, or service)
exports.saveItem = async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const customer = await Customer.findOne({ userId: req.user.userId });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const { itemId, itemType } = req.body;
    
    // Validate item type
    if (!['business', 'product', 'service'].includes(itemType)) {
      return res.status(400).json({ message: 'Invalid item type' });
    }

    // Check if item exists
    let item;
    if (itemType === 'business') {
      item = await Business.findById(itemId);
    } else {
      item = await Sellable.findById(itemId);
    }
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Create saved item
    const savedItem = new SavedItem({
      customerId: customer._id,
      itemId,
      itemType
    });
    
    await savedItem.save();
    res.status(201).json({ message: 'Item saved successfully', savedItem });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Item already saved' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Unsave an item
exports.unsaveItem = async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const customer = await Customer.findOne({ userId: req.user.userId });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const { itemId, itemType } = req.body;
    
    const result = await SavedItem.findOneAndDelete({
      customerId: customer._id,
      itemId,
      itemType
    });
    
    if (!result) {
      return res.status(404).json({ message: 'Saved item not found' });
    }
    
    res.json({ message: 'Item unsaved successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all saved items for a customer
exports.getSavedItems = async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const customer = await Customer.findOne({ userId: req.user.userId });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const savedItems = await SavedItem.find({ customerId: customer._id });
    
    // Group items by type and populate them
    const result = {
      businesses: [],
      products: [],
      services: []
    };
    
    for (const savedItem of savedItems) {
      if (savedItem.itemType === 'business') {
        const business = await Business.findById(savedItem.itemId)
          .populate('categoryId', 'name')
          .populate('locationId', 'name');
        if (business) {
          result.businesses.push({
            ...business.toObject(),
            savedAt: savedItem.createdAt
          });
        }
      } else {
        const sellable = await Sellable.findById(savedItem.itemId)
          .populate('businessId', 'name');
        if (sellable) {
          const itemWithSavedAt = {
            ...sellable.toObject(),
            savedAt: savedItem.createdAt
          };
          
          if (sellable.type === 'product') {
            result.products.push(itemWithSavedAt);
          } else if (sellable.type === 'service') {
            result.services.push(itemWithSavedAt);
          }
        }
      }
    }
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
