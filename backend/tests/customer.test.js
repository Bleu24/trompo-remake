const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/user.model');
const Business = require('../models/business.model');
const Category = require('../models/category.model');
const Location = require('../models/location.model');
const SavedBusiness = require('../models/savedBusiness.model');
const CustomerVerification = require('../models/customerVerification.model');
const jwt = require('jsonwebtoken');

describe('Customer API', () => {
  let customerToken, ownerToken, adminToken;
  let customerId, ownerId, adminId;
  let categoryId, locationId, businessId;

  // Clean database before tests
  beforeAll(async () => {
    await User.deleteMany({});
    await Business.deleteMany({});
    await Category.deleteMany({});
    await Location.deleteMany({});
    await SavedBusiness.deleteMany({});
    await CustomerVerification.deleteMany({});
  }, 10000);

  beforeAll(async () => {
    // Connect to test DB
    await mongoose.connect(process.env.MONGO_URI);

    // Create test users
    const customer = new User({ 
      name: 'Test Customer', 
      email: 'customer@test.com', 
      password: 'hashed', 
      role: 'customer',
      isVerified: false
    });
    await customer.save();
    customerId = customer._id;

    const owner = new User({ 
      name: 'Test Owner', 
      email: 'owner@test.com', 
      password: 'hashed', 
      role: 'owner' 
    });
    await owner.save();
    ownerId = owner._id;

    const admin = new User({ 
      name: 'Test Admin', 
      email: 'admin@test.com', 
      password: 'hashed', 
      role: 'admin' 
    });
    await admin.save();
    adminId = admin._id;

    // Generate JWT tokens
    customerToken = jwt.sign({ userId: customerId, role: 'customer' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    ownerToken = jwt.sign({ userId: ownerId, role: 'owner' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    adminToken = jwt.sign({ userId: adminId, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Create test category and location
    const category = new Category({ name: 'Food' });
    await category.save();
    categoryId = category._id;

    const location = new Location({ name: 'Metro Manila' });
    await location.save();
    locationId = location._id;

    // Create test business
    const business = new Business({
      name: 'Test Restaurant',
      description: 'A test restaurant',
      ownerId,
      categoryId,
      locationId
    });
    await business.save();
    businessId = business._id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // Test customer verification submission
  describe('POST /api/customer/verification', () => {
    it('should submit verification request successfully', async () => {
      const verificationData = {
        documents: ['document1.jpg', 'document2.jpg', 'selfie.jpg']
      };

      const response = await request(app)
        .post('/api/customer/verification')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(verificationData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Verification request submitted successfully');
      expect(response.body.request.documents).toEqual(verificationData.documents);
      expect(response.body.request.status).toBe('pending');
    });

    it('should fail when submitting verification without authentication', async () => {
      const verificationData = {
        documents: ['document1.jpg']
      };

      const response = await request(app)
        .post('/api/customer/verification')
        .send(verificationData);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Missing token');
    });

    it('should fail when non-customer tries to submit verification', async () => {
      const verificationData = {
        documents: ['document1.jpg']
      };

      const response = await request(app)
        .post('/api/customer/verification')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(verificationData);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Only customers can submit account verification');
    });

    it('should fail when submitting verification without documents', async () => {
      const response = await request(app)
        .post('/api/customer/verification')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('At least one document is required for verification');
    });

    it('should fail when submitting duplicate verification request', async () => {
      const verificationData = {
        documents: ['document1.jpg']
      };

      const response = await request(app)
        .post('/api/customer/verification')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(verificationData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('You already have a pending verification request');
    });
  });

  // Test getting verification status
  describe('GET /api/customer/verification/status', () => {
    it('should get verification status successfully', async () => {
      const response = await request(app)
        .get('/api/customer/verification/status')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.isVerified).toBe(false);
      expect(response.body.verificationRequest).toBeTruthy();
      expect(response.body.verificationRequest.status).toBe('pending');
    });

    it('should fail when getting verification status without authentication', async () => {
      const response = await request(app)
        .get('/api/customer/verification/status');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Missing token');
    });

    it('should fail when non-customer tries to get verification status', async () => {
      const response = await request(app)
        .get('/api/customer/verification/status')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied');
    });
  });

  // Test saving a business
  describe('POST /api/customer/saved-businesses', () => {
    it('should save a business successfully', async () => {
      const saveData = {
        businessId: businessId.toString()
      };

      const response = await request(app)
        .post('/api/customer/saved-businesses')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(saveData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Business saved successfully');
      expect(response.body.savedBusiness.businessId._id).toBe(businessId.toString());
    });

    it('should fail when saving business without authentication', async () => {
      const saveData = {
        businessId: businessId.toString()
      };

      const response = await request(app)
        .post('/api/customer/saved-businesses')
        .send(saveData);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Missing token');
    });

    it('should fail when non-customer tries to save business', async () => {
      const saveData = {
        businessId: businessId.toString()
      };

      const response = await request(app)
        .post('/api/customer/saved-businesses')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(saveData);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Only customers can save businesses');
    });

    it('should fail when saving non-existent business', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const saveData = {
        businessId: fakeId.toString()
      };

      const response = await request(app)
        .post('/api/customer/saved-businesses')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(saveData);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Business not found');
    });

    it('should fail when saving already saved business', async () => {
      const saveData = {
        businessId: businessId.toString()
      };

      const response = await request(app)
        .post('/api/customer/saved-businesses')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(saveData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Business already saved');
    });
  });

  // Test getting saved businesses
  describe('GET /api/customer/saved-businesses', () => {
    it('should get saved businesses successfully', async () => {
      const response = await request(app)
        .get('/api/customer/saved-businesses')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].businessId._id).toBe(businessId.toString());
    });

    it('should fail when getting saved businesses without authentication', async () => {
      const response = await request(app)
        .get('/api/customer/saved-businesses');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Missing token');
    });

    it('should fail when non-customer tries to get saved businesses', async () => {
      const response = await request(app)
        .get('/api/customer/saved-businesses')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Only customers can view saved businesses');
    });
  });

  // Test unsaving a business
  describe('DELETE /api/customer/saved-businesses/:businessId', () => {
    it('should unsave a business successfully', async () => {
      const response = await request(app)
        .delete(`/api/customer/saved-businesses/${businessId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Business removed from saved list successfully');
    });

    it('should fail when unsaving business without authentication', async () => {
      const response = await request(app)
        .delete(`/api/customer/saved-businesses/${businessId}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Missing token');
    });

    it('should fail when non-customer tries to unsave business', async () => {
      const response = await request(app)
        .delete(`/api/customer/saved-businesses/${businessId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Only customers can unsave businesses');
    });

    it('should return 404 when unsaving non-saved business', async () => {
      const response = await request(app)
        .delete(`/api/customer/saved-businesses/${businessId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Saved business not found');
    });
  });
});
