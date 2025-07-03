const Sellable = require('../models/sellable.model');
const Business = require('../models/business.model');

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, available } = req.query;
    let filter = {};

    // Filter by category (service/product)
    if (category) {
      filter.type = category;
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Filter by availability (products with inventory > 0)
    if (available === 'true') {
      filter.$or = [
        { type: 'service' }, // Services are always available
        { type: 'product', inventory: { $gt: 0 } } // Products with inventory
      ];
    }

    const products = await Sellable.find(filter)
      .populate('businessId', 'name description')
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get products by business ID
exports.getProductsByBusiness = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { category, minPrice, maxPrice, available } = req.query;

    // Verify business exists
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    let filter = { businessId };

    // Filter by category (service/product)
    if (category) {
      filter.type = category;
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Filter by availability
    if (available === 'true') {
      filter.$or = [
        { type: 'service' },
        { type: 'product', inventory: { $gt: 0 } }
      ];
    }

    const products = await Sellable.find(filter)
      .populate('businessId', 'name description')
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get a product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Sellable.findById(req.params.id)
      .populate('businessId', 'name description ownerId');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Create a product (owner only)
exports.createProduct = async (req, res) => {
  try {
    const { businessId, title, description, type, price, inventory } = req.body;

    // Verify business exists and user owns it
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    if (business.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied. You can only create products for your own business.' });
    }

    // Validate required fields
    if (!title || !type || !price) {
      return res.status(400).json({ message: 'Title, type, and price are required' });
    }

    // For products, inventory is required
    if (type === 'product' && (inventory === undefined || inventory < 0)) {
      return res.status(400).json({ message: 'Inventory is required for products and must be >= 0' });
    }

    const productData = {
      businessId,
      title,
      description,
      type,
      price
    };

    // Only add inventory for products
    if (type === 'product') {
      productData.inventory = inventory;
    }

    const product = new Sellable(productData);
    await product.save();

    const populatedProduct = await Sellable.findById(product._id)
      .populate('businessId', 'name description');

    res.status(201).json({ message: 'Product created successfully', product: populatedProduct });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update a product (owner only)
exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const { title, description, type, price, inventory } = req.body;

    // Find the product and populate business info
    const product = await Sellable.findById(productId).populate('businessId');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user owns the business
    if (product.businessId.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied. You can only update products for your own business.' });
    }

    // Validate type change and inventory
    if (type && type === 'product' && (inventory === undefined || inventory < 0)) {
      return res.status(400).json({ message: 'Inventory is required for products and must be >= 0' });
    }

    // Update fields
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (price !== undefined) updateData.price = price;
    if (inventory !== undefined && (type === 'product' || product.type === 'product')) {
      updateData.inventory = inventory;
    }

    const updatedProduct = await Sellable.findByIdAndUpdate(
      productId,
      updateData,
      { new: true }
    ).populate('businessId', 'name description');

    res.json({ message: 'Product updated successfully', product: updatedProduct });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete a product (owner only)
exports.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    // Find the product and populate business info
    const product = await Sellable.findById(productId).populate('businessId');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user owns the business
    if (product.businessId.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied. You can only delete products for your own business.' });
    }

    await Sellable.findByIdAndDelete(productId);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
