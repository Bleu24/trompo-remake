const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/user.model');
const Business = require('../models/business.model');
const Sellable = require('../models/sellable.model');
const Category = require('../models/category.model');
const Location = require('../models/location.model');
const BusinessOwner = require('../models/businessOwner.model');
const jwt = require('jsonwebtoken');

describe('Search API', () => {
  let token, userId, categoryId, locationId, businessId, ownerId;

  // Clean database before tests
  beforeAll(async () => {
    await User.deleteMany({});
    await Business.deleteMany({});
    await Sellable.deleteMany({});
    await Category.deleteMany({});
    await Location.deleteMany({});
    await BusinessOwner.deleteMany({});
  }, 10000);

  beforeAll(async () => {
    // Connect to test DB
    await mongoose.connect(process.env.MONGO_URI);

    // Create mock user
    const user = new User({ 
      name: 'Test Owner', 
      email: 'owner@test.com', 
      password: 'hashed', 
      role: 'owner' 
    });
    await user.save();
    userId = user._id;

    // Create business owner
    const businessOwner = new BusinessOwner({ 
      userId: userId, 
      verified: true 
    });
    await businessOwner.save();
    ownerId = businessOwner._id;

    // Generate JWT token
    token = jwt.sign(
      { userId: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );

    // Create test categories
    const foodCategory = new Category({ name: 'Food' });
    const techCategory = new Category({ name: 'Technology' });
    await foodCategory.save();
    await techCategory.save();
    categoryId = foodCategory._id;

    // Create test locations
    const manilaLocation = new Location({ name: 'Metro Manila' });
    const cebuLocation = new Location({ name: 'Cebu' });
    await manilaLocation.save();
    await cebuLocation.save();
    locationId = manilaLocation._id;

    // Create test businesses
    const business1 = new Business({
      name: 'Trompo Bistro',
      description: 'Authentic tacos and Mexican food',
      ownerId: ownerId,
      categoryId: foodCategory._id,
      locationId: manilaLocation._id,
      isVerified: true
    });

    const business2 = new Business({
      name: 'Tech Solutions',
      description: 'Software development and IT services',
      ownerId: ownerId,
      categoryId: techCategory._id,
      locationId: cebuLocation._id,
      isVerified: true
    });

    const business3 = new Business({
      name: 'Pizza Palace',
      description: 'Best pizza in town',
      ownerId: ownerId,
      categoryId: foodCategory._id,
      locationId: manilaLocation._id,
      isVerified: true
    });

    await business1.save();
    await business2.save();
    await business3.save();
    businessId = business1._id;

    // Create test products and services
    const product1 = new Sellable({
      businessId: business1._id,
      title: 'Trompo Taco',
      description: 'Delicious pork taco with spices',
      type: 'product',
      price: 3.50,
      inventory: 100
    });

    const product2 = new Sellable({
      businessId: business3._id,
      title: 'Margherita Pizza',
      description: 'Classic Italian pizza with fresh basil',
      type: 'product',
      price: 12.99,
      inventory: 50
    });

    const service1 = new Sellable({
      businessId: business1._id,
      title: 'Taco Catering Service',
      description: 'On-site taco catering for events',
      type: 'service',
      price: 150.00
    });

    const service2 = new Sellable({
      businessId: business2._id,
      title: 'Web Development',
      description: 'Custom website development services',
      type: 'service',
      price: 500.00
    });

    await product1.save();
    await product2.save();
    await service1.save();
    await service2.save();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Business.deleteMany({});
    await Sellable.deleteMany({});
    await Category.deleteMany({});
    await Location.deleteMany({});
    await BusinessOwner.deleteMany({});
    await mongoose.connection.close();
  });

  describe('GET /api/search', () => {
    it('should return all results when no query is provided', async () => {
      const res = await request(app)
        .get('/api/search')
        .query({});

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('businesses');
      expect(res.body.data).toHaveProperty('products');
      expect(res.body.data).toHaveProperty('services');
      expect(res.body.data.totalResults).toBeGreaterThan(0);
    });

    it('should search businesses by name', async () => {
      const res = await request(app)
        .get('/api/search')
        .query({ q: 'Trompo', type: 'business' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.businesses).toHaveLength(1);
      expect(res.body.data.businesses[0].name).toBe('Trompo Bistro');
      expect(res.body.data.products).toHaveLength(0);
      expect(res.body.data.services).toHaveLength(0);
    });

    it('should search businesses by description', async () => {
      const res = await request(app)
        .get('/api/search')
        .query({ q: 'Mexican', type: 'business' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.businesses).toHaveLength(1);
      expect(res.body.data.businesses[0].name).toBe('Trompo Bistro');
    });

    it('should search products by title', async () => {
      const res = await request(app)
        .get('/api/search')
        .query({ q: 'Taco', type: 'product' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.products).toHaveLength(1);
      expect(res.body.data.products[0].title).toBe('Trompo Taco');
      expect(res.body.data.businesses).toHaveLength(0);
      expect(res.body.data.services).toHaveLength(0);
    });

    it('should search services by title', async () => {
      const res = await request(app)
        .get('/api/search')
        .query({ q: 'Catering', type: 'service' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.services).toHaveLength(1);
      expect(res.body.data.services[0].title).toBe('Taco Catering Service');
      expect(res.body.data.businesses).toHaveLength(0);
      expect(res.body.data.products).toHaveLength(0);
    });

    it('should search all types when type is "all"', async () => {
      const res = await request(app)
        .get('/api/search')
        .query({ q: 'Taco', type: 'all' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalResults).toBeGreaterThan(0);
      // Should find both the business and the product/service containing "Taco"
      expect(res.body.data.businesses.length + res.body.data.products.length + res.body.data.services.length).toBeGreaterThan(1);
    });

    it('should filter by price range', async () => {
      const res = await request(app)
        .get('/api/search')
        .query({ 
          q: 'Taco', 
          type: 'product',
          priceMin: 2,
          priceMax: 5
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.products).toHaveLength(1);
      expect(res.body.data.products[0].price).toBeGreaterThanOrEqual(2);
      expect(res.body.data.products[0].price).toBeLessThanOrEqual(5);
    });

    it('should filter by price range and exclude expensive items', async () => {
      const res = await request(app)
        .get('/api/search')
        .query({ 
          type: 'product',
          priceMin: 1,
          priceMax: 5
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      res.body.data.products.forEach(product => {
        expect(product.price).toBeGreaterThanOrEqual(1);
        expect(product.price).toBeLessThanOrEqual(5);
      });
    });

    it('should sort products by price ascending', async () => {
      const res = await request(app)
        .get('/api/search')
        .query({ 
          type: 'product',
          sortBy: 'price'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      
      if (res.body.data.products.length > 1) {
        const prices = res.body.data.products.map(p => p.price);
        const sortedPrices = [...prices].sort((a, b) => a - b);
        expect(prices).toEqual(sortedPrices);
      }
    });

    it('should sort by newest first', async () => {
      const res = await request(app)
        .get('/api/search')
        .query({ 
          type: 'business',
          sortBy: 'newest'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.businesses.length).toBeGreaterThan(0);
    });

    it('should handle pagination', async () => {
      const res = await request(app)
        .get('/api/search')
        .query({ 
          type: 'all',
          page: 1,
          limit: 2
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(2);
    });

    it('should return empty results for non-existent search term', async () => {
      const res = await request(app)
        .get('/api/search')
        .query({ q: 'nonexistentterm12345' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalResults).toBe(0);
      expect(res.body.data.businesses).toHaveLength(0);
      expect(res.body.data.products).toHaveLength(0);
      expect(res.body.data.services).toHaveLength(0);
    });

    it('should be case insensitive', async () => {
      const res = await request(app)
        .get('/api/search')
        .query({ q: 'TACO', type: 'product' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.products).toHaveLength(1);
      expect(res.body.data.products[0].title).toBe('Trompo Taco');
    });

    it('should handle partial matches', async () => {
      const res = await request(app)
        .get('/api/search')
        .query({ q: 'Trom', type: 'business' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.businesses).toHaveLength(1);
      expect(res.body.data.businesses[0].name).toBe('Trompo Bistro');
    });
  });

  describe('GET /api/search/suggestions', () => {
    it('should return suggestions for valid query', async () => {
      const res = await request(app)
        .get('/api/search/suggestions')
        .query({ q: 'Ta' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('suggestions');
      expect(Array.isArray(res.body.suggestions)).toBe(true);
      
      if (res.body.suggestions.length > 0) {
        expect(res.body.suggestions[0]).toHaveProperty('text');
        expect(res.body.suggestions[0]).toHaveProperty('type');
        expect(['business', 'product', 'service']).toContain(res.body.suggestions[0].type);
      }
    });

    it('should return empty suggestions for query less than 2 characters', async () => {
      const res = await request(app)
        .get('/api/search/suggestions')
        .query({ q: 'T' });

      expect(res.statusCode).toBe(200);
      expect(res.body.suggestions).toHaveLength(0);
    });

    it('should return empty suggestions for no query', async () => {
      const res = await request(app)
        .get('/api/search/suggestions')
        .query({});

      expect(res.statusCode).toBe(200);
      expect(res.body.suggestions).toHaveLength(0);
    });

    it('should limit suggestions to 5 per type', async () => {
      const res = await request(app)
        .get('/api/search/suggestions')
        .query({ q: 'a' }); // Very broad search

      expect(res.statusCode).toBe(200);
      expect(res.body.suggestions.length).toBeLessThanOrEqual(15); // 5 per type * 3 types
    });

    it('should return case insensitive suggestions', async () => {
      const res = await request(app)
        .get('/api/search/suggestions')
        .query({ q: 'taco' });

      expect(res.statusCode).toBe(200);
      expect(res.body.suggestions.length).toBeGreaterThanOrEqual(1);
      
      const tacoSuggestions = res.body.suggestions.filter(s => 
        s.text.toLowerCase().includes('taco')
      );
      expect(tacoSuggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Error handling', () => {
    it('should handle invalid price range gracefully', async () => {
      const res = await request(app)
        .get('/api/search')
        .query({ 
          priceMin: 'invalid',
          priceMax: 'invalid'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      // Should still return results, just ignore invalid price filters
    });

    it('should handle invalid pagination values', async () => {
      const res = await request(app)
        .get('/api/search')
        .query({ 
          page: 'invalid',
          limit: 'invalid'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      // Should default to page 1, limit 20
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(20);
    });
  });
});
