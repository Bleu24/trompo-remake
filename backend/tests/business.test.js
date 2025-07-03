const request = require('supertest');
const app = require('../server'); // Path to your Express app
const mongoose = require('mongoose');
const User = require('../models/user.model');
const Business = require('../models/business.model');
const Category = require('../models/category.model');
const Location = require('../models/location.model');
const VerificationRequest = require('../models/verificationRequest.model');
const jwt = require('jsonwebtoken');

describe('Business API', () => {
  let token, adminToken, userId, adminUserId, categoryId, locationId, businessId;

// Clean database before tests
beforeAll(async () => {
    await User.deleteMany({});
    await Business.deleteMany({});
    await Category.deleteMany({});
    await Location.deleteMany({});
}, 10000); // Added timeout in case deletion takes time

  beforeAll(async () => {
    // Connect to test DB (optional if already connected)
    await mongoose.connect(process.env.MONGO_URI);

    // Create a mock user (owner)
    const user = new User({ name: 'Test Owner', email: 'owner@test.com', password: 'hashed', role: 'owner' });
    await user.save();
    userId = user._id;

    // Create a mock admin user
    const adminUser = new User({ name: 'Test Admin', email: 'admin@test.com', password: 'hashed', role: 'admin' });
    await adminUser.save();
    adminUserId = adminUser._id;

    // Generate JWT manually
    token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    adminToken = jwt.sign({ userId: adminUser._id, role: adminUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Create dummy category and location
    const category = new Category({ name: 'Food' });
    await category.save();
    categoryId = category._id;

    const location = new Location({ name: 'Metro Manila' });
    await location.save();
    locationId = location._id;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Business.deleteMany({});
    await Category.deleteMany({});
    await Location.deleteMany({});
    await VerificationRequest.deleteMany({});
    await mongoose.connection.close();
  });

  it('should create a new business', async () => {
    const res = await request(app)
      .post('/api/businesses/')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Async Studio',
        description: 'Software Solutions',
        categoryId: categoryId.toString(),
        locationId: locationId.toString(),
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('business');
    expect(res.body.business.name).toBe('Async Studio');
    businessId = res.body.business._id; // Store for later tests
  });

  it('should get all businesses', async () => {
    const res = await request(app).get('/api/businesses/');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should get a business by ID', async () => {
    const res = await request(app).get(`/api/businesses/${businessId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('name', 'Async Studio');
  });

  it('should update a business (owner only)', async () => {
    const res = await request(app)
      .put(`/api/businesses/${businessId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Async Studio Updated',
        description: 'Updated Software Solutions',
        categoryId: categoryId.toString(),
        locationId: locationId.toString(),
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Business updated successfully');
    expect(res.body.business.name).toBe('Async Studio Updated');
  });

  it('should not allow non-owner to update business', async () => {
    // Create another user
    const otherUser = new User({ name: 'Other User', email: 'other@test.com', password: 'hashed', role: 'owner' });
    await otherUser.save();
    const otherToken = jwt.sign({ userId: otherUser._id, role: otherUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const res = await request(app)
      .put(`/api/businesses/${businessId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({
        name: 'Unauthorized Update',
        description: 'Should not work',
      });

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty('message', 'Not authorized to update this business');
  });

  it('should allow admin to update business', async () => {
    const res = await request(app)
      .put(`/api/businesses/admin/${businessId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Admin Updated Business',
        description: 'Updated by admin',
        isVerified: true,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Business updated by admin');
    expect(res.body.business.name).toBe('Admin Updated Business');
  });

  it('should not allow non-admin to use admin update', async () => {
    const res = await request(app)
      .put(`/api/businesses/admin/${businessId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Should not work',
      });

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty('message', 'Admin access required');
  });

  it('should filter businesses by location', async () => {
    const res = await request(app).get(`/api/businesses/location/${locationId}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].locationId._id).toBe(locationId.toString());
  });

  it('should filter businesses by category', async () => {
    const res = await request(app).get(`/api/businesses/category/${categoryId}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].categoryId._id).toBe(categoryId.toString());
  });

  it('should submit business verification', async () => {
    const res = await request(app)
      .post('/api/businesses/verification')
      .set('Authorization', `Bearer ${token}`)
      .send({
        businessId: businessId,
        documents: ['document1.pdf', 'document2.pdf'],
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message', 'Verification request submitted');
    expect(res.body.verificationRequest).toHaveProperty('businessId', businessId);
  });

  it('should not allow duplicate verification requests', async () => {
    const res = await request(app)
      .post('/api/businesses/verification')
      .set('Authorization', `Bearer ${token}`)
      .send({
        businessId: businessId,
        documents: ['document1.pdf'],
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'Verification request already submitted');
  });

  it('should delete a business (owner only)', async () => {
    const res = await request(app)
      .delete(`/api/businesses/${businessId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Business deleted successfully');
  });

  it('should return 404 when trying to get deleted business', async () => {
    const res = await request(app).get(`/api/businesses/${businessId}`);
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('message', 'Business not found');
  });

  it('should not allow non-owner to delete business', async () => {
    // Create a new business first
    const createRes = await request(app)
      .post('/api/businesses/')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Business for Delete',
        description: 'Test',
        categoryId: categoryId.toString(),
        locationId: locationId.toString(),
      });

    const newBusinessId = createRes.body.business._id;

    // Create another user and try to delete
    const otherUser = new User({ name: 'Other User 2', email: 'other2@test.com', password: 'hashed', role: 'owner' });
    await otherUser.save();
    const otherToken = jwt.sign({ userId: otherUser._id, role: otherUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const res = await request(app)
      .delete(`/api/businesses/${newBusinessId}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty('message', 'Not authorized to delete this business');
  });
});
