const BusinessOwner = require('../models/businessOwner.model');
const User = require('../models/user.model');
const Business = require('../models/business.model');
const Sellable = require('../models/sellable.model');
const VerificationRequest = require('../models/verificationRequest.model');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/verification/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (JPG, PNG) and PDF files are allowed!'));
    }
  }
});

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

// Get owner's businesses
exports.getOwnerBusinesses = async (req, res) => {
  try {
    const owner = await findOwner(req.user.userId);
    if (!owner) return res.status(403).json({ message: 'Not a business owner' });

    const businesses = await Business.find({ ownerId: owner._id })
      .populate('categoryId', 'name')
      .populate('locationId', 'name');

    res.json(businesses);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get owner's products
exports.getOwnerProducts = async (req, res) => {
  try {
    const owner = await findOwner(req.user.userId);
    if (!owner) return res.status(403).json({ message: 'Not a business owner' });

    const businesses = await Business.find({ ownerId: owner._id });
    const businessIds = businesses.map(b => b._id);

    const products = await Sellable.find({ 
      businessId: { $in: businessIds }
    }).populate('businessId', 'name');

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get business transactions for owner
exports.getOwnerTransactions = async (req, res) => {
  try {
    const Transaction = require('../models/transaction.model');
    const owner = await findOwner(req.user.userId);
    if (!owner) return res.status(403).json({ message: 'Not a business owner' });

    const businesses = await Business.find({ ownerId: owner._id });
    const businessIds = businesses.map(b => b._id);

    const transactions = await Transaction.find({ 
      businessId: { $in: businessIds }
    })
    .populate('businessId', 'name')
    .populate('sellableId', 'title price')
    .populate({
      path: 'customerId',
      populate: {
        path: 'userId',
        select: 'name email'
      }
    })
    .sort({ createdAt: -1 });

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get business analytics/KPIs
exports.getBusinessAnalytics = async (req, res) => {
  try {
    const Transaction = require('../models/transaction.model');
    const owner = await findOwner(req.user.userId);
    if (!owner) return res.status(403).json({ message: 'Not a business owner' });

    const businesses = await Business.find({ ownerId: owner._id });
    const businessIds = businesses.map(b => b._id);

    // Get all transactions for owner's businesses
    const transactions = await Transaction.find({ 
      businessId: { $in: businessIds }
    }).populate('sellableId', 'title price');

    const completedTransactions = transactions.filter(t => t.status === 'completed');

    // Calculate basic metrics
    const totalSales = completedTransactions.length;
    const totalRevenue = completedTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalOrders = transactions.length;

    // Get recent sales (last 5)
    const recentSales = completedTransactions.slice(0, 5);

    // Calculate top products
    const productSales = {};
    completedTransactions.forEach(transaction => {
      const productId = transaction.sellableId?._id?.toString();
      if (productId) {
        if (!productSales[productId]) {
          productSales[productId] = {
            product: transaction.sellableId,
            totalSales: 0,
            totalRevenue: 0
          };
        }
        productSales[productId].totalSales += 1;
        productSales[productId].totalRevenue += transaction.amount;
      }
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    // Mock data for page views and conversion rate (replace with real analytics)
    const pageViews = Math.floor(Math.random() * 1000) + 500;
    const uniqueVisitors = Math.floor(pageViews * 0.7);
    const conversionRate = totalOrders > 0 ? (completedTransactions.length / totalOrders) * 100 : 0;
    const customerRetention = Math.floor(Math.random() * 40) + 60; // Mock retention rate

    // Sales over time (last 7 days)
    const salesOverTime = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const daySales = completedTransactions.filter(t => {
        const transactionDate = new Date(t.createdAt);
        return transactionDate >= dayStart && transactionDate <= dayEnd;
      });

      salesOverTime.push({
        date: dayStart.toISOString().split('T')[0],
        sales: daySales.length,
        revenue: daySales.reduce((sum, t) => sum + t.amount, 0)
      });
    }

    const analytics = {
      totalSales,
      totalRevenue,
      totalOrders,
      recentSales,
      topProducts,
      salesOverTime,
      pageViews,
      uniqueVisitors,
      conversionRate,
      customerRetention
    };

    res.json(analytics);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get analytics for a specific business
exports.getSpecificBusinessAnalytics = async (req, res) => {
  try {
    const { businessId } = req.params;
    const Transaction = require('../models/transaction.model');
    const owner = await findOwner(req.user.userId);
    if (!owner) return res.status(403).json({ message: 'Not a business owner' });

    // Verify the business belongs to the owner
    const business = await Business.findOne({ _id: businessId, ownerId: owner._id });
    if (!business) {
      return res.status(404).json({ message: 'Business not found or not owned by you' });
    }

    // Get all transactions for this specific business
    const transactions = await Transaction.find({ 
      businessId: businessId 
    }).populate('sellableId', 'title price');

    const completedTransactions = transactions.filter(t => t.status === 'completed');

    // Calculate basic metrics
    const totalSales = completedTransactions.length;
    const totalRevenue = completedTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalOrders = transactions.length;

    // Get recent sales (last 5)
    const recentSales = completedTransactions.slice(0, 5);

    // Calculate top products
    const productSales = {};
    completedTransactions.forEach(transaction => {
      const productId = transaction.sellableId?._id?.toString();
      if (productId) {
        if (!productSales[productId]) {
          productSales[productId] = {
            product: transaction.sellableId,
            totalSales: 0,
            totalRevenue: 0
          };
        }
        productSales[productId].totalSales += 1;
        productSales[productId].totalRevenue += transaction.amount;
      }
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    // Mock data for page views and conversion rate (replace with real analytics)
    const pageViews = Math.floor(Math.random() * 300) + 100;
    const uniqueVisitors = Math.floor(pageViews * 0.7);
    const conversionRate = totalOrders > 0 ? (completedTransactions.length / totalOrders) * 100 : 0;
    const customerRetention = Math.floor(Math.random() * 40) + 60; // Mock retention rate

    // Sales over time (last 7 days)
    const salesOverTime = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const daySales = completedTransactions.filter(t => {
        const transactionDate = new Date(t.createdAt);
        return transactionDate >= dayStart && transactionDate <= dayEnd;
      });

      salesOverTime.push({
        date: dayStart.toISOString().split('T')[0],
        sales: daySales.length,
        revenue: daySales.reduce((sum, t) => sum + t.amount, 0)
      });
    }

    const analytics = {
      businessId,
      businessName: business.name,
      totalSales,
      totalRevenue,
      totalOrders,
      recentSales,
      topProducts,
      salesOverTime,
      pageViews,
      uniqueVisitors,
      conversionRate,
      customerRetention
    };

    res.json(analytics);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Request business verification
exports.requestVerification = async (req, res) => {
  try {
    const owner = await findOwner(req.user.userId);
    if (!owner) return res.status(403).json({ message: 'Not a business owner' });

    const { businessId, notes } = req.body;

    // Check if business belongs to the owner
    const business = await Business.findOne({ _id: businessId, ownerId: owner._id });
    if (!business) {
      return res.status(404).json({ message: 'Business not found or not owned by you' });
    }

    // Check if there's already a pending verification request
    const existingRequest = await VerificationRequest.findOne({
      businessId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'A verification request is already pending for this business' });
    }

    // Check if files were uploaded
    if (!req.files || !req.files.personalId || !req.files.businessPermit) {
      return res.status(400).json({ message: 'Both personal ID and business permit files are required' });
    }

    const personalIdUrl = `/uploads/verification/${req.files.personalId[0].filename}`;
    const businessPermitUrl = `/uploads/verification/${req.files.businessPermit[0].filename}`;

    // Create verification request
    const verificationRequest = new VerificationRequest({
      businessId,
      ownerId: owner._id,
      personalIdUrl,
      businessPermitUrl,
      notes: notes || '',
      status: 'pending'
    });

    await verificationRequest.save();

    res.status(201).json({
      message: 'Verification request submitted successfully',
      requestId: verificationRequest._id
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get verification status for a business
exports.getVerificationStatus = async (req, res) => {
  try {
    const owner = await findOwner(req.user.userId);
    if (!owner) return res.status(403).json({ message: 'Not a business owner' });

    const { businessId } = req.params;

    // Check if business belongs to the owner
    const business = await Business.findOne({ _id: businessId, ownerId: owner._id });
    if (!business) {
      return res.status(404).json({ message: 'Business not found or not owned by you' });
    }

    // Get latest verification request for this business
    const verificationRequest = await VerificationRequest.findOne({
      businessId,
      ownerId: owner._id
    }).sort({ createdAt: -1 });

    if (!verificationRequest) {
      return res.status(404).json({ message: 'No verification request found for this business' });
    }

    res.json(verificationRequest);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get analytics for a specific business
exports.getSpecificBusinessAnalytics = async (req, res) => {
  try {
    const { businessId } = req.params;
    const Transaction = require('../models/transaction.model');
    const owner = await findOwner(req.user.userId);
    if (!owner) return res.status(403).json({ message: 'Not a business owner' });

    // Verify the business belongs to the owner
    const business = await Business.findOne({ _id: businessId, ownerId: owner._id });
    if (!business) {
      return res.status(404).json({ message: 'Business not found or not owned by you' });
    }

    // Get all transactions for this specific business
    const transactions = await Transaction.find({ 
      businessId: businessId 
    }).populate('sellableId', 'title price');

    const completedTransactions = transactions.filter(t => t.status === 'completed');

    // Calculate basic metrics
    const totalSales = completedTransactions.length;
    const totalRevenue = completedTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalOrders = transactions.length;

    // Get recent sales (last 5)
    const recentSales = completedTransactions.slice(0, 5);

    // Calculate top products
    const productSales = {};
    completedTransactions.forEach(transaction => {
      const productId = transaction.sellableId?._id?.toString();
      if (productId) {
        if (!productSales[productId]) {
          productSales[productId] = {
            product: transaction.sellableId,
            totalSales: 0,
            totalRevenue: 0
          };
        }
        productSales[productId].totalSales += 1;
        productSales[productId].totalRevenue += transaction.amount;
      }
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    // Mock data for page views and conversion rate (replace with real analytics)
    const pageViews = Math.floor(Math.random() * 300) + 100;
    const uniqueVisitors = Math.floor(pageViews * 0.7);
    const conversionRate = totalOrders > 0 ? (completedTransactions.length / totalOrders) * 100 : 0;
    const customerRetention = Math.floor(Math.random() * 40) + 60; // Mock retention rate

    // Sales over time (last 7 days)
    const salesOverTime = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const daySales = completedTransactions.filter(t => {
        const transactionDate = new Date(t.createdAt);
        return transactionDate >= dayStart && transactionDate <= dayEnd;
      });

      salesOverTime.push({
        date: dayStart.toISOString().split('T')[0],
        sales: daySales.length,
        revenue: daySales.reduce((sum, t) => sum + t.amount, 0)
      });
    }

    const analytics = {
      businessId,
      businessName: business.name,
      totalSales,
      totalRevenue,
      totalOrders,
      recentSales,
      topProducts,
      salesOverTime,
      pageViews,
      uniqueVisitors,
      conversionRate,
      customerRetention
    };

    res.json(analytics);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Export multer upload middleware
exports.uploadVerificationDocs = upload.fields([
  { name: 'personalId', maxCount: 1 },
  { name: 'businessPermit', maxCount: 1 }
]);
