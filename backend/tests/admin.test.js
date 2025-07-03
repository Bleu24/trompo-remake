const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/user.model');
const Business = require('../models/business.model');
const Category = require('../models/category.model');
const Location = require('../models/location.model');
const Review = require('../models/review.model');
const CustomerVerification = require('../models/customerVerification.model');
const VerificationRequest = require('../models/verificationRequest.model');
const BusinessOwner = require('../models/businessOwner.model');
const jwt = require('jsonwebtoken');

describe('Admin API', () => {
  let adminToken, customerToken, ownerToken;
  let adminId, customerId, ownerId;
  let categoryId, locationId, businessId;
  let reviewId, customerVerificationId, businessVerificationId;

  // Clean database before tests
  beforeAll(async () => {
    await User.deleteMany({});
    await Business.deleteMany({});
    await Category.deleteMany({});
    await Location.deleteMany({});
    await Review.deleteMany({});
    await CustomerVerification.deleteMany({});
    await VerificationRequest.deleteMany({});
    await BusinessOwner.deleteMany({});
  }, 10000);

  beforeAll(async () => {
    // Connect to test DB
    await mongoose.connect(process.env.MONGO_URI);

    // Create test users
    const admin = new User({ 
      name: 'Test Admin', 
      email: 'admin@test.com', 
      password: 'hashed', 
      role: 'admin' 
    });
    await admin.save();
    adminId = admin._id;

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

    // Generate JWT tokens
    adminToken = jwt.sign({ userId: adminId, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    customerToken = jwt.sign({ userId: customerId, role: 'customer' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    ownerToken = jwt.sign({ userId: ownerId, role: 'owner' }, process.env.JWT_SECRET, { expiresIn: '1h' });

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

    // Create business owner record
    const businessOwner = new BusinessOwner({ userId: ownerId });
    await businessOwner.save();

    // Create test review
    const review = new Review({
      customerId,
      businessId,
      rating: 5,
      comment: 'Great food!'
    });
    await review.save();
    reviewId = review._id;

    // Create test customer verification
    const customerVerification = new CustomerVerification({
      customerId,
      documents: ['id.jpg', 'selfie.jpg'],
      status: 'pending'
    });
    await customerVerification.save();
    customerVerificationId = customerVerification._id;

    // Create test business verification
    const businessVerification = new VerificationRequest({
      ownerId: businessOwner._id,
      businessId,
      documents: ['permit.jpg', 'license.jpg'],
      status: 'pending'
    });
    await businessVerification.save();
    businessVerificationId = businessVerification._id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // Test dashboard statistics
  describe('GET /api/admin/dashboard/stats', () => {
    it('should get dashboard statistics successfully', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.users.total).toBe(3);
      expect(response.body.users.customers).toBe(1);
      expect(response.body.users.owners).toBe(1);
      expect(response.body.businesses.total).toBe(1);
      expect(response.body.reviews.total).toBe(1);
      expect(response.body.verifications.pendingCustomers).toBe(1);
      expect(response.body.verifications.pendingBusinesses).toBe(1);
    });

    it('should fail when non-admin tries to access dashboard', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard/stats')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied. Admin role required.');
    });

    it('should fail when accessing dashboard without authentication', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard/stats');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Missing token');
    });
  });

  // Test customer verification management
  describe('Customer Verification Management', () => {
    describe('GET /api/admin/customer-verifications', () => {
      it('should get all customer verifications', async () => {
        const response = await request(app)
          .get('/api/admin/customer-verifications')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(1);
        expect(response.body[0].status).toBe('pending');
      });

      it('should filter customer verifications by status', async () => {
        const response = await request(app)
          .get('/api/admin/customer-verifications?status=pending')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        response.body.forEach(verification => {
          expect(verification.status).toBe('pending');
        });
      });
    });

    describe('GET /api/admin/customer-verifications/:id', () => {
      it('should get customer verification by ID', async () => {
        const response = await request(app)
          .get(`/api/admin/customer-verifications/${customerVerificationId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body._id).toBe(customerVerificationId.toString());
        expect(response.body.customerId.name).toBe('Test Customer');
      });

      it('should return 404 for non-existent verification', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const response = await request(app)
          .get(`/api/admin/customer-verifications/${fakeId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Verification request not found');
      });
    });

    describe('PUT /api/admin/customer-verifications/:id', () => {
      it('should approve customer verification', async () => {
        const updateData = {
          status: 'approved',
          adminNotes: 'All documents verified'
        };

        const response = await request(app)
          .put(`/api/admin/customer-verifications/${customerVerificationId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Verification status updated successfully');
        expect(response.body.verification.status).toBe('approved');
        expect(response.body.verification.customerId.isVerified).toBe(true);
      });

      it('should reject customer verification', async () => {
        // Create another verification to reject
        const newVerification = new CustomerVerification({
          customerId,
          documents: ['bad_id.jpg'],
          status: 'pending'
        });
        await newVerification.save();

        const updateData = {
          status: 'rejected',
          adminNotes: 'Documents unclear',
          rejectionReason: 'Poor image quality'
        };

        const response = await request(app)
          .put(`/api/admin/customer-verifications/${newVerification._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body.verification.status).toBe('rejected');
        expect(response.body.verification.rejectionReason).toBe('Poor image quality');
      });

      it('should fail with invalid status', async () => {
        const updateData = {
          status: 'invalid_status'
        };

        const response = await request(app)
          .put(`/api/admin/customer-verifications/${customerVerificationId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Invalid status. Must be pending, approved, or rejected');
      });
    });
  });

  // Test business verification management
  describe('Business Verification Management', () => {
    describe('GET /api/admin/business-verifications', () => {
      it('should get all business verifications', async () => {
        const response = await request(app)
          .get('/api/admin/business-verifications')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(1);
        expect(response.body[0].status).toBe('pending');
      });
    });

    describe('PUT /api/admin/business-verifications/:id', () => {
      it('should approve business verification', async () => {
        const updateData = {
          status: 'approved',
          adminNotes: 'Business documents verified'
        };

        const response = await request(app)
          .put(`/api/admin/business-verifications/${businessVerificationId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Business verification status updated successfully');
        expect(response.body.verification.status).toBe('approved');
        expect(response.body.verification.businessId.isVerified).toBe(true);
      });
    });
  });

  // Test review management
  describe('Review Management', () => {
    describe('GET /api/admin/reviews', () => {
      it('should get all reviews with pagination', async () => {
        const response = await request(app)
          .get('/api/admin/reviews')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.reviews)).toBe(true);
        expect(response.body.pagination).toBeDefined();
        expect(response.body.pagination.total).toBe(1);
      });

      it('should filter reviews by business', async () => {
        const response = await request(app)
          .get(`/api/admin/reviews?businessId=${businessId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        response.body.reviews.forEach(review => {
          expect(review.businessId._id).toBe(businessId.toString());
        });
      });

      it('should filter reviews by rating', async () => {
        const response = await request(app)
          .get('/api/admin/reviews?rating=5')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        response.body.reviews.forEach(review => {
          expect(review.rating).toBe(5);
        });
      });
    });

    describe('PUT /api/admin/reviews/:id', () => {
      it('should update review successfully', async () => {
        const updateData = {
          rating: 4,
          comment: 'Updated by admin'
        };

        const response = await request(app)
          .put(`/api/admin/reviews/${reviewId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Review updated successfully');
        expect(response.body.review.rating).toBe(4);
        expect(response.body.review.comment).toBe('Updated by admin');
      });

      it('should fail with invalid rating', async () => {
        const updateData = {
          rating: 6
        };

        const response = await request(app)
          .put(`/api/admin/reviews/${reviewId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Rating must be between 1 and 5');
      });
    });

    describe('DELETE /api/admin/reviews/:id', () => {
      it('should delete review successfully', async () => {
        const response = await request(app)
          .delete(`/api/admin/reviews/${reviewId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Review deleted successfully');
      });

      it('should return 404 for non-existent review', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const response = await request(app)
          .delete(`/api/admin/reviews/${fakeId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Review not found');
      });
    });
  });
});
