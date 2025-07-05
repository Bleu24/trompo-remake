const Business = require('../models/business.model');
const Sellable = require('../models/sellable.model');
const User = require('../models/user.model');
const Category = require('../models/category.model');
const Location = require('../models/location.model');

exports.globalSearch = async (req, res) => {
  try {
    const { 
      q, // search query
      type, // 'business', 'product', 'service', 'all'
      location,
      category,
      priceMin,
      priceMax,
      rating,
      page = 1,
      limit = 20,
      sortBy = 'relevance' // 'relevance', 'price', 'rating', 'newest'
    } = req.query;

    const searchResults = {
      businesses: [],
      products: [],
      services: [],
      totalResults: 0
    };

    // Base search conditions
    const searchConditions = {};
    if (q) {
      searchConditions.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { title: { $regex: q, $options: 'i' } }
      ];
    }

    // Location filter
    let locationFilter = {};
    if (location) {
      const locationDoc = await Location.findOne({ 
        name: { $regex: location, $options: 'i' } 
      });
      if (locationDoc) {
        locationFilter = { locationId: locationDoc._id };
      }
    }

    // Category filter
    let categoryFilter = {};
    if (category) {
      const categoryDoc = await Category.findOne({ 
        name: { $regex: category, $options: 'i' } 
      });
      if (categoryDoc) {
        categoryFilter = { categoryId: categoryDoc._id };
      }
    }

    // Price filter
    let priceFilter = {};
    if (priceMin || priceMax) {
      priceFilter.price = {};
      if (priceMin) priceFilter.price.$gte = parseFloat(priceMin);
      if (priceMax) priceFilter.price.$lte = parseFloat(priceMax);
    }

    // Search businesses
    if (type === 'business' || type === 'all') {
      const businessQuery = {
        ...searchConditions,
        ...locationFilter,
        ...categoryFilter,
        isVerified: true
      };

      let businessSort = {};
      switch (sortBy) {
        case 'rating':
          businessSort = { averageRating: -1 };
          break;
        case 'newest':
          businessSort = { createdAt: -1 };
          break;
        default:
          businessSort = { _id: 1 }; // Default sort
      }

      const businesses = await Business.find(businessQuery)
        .populate('categoryId', 'name')
        .populate('locationId', 'name')
        .populate('ownerId', 'userId')
        .sort(businessSort)
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

      searchResults.businesses = businesses;
    }

    // Search products/services
    if (type === 'product' || type === 'service' || type === 'all') {
      const sellableQuery = {
        ...searchConditions,
        ...priceFilter
      };

      if (type === 'product') sellableQuery.type = 'product';
      if (type === 'service') sellableQuery.type = 'service';

      let sellableSort = {};
      switch (sortBy) {
        case 'price':
          sellableSort = { price: 1 };
          break;
        case 'newest':
          sellableSort = { createdAt: -1 };
          break;
        default:
          sellableSort = { _id: 1 };
      }

      const sellables = await Sellable.find(sellableQuery)
        .populate({
          path: 'businessId',
          select: 'name description locationId categoryId isVerified',
          populate: [
            { path: 'locationId', select: 'name' },
            { path: 'categoryId', select: 'name' }
          ]
        })
        .sort(sellableSort)
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

      // Separate products and services
      searchResults.products = sellables.filter(s => s.type === 'product');
      searchResults.services = sellables.filter(s => s.type === 'service');
    }

    // Calculate total results
    searchResults.totalResults = 
      searchResults.businesses.length + 
      searchResults.products.length + 
      searchResults.services.length;

    res.json({
      success: true,
      data: searchResults,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalResults: searchResults.totalResults
      },
      filters: {
        query: q,
        type,
        location,
        category,
        priceRange: { min: priceMin, max: priceMax },
        sortBy
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Search failed', 
      error: error.message 
    });
  }
};

// Get search suggestions (autocomplete)
exports.getSearchSuggestions = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }

    const [businesses, products, services] = await Promise.all([
      Business.find({ 
        name: { $regex: q, $options: 'i' },
        isVerified: true 
      }).select('name').limit(5),
      
      Sellable.find({ 
        title: { $regex: q, $options: 'i' },
        type: 'product' 
      }).select('title').limit(5),
      
      Sellable.find({ 
        title: { $regex: q, $options: 'i' },
        type: 'service' 
      }).select('title').limit(5)
    ]);

    const suggestions = [
      ...businesses.map(b => ({ text: b.name, type: 'business' })),
      ...products.map(p => ({ text: p.title, type: 'product' })),
      ...services.map(s => ({ text: s.title, type: 'service' }))
    ];

    res.json({ suggestions });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get suggestions' });
  }
};