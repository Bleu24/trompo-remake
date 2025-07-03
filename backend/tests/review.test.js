const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/user.model');
const Business = require('../models/business.model');
const Category = require('../models/category.model');
const Location = require('../models/location.model');
const Review = require('../models/review.model');
const jwt = require('jsonwebtoken');

describe('Review API', () => {
  let customerToken, ownerToken, adminToken, otherCustomerToken;
  let customerId, ownerId, adminId, otherCustomerId;
  let categoryId, locationId, businessId, otherBusinessId;
  let reviewId;

  // Clean database before tests
  beforeAll(async () => {
    await User.deleteMany({});
    await Business.deleteMany({});
    await Category.deleteMany({});
    await Location.deleteMany({});
    await Review.deleteMany({});
  }, 10000);

  beforeAll(async () => {
    // Connect to test DB
    await mongoose.connect(process.env.MONGO_URI);

    // Create test users
    const customer = new User({ 
      name: 'Test Customer', 
      email: 'customer@test.com', 
      password: 'hashed', 
      role: 'customer' 
    });
    await customer.save();
    customerId = customer._id;

    const otherCustomer = new User({ 
      name: 'Other Customer', 
      email: 'other@test.com', 
      password: 'hashed', 
      role: 'customer' 
    });
    await otherCustomer.save();
    otherCustomerId = otherCustomer._id;

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
    otherCustomerToken = jwt.sign({ userId: otherCustomerId, role: 'customer' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    ownerToken = jwt.sign({ userId: ownerId, role: 'owner' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    adminToken = jwt.sign({ userId: adminId, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Create test category and location
    const category = new Category({ name: 'Food' });
    await category.save();
    categoryId = category._id;

    const location = new Location({ name: 'Metro Manila' });
    await location.save();
    locationId = location._id;

    // Create test businesses
    const business = new Business({
      name: 'Test Restaurant',
      description: 'A test restaurant',
      ownerId,
      categoryId,
      locationId
    });
    await business.save();
    businessId = business._id;

    const otherBusiness = new Business({
      name: 'Other Restaurant',
      description: 'Another test restaurant',
      ownerId,
      categoryId,
      locationId
    });
    await otherBusiness.save();
    otherBusinessId = otherBusiness._id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // Test creating a review
  describe('POST /api/reviews', () => {
    it('should create a review successfully', async () => {
      const reviewData = {
        businessId: businessId.toString(),
        rating: 5,
        comment: 'Excellent food and service!'
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(reviewData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Review created successfully');
      expect(response.body.review.rating).toBe(5);
      expect(response.body.review.comment).toBe('Excellent food and service!');
      expect(response.body.review.customerId.name).toBe('Test Customer');
      
      reviewId = response.body.review._id;
    });

    it('should create a review without comment', async () => {
      const reviewData = {
        businessId: otherBusinessId.toString(),
        rating: 4
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(reviewData);

      expect(response.status).toBe(201);
      expect(response.body.review.rating).toBe(4);
      expect(response.body.review.comment).toBeUndefined();
    });

    it('should fail when creating review without authentication', async () => {
      const reviewData = {
        businessId: businessId.toString(),
        rating: 5
      };

      const response = await request(app)
        .post('/api/reviews')
        .send(reviewData);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Missing token');
    });

    it('should fail when non-customer tries to create review', async () => {
      const reviewData = {
        businessId: businessId.toString(),
        rating: 5
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(reviewData);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied. Customer role required.');
    });

    it('should fail when required fields are missing', async () => {
      const reviewData = {
        comment: 'Missing business ID and rating'
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(reviewData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Business ID and rating are required');
    });

    it('should fail when rating is invalid', async () => {
      const reviewData = {
        businessId: businessId.toString(),
        rating: 6
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(reviewData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Rating must be between 1 and 5');
    });

    it('should fail when business does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const reviewData = {
        businessId: fakeId.toString(),
        rating: 5
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(reviewData);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Business not found');
    });

    it('should fail when customer already reviewed the business', async () => {
      const reviewData = {
        businessId: businessId.toString(),
        rating: 3
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(reviewData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('You have already reviewed this business');
    });
  });

  // Test getting reviews by business
  describe('GET /api/reviews/business/:businessId', () => {
    beforeAll(async () => {
      // Create additional reviews for testing
      const review2 = new Review({
        customerId: otherCustomerId,
        businessId,
        rating: 4,
        comment: 'Good food!'
      });
      await review2.save();

      const review3 = new Review({
        customerId: otherCustomerId,
        businessId,
        rating: 3,
        comment: 'Average experience'
      });
      await review3.save();
    });

    it('should get reviews for a business with statistics', async () => {
      const response = await request(app)
        .get(`/api/reviews/business/${businessId}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.reviews)).toBe(true);
      expect(response.body.reviews.length).toBeGreaterThan(0);
      expect(response.body.stats).toBeDefined();
      expect(response.body.stats.totalReviews).toBeGreaterThan(0);
      expect(response.body.stats.averageRating).toBeGreaterThan(0);
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter reviews by rating', async () => {
      const response = await request(app)
        .get(`/api/reviews/business/${businessId}?rating=5`);

      expect(response.status).toBe(200);
      response.body.reviews.forEach(review => {
        expect(review.rating).toBe(5);
      });
    });

    it('should paginate reviews', async () => {
      const response = await request(app)
        .get(`/api/reviews/business/${businessId}?page=1&limit=2`);

      expect(response.status).toBe(200);
      expect(response.body.reviews.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination.limit).toBe(2);
    });

    it('should return 404 for non-existent business', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/reviews/business/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Business not found');
    });
  });

  // Test getting review by ID
  describe('GET /api/reviews/:id', () => {
    it('should get a review by ID', async () => {
      const response = await request(app)
        .get(`/api/reviews/${reviewId}`);

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(reviewId);
      expect(response.body.customerId.name).toBe('Test Customer');
      expect(response.body.businessId.name).toBe('Test Restaurant');
    });

    it('should return 404 for non-existent review', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/reviews/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Review not found');
    });
  });

  // Test updating a review
  describe('PUT /api/reviews/:id', () => {
    it('should update own review successfully', async () => {
      const updateData = {
        rating: 4,
        comment: 'Updated: Still great food!'
      };

      const response = await request(app)
        .put(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Review updated successfully');
      expect(response.body.review.rating).toBe(4);
      expect(response.body.review.comment).toBe('Updated: Still great food!');
    });

    it('should fail when updating review without authentication', async () => {
      const updateData = {
        rating: 3
      };

      const response = await request(app)
        .put(`/api/reviews/${reviewId}`)
        .send(updateData);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Missing token');
    });

    it('should fail when non-customer tries to update review', async () => {
      const updateData = {
        rating: 3
      };

      const response = await request(app)
        .put(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied. Customer role required.');
    });

    it('should fail when trying to update another customer\'s review', async () => {
      const updateData = {
        rating: 1,
        comment: 'Trying to sabotage'
      };

      const response = await request(app)
        .put(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${otherCustomerToken}`)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('You can only update your own reviews');
    });

    it('should fail with invalid rating', async () => {
      const updateData = {
        rating: 0
      };

      const response = await request(app)
        .put(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Rating must be between 1 and 5');
    });

    it('should return 404 for non-existent review', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const updateData = {
        rating: 5
      };

      const response = await request(app)
        .put(`/api/reviews/${fakeId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Review not found');
    });
  });

  // Test getting my reviews
  describe('GET /api/reviews/my/reviews', () => {
    it('should get customer\'s own reviews', async () => {
      const response = await request(app)
        .get('/api/reviews/my/reviews')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.reviews)).toBe(true);
      expect(response.body.reviews.length).toBeGreaterThan(0);
      expect(response.body.pagination).toBeDefined();
      
      // All reviews should belong to the customer
      response.body.reviews.forEach(review => {
        expect(review.customerId).toBe(customerId.toString());
      });
    });

    it('should fail when getting reviews without authentication', async () => {
      const response = await request(app)
        .get('/api/reviews/my/reviews');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Missing token');
    });

    it('should fail when non-customer tries to get reviews', async () => {
      const response = await request(app)
        .get('/api/reviews/my/reviews')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied. Customer role required.');
    });

    it('should paginate my reviews', async () => {
      const response = await request(app)
        .get('/api/reviews/my/reviews?page=1&limit=1')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.reviews.length).toBeLessThanOrEqual(1);
      expect(response.body.pagination.limit).toBe(1);
    });
  });

  // Test deleting a review
  describe('DELETE /api/reviews/:id', () => {
    it('should fail when deleting review without authentication', async () => {
      const response = await request(app)
        .delete(`/api/reviews/${reviewId}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Missing token');
    });

    it('should fail when non-customer tries to delete review', async () => {
      const response = await request(app)
        .delete(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied. Customer role required.');
    });

    it('should fail when trying to delete another customer\'s review', async () => {
      const response = await request(app)
        .delete(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${otherCustomerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('You can only delete your own reviews');
    });

    it('should delete own review successfully', async () => {
      const response = await request(app)
        .delete(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Review deleted successfully');
    });

    it('should return 404 for non-existent review', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/reviews/${fakeId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Review not found');
    });

    it('should confirm review was deleted', async () => {
      const response = await request(app)
        .get(`/api/reviews/${reviewId}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Review not found');
    });
  });
});
