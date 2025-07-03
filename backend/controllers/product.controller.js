const Sellable = require('../models/sellable.model');

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Sellable.find({ type: 'product' })
      .populate('businessId', 'name');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get products by business
exports.getProductsByBusiness = async (req, res) => {
  try {
    const { businessId } = req.params;
    const products = await Sellable.find({ businessId, type: 'product' })
      .populate('businessId', 'name');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get a product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Sellable.findOne({ _id: req.params.id, type: 'product' })
      .populate('businessId', 'name');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
