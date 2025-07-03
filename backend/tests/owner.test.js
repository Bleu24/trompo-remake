const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/user.model');
const Business = require('../models/business.model');
const Category = require('../models/category.model');
const Location = require('../models/location.model');
const BusinessOwner = require('../models/businessOwner.model');
const jwt = require('jsonwebtoken');

describe('Owner API', () => {
  let ownerToken, customerToken, adminToken;
  let ownerId, customerId, adminId;
  let categoryId, locationId;
  let businessId1, businessId2;

  // Clean database before tests
  beforeAll(async () => {
    await User.deleteMany({});
    await Business.deleteMany({});
    await Category.deleteMany({});
    await Location.deleteMany({});
    await BusinessOwner.deleteMany({});
  }, 10000);

  beforeAll(async () => {
    // Connect to test DB
    await mongoose.connect(process.env.MONGO_URI);

    // Create test users
    const owner = new User({ 
      name: 'Test Owner', 
      email: 'owner@test.com', 
      password: 'hashed', 
      role: 'owner' 
    });
    await owner.save();
    ownerId = owner._id;

    const customer = new User({ 
      name: 'Test Customer', 
      email: 'customer@test.com', 
      password: 'hashed', 
      role: 'customer' 
    });
    await customer.save();
    customerId = customer._id;

    const admin = new User({ 
      name: 'Test Admin', 
      email: 'admin@test.com', 
      password: 'hashed', 
      role: 'admin' 
    });
    await admin.save();
    adminId = admin._id;

    // Generate JWT tokens
    ownerToken = jwt.sign({ userId: ownerId, role: 'owner' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    customerToken = jwt.sign({ userId: customerId, role: 'customer' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    adminToken = jwt.sign({ userId: adminId, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Create test category and location
    const category = new Category({ name: 'Food' });
    await category.save();
    categoryId = category._id;

    const location = new Location({ name: 'Metro Manila' });
    await location.save();
    locationId = location._id;

    // Create test businesses for the owner
    const business1 = new Business({
      name: 'Test Restaurant 1',
      description: 'First test restaurant',
      ownerId,
      categoryId,
      locationId,
      isVerified: true
    });
    await business1.save();
    businessId1 = business1._id;

    const business2 = new Business({
      name: 'Test Restaurant 2',
      description: 'Second test restaurant',
      ownerId,
      categoryId,
      locationId,
      isVerified: false
    });
    await business2.save();
    businessId2 = business2._id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // Test getting owned businesses
  describe('GET /api/owner/businesses', () => {
    it('should get owned businesses successfully', async () => {
      const response = await request(app)
        .get('/api/owner/businesses')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      
      // Check if businesses belong to the owner
      response.body.forEach(business => {
        expect(business.ownerId).toBe(ownerId.toString());
      });

      // Check if businesses are sorted by creation date (newest first)
      expect(response.body[0].name).toBe('Test Restaurant 2');
      expect(response.body[1].name).toBe('Test Restaurant 1');
    });

    it('should include populated category and location data', async () => {
      const response = await request(app)
        .get('/api/owner/businesses')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(200);
      expect(response.body[0].categoryId.name).toBe('Food');
      expect(response.body[0].locationId.name).toBe('Metro Manila');
    });

    it('should fail when getting owned businesses without authentication', async () => {
      const response = await request(app)
        .get('/api/owner/businesses');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Missing token');
    });

    it('should fail when non-owner tries to get owned businesses', async () => {
      const response = await request(app)
        .get('/api/owner/businesses')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Only business owners can view owned businesses');
    });

    it('should return empty array for owner with no businesses', async () => {
      // Create a new owner with no businesses
      const newOwner = new User({ 
        name: 'New Owner', 
        email: 'newowner@test.com', 
        password: 'hashed', 
        role: 'owner' 
      });
      await newOwner.save();

      const newOwnerToken = jwt.sign({ userId: newOwner._id, role: 'owner' }, process.env.JWT_SECRET, { expiresIn: '1h' });

      const response = await request(app)
        .get('/api/owner/businesses')
        .set('Authorization', `Bearer ${newOwnerToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  // Test getting business statistics
  describe('GET /api/owner/stats', () => {
    it('should get business statistics successfully', async () => {
      const response = await request(app)
        .get('/api/owner/stats')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.totalBusinesses).toBe(2);
      expect(response.body.verifiedBusinesses).toBe(1);
      expect(response.body.unverifiedBusinesses).toBe(1);
    });

    it('should fail when getting stats without authentication', async () => {
      const response = await request(app)
        .get('/api/owner/stats');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Missing token');
    });

    it('should fail when non-owner tries to get business stats', async () => {
      const response = await request(app)
        .get('/api/owner/stats')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Only business owners can view business statistics');
    });

    it('should return zero stats for owner with no businesses', async () => {
      // Create a new owner with no businesses
      const newOwner = new User({ 
        name: 'Stats Owner', 
        email: 'statsowner@test.com', 
        password: 'hashed', 
        role: 'owner' 
      });
      await newOwner.save();

      const newOwnerToken = jwt.sign({ userId: newOwner._id, role: 'owner' }, process.env.JWT_SECRET, { expiresIn: '1h' });

      const response = await request(app)
        .get('/api/owner/stats')
        .set('Authorization', `Bearer ${newOwnerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.totalBusinesses).toBe(0);
      expect(response.body.verifiedBusinesses).toBe(0);
      expect(response.body.unverifiedBusinesses).toBe(0);
    });
  });

  // Test owner registration (existing functionality)
  describe('POST /api/owner/register', () => {
    it('should register customer as owner successfully', async () => {
      const response = await request(app)
        .post('/api/owner/register')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Business owner registered');
      expect(response.body.owner.userId).toBe(customerId.toString());

      // Verify role was updated in User model
      const updatedUser = await User.findById(customerId);
      expect(updatedUser.role).toBe('owner');
    });

    it('should fail when registering without authentication', async () => {
      const response = await request(app)
        .post('/api/owner/register');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Missing token');
    });

    it('should fail when already a business owner', async () => {
      const response = await request(app)
        .post('/api/owner/register')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Already a business owner');
    });
  });

  // Test getting owner profile (existing functionality)
  describe('GET /api/owner/me', () => {
    it('should get owner profile successfully', async () => {
      const response = await request(app)
        .get('/api/owner/me')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.userId._id).toBe(ownerId.toString());
      expect(response.body.userId.role).toBe('owner');
    });

    it('should fail when getting profile without authentication', async () => {
      const response = await request(app)
        .get('/api/owner/me');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Missing token');
    });

    it('should fail when non-owner tries to get owner profile', async () => {
      // Create a customer token
      const customerUser = new User({ 
        name: 'Profile Customer', 
        email: 'profilecustomer@test.com', 
        password: 'hashed', 
        role: 'customer' 
      });
      await customerUser.save();

      const customerProfileToken = jwt.sign({ userId: customerUser._id, role: 'customer' }, process.env.JWT_SECRET, { expiresIn: '1h' });

      const response = await request(app)
        .get('/api/owner/me')
        .set('Authorization', `Bearer ${customerProfileToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Not a business owner');
    });
  });
});
