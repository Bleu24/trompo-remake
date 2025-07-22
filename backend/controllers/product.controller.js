const Sellable = require('../models/sellable.model');
const Business = require('../models/business.model');
const BusinessOwner = require('../models/businessOwner.model');
const { upload, uploadToCloudinary, deleteFromCloudinary, extractPublicId } = require('../utils/cloudinary.utils');

// Middleware for handling multiple images
exports.uploadImages = upload.array('images', 5); // Allow up to 5 images

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Sellable.find()
      .populate({
        path: 'businessId',
        select: 'name locationId',
        populate: {
          path: 'locationId',
          select: 'name region'
        }
      })
      .populate('categoryId', 'name');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get products by business
exports.getProductsByBusiness = async (req, res) => {
  try {
    // Handle both parameter names: 'businessId' (from product routes) and 'id' (from business routes)
    const businessId = req.params.businessId || req.params.id;
    const products = await Sellable.find({ businessId })
      .populate({
        path: 'businessId',
        select: 'name locationId',
        populate: {
          path: 'locationId',
          select: 'name region'
        }
      })
      .populate('categoryId', 'name');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get a product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Sellable.findById(req.params.id)
      .populate({
        path: 'businessId',
        select: 'name locationId',
        populate: {
          path: 'locationId',
          select: 'name region'
        }
      })
      .populate('categoryId', 'name');
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

    const { businessId, title, description, price, categoryId, type, inventory } = req.body;

    // Verify that the user owns this business
    const businessOwner = await BusinessOwner.findOne({ userId: req.user.userId });
    if (!businessOwner) {
      return res.status(403).json({ message: 'Business owner not found' });
    }

    const business = await Business.findOne({ _id: businessId, ownerId: businessOwner._id });
    if (!business) {
      return res.status(403).json({ message: 'You can only add products to your own business' });
    }

    // Upload images to Cloudinary
    const images = [];
    if (req.files && req.files.length > 0) {
      console.log('Product creation - uploading files to Cloudinary:', req.files.length);
      
      for (const file of req.files) {
        try {
          const result = await uploadToCloudinary(
            file.buffer,
            'products',
            `product_${businessId}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
          );
          images.push(result.secure_url);
        } catch (uploadError) {
          console.error('Failed to upload product image:', uploadError);
          return res.status(400).json({ message: 'Image upload failed', error: uploadError.message });
        }
      }
    }

    console.log('Product creation - images array:', images);

    const product = new Sellable({
      businessId,
      title,
      description,
      type,
      price: parseFloat(price),
      categoryId,
      inventory: type === 'product' ? parseInt(inventory) || 0 : undefined,
      images,
    });

    await product.save();
    console.log('Product saved with images:', product.images);
    
    const populatedProduct = await Sellable.findById(product._id)
      .populate('businessId', 'name')
      .populate('categoryId', 'name');

    res.status(201).json({ message: 'Product created', product: populatedProduct });
  } catch (err) {
    console.error('Product creation error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update a product
exports.updateProduct = async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { title, description, price, categoryId, type, inventory } = req.body;

    // Find the product and verify ownership
    const product = await Sellable.findById(req.params.id).populate('businessId');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Verify that the user owns this business
    const businessOwner = await BusinessOwner.findOne({ userId: req.user.userId });
    if (!businessOwner) {
      return res.status(403).json({ message: 'Business owner not found' });
    }

    const business = await Business.findOne({ _id: product.businessId._id, ownerId: businessOwner._id });
    if (!business) {
      return res.status(403).json({ message: 'You can only update products in your own business' });
    }

    // Upload new images to Cloudinary
    const newImages = [];
    if (req.files && req.files.length > 0) {
      console.log('Product update - uploading files to Cloudinary:', req.files.length);
      
      for (const file of req.files) {
        try {
          const result = await uploadToCloudinary(
            file.buffer,
            'products',
            `product_${product.businessId._id}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
          );
          newImages.push(result.secure_url);
        } catch (uploadError) {
          console.error('Failed to upload product image:', uploadError);
          return res.status(400).json({ message: 'Image upload failed', error: uploadError.message });
        }
      }
    }
    
    const updateData = {
      title,
      description,
      price: parseFloat(price),
      categoryId,
      type,
    };

    // Only update inventory for products
    if (type === 'product') {
      updateData.inventory = parseInt(inventory) || 0;
    }

    // If new images are uploaded, add them to existing images
    if (newImages.length > 0) {
      updateData.images = [...(product.images || []), ...newImages];
    }

    const updatedProduct = await Sellable.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('businessId', 'name').populate('categoryId', 'name');

    res.json({ message: 'Product updated', product: updatedProduct });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete a product
exports.deleteProduct = async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Find the product and verify ownership
    const product = await Sellable.findById(req.params.id).populate('businessId');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Verify that the user owns this business
    const businessOwner = await BusinessOwner.findOne({ userId: req.user.userId });
    if (!businessOwner) {
      return res.status(403).json({ message: 'Business owner not found' });
    }

    const business = await Business.findOne({ _id: product.businessId._id, ownerId: businessOwner._id });
    if (!business) {
      return res.status(403).json({ message: 'You can only delete products from your own business' });
    }

    // Delete images from Cloudinary
    if (product.images && product.images.length > 0) {
      for (const imageUrl of product.images) {
        const publicId = extractPublicId(imageUrl);
        if (publicId) {
          try {
            await deleteFromCloudinary(publicId);
          } catch (deleteError) {
            console.error('Failed to delete product image from Cloudinary:', deleteError);
          }
        }
      }
    }

    await Sellable.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Search products by title (wildcard)
exports.searchProducts = async (req, res) => {
  try {
    const term = req.query.q || '';
    const regex = new RegExp(term, 'i');
    const products = await Sellable.find({ title: { $regex: regex } })
      .populate('businessId', 'name')
      .populate('categoryId', 'name');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
