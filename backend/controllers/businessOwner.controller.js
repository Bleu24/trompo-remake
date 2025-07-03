const BusinessOwner = require('../models/businessOwner.model');
const User = require('../models/user.model');
const Business = require('../models/business.model');
const Sellable = require('../models/sellable.model');

// Register the authenticated user as a business owner
exports.registerAsOwner = async (req, res) => {
  try {
    const userId = req.user.userId;

    const existing = await BusinessOwner.findOne({ userId });
    if (existing) return res.status(400).json({ message: 'Already a business owner' });

    const owner = new BusinessOwner({ userId });
    await owner.save();

    // Update role in User model
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

// Helper to get current owner document
async function findOwner(userId) {
  return BusinessOwner.findOne({ userId });
}

// Create a product for an owner's business
exports.createOwnerProduct = async (req, res) => {
  try {
    const owner = await findOwner(req.user.userId);
    if (!owner) return res.status(403).json({ message: 'Not a business owner' });

    const { businessId, title, description, price, inventory } = req.body;

    const business = await Business.findOne({ _id: businessId, ownerId: owner._id });
    if (!business) return res.status(404).json({ message: 'Business not found' });

    const product = new Sellable({
      businessId,
      title,
      description,
      type: 'product',
      price,
      inventory,
    });

    await product.save();
    res.status(201).json({ message: 'Product created', product });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update a product belonging to the owner's business
exports.updateOwnerProduct = async (req, res) => {
  try {
    const owner = await findOwner(req.user.userId);
    if (!owner) return res.status(403).json({ message: 'Not a business owner' });

    const product = await Sellable.findOne({ _id: req.params.id, type: 'product' });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const business = await Business.findOne({ _id: product.businessId, ownerId: owner._id });
    if (!business) return res.status(403).json({ message: 'Not authorized' });

    Object.assign(product, req.body);
    await product.save();

    res.json({ message: 'Product updated', product });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete a product belonging to the owner's business
exports.deleteOwnerProduct = async (req, res) => {
  try {
    const owner = await findOwner(req.user.userId);
    if (!owner) return res.status(403).json({ message: 'Not a business owner' });

    const product = await Sellable.findOne({ _id: req.params.id, type: 'product' });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const business = await Business.findOne({ _id: product.businessId, ownerId: owner._id });
    if (!business) return res.status(403).json({ message: 'Not authorized' });

    await Sellable.deleteOne({ _id: product._id });

    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
