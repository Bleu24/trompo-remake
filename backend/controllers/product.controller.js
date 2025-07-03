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

// Create a new product
exports.createProduct = async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const { businessId, title, description, price, inventory } = req.body;

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

// Update a product
exports.updateProduct = async (req, res) => {
  try {
    const updates = req.body;
    const product = await Sellable.findOneAndUpdate(
      { _id: req.params.id, type: 'product' },
      updates,
      { new: true }
    );

    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product updated', product });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete a product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Sellable.findOneAndDelete({ _id: req.params.id, type: 'product' });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
