const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/user.model');
const Business = require('../models/business.model');
const Category = require('../models/category.model');
const Location = require('../models/location.model');
const Review = require('../models/review.model');
const jwt = require('jsonwebtoken');

describe('Maps API', () => {
  let customerToken, ownerToken;
  let customerId, ownerId;
  let categoryId, locationId;
  let businessId1, businessId2;

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

    const owner = new User({ 
      name: 'Test Owner', 
      email: 'owner@test.com', 
      password: 'hashed', 
      role: 'owner' 
    });
    await owner.save();
    ownerId = owner._id;

    // Generate JWT tokens
    customerToken = jwt.sign({ userId: customerId, role: 'customer' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    ownerToken = jwt.sign({ userId: ownerId, role: 'owner' }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Create test category
    const category = new Category({ name: 'Restaurants' });
    await category.save();
    categoryId = category._id;

    // Create test location with coordinates
    const location = new Location({ 
      name: 'Metro Manila',
      address: 'Manila, Philippines',
      coordinates: {
        latitude: 14.5995,
        longitude: 120.9842
      },
      formattedAddress: 'Manila, Metro Manila, Philippines'
    });
    await location.save();
    locationId = location._id;

    // Create test businesses with coordinates
    const business1 = new Business({
      name: 'Test Restaurant 1',
      description: 'A great restaurant',
      ownerId,
      categoryId,
      locationId,
      isVerified: true,
      businessLocation: {
        address: 'Makati City, Philippines',
        coordinates: {
          latitude: 14.5547,
          longitude: 121.0244
        },
        formattedAddress: 'Makati City, Metro Manila, Philippines'
      },
      contactInfo: {
        phone: '+639123456789',
        email: 'restaurant1@test.com',
        website: 'https://restaurant1.com'
      },
      operatingHours: [
        { day: 'Monday', open: '09:00', close: '21:00' },
        { day: 'Tuesday', open: '09:00', close: '21:00' }
      ],
      averageRating: 4.5,
      totalReviews: 10
    });
    await business1.save();
    businessId1 = business1._id;

    const business2 = new Business({
      name: 'Test Restaurant 2',
      description: 'Another great restaurant',
      ownerId,
      categoryId,
      locationId,
      isVerified: false,
      businessLocation: {
        address: 'Quezon City, Philippines',
        coordinates: {
          latitude: 14.6760,
          longitude: 121.0437
        },
        formattedAddress: 'Quezon City, Metro Manila, Philippines'
      },
      averageRating: 3.8,
      totalReviews: 5
    });
    await business2.save();
    businessId2 = business2._id;

    // Create test reviews
    const review1 = new Review({
      customerId,
      businessId: businessId1,
      rating: 5,
      comment: 'Excellent food!'
    });
    await review1.save();

    const review2 = new Review({
      customerId,
      businessId: businessId1,
      rating: 4,
      comment: 'Good service'
    });
    await review2.save();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // Test getting businesses for map
  describe('GET /api/maps/businesses', () => {
    it('should get all businesses with map data', async () => {
      const response = await request(app)
        .get('/api/maps/businesses');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.markers)).toBe(true);
      expect(response.body.markers.length).toBe(2);
      expect(response.body.total).toBe(2);
      
      // Check marker structure
      const marker = response.body.markers[0];
      expect(marker).toHaveProperty('id');
      expect(marker).toHaveProperty('name');
      expect(marker).toHaveProperty('coordinates');
      expect(marker.coordinates).toHaveProperty('lat');
      expect(marker.coordinates).toHaveProperty('lng');
      expect(marker).toHaveProperty('rating');
    });

    it('should filter businesses by category', async () => {
      const response = await request(app)
        .get(`/api/maps/businesses?categoryId=${categoryId}`);

      expect(response.status).toBe(200);
      expect(response.body.markers.length).toBe(2);
      response.body.markers.forEach(marker => {
        expect(marker.category).toBe('Restaurants');
      });
    });

    it('should filter businesses by verification status', async () => {
      const response = await request(app)
        .get('/api/maps/businesses?verified=true');

      expect(response.status).toBe(200);
      expect(response.body.markers.length).toBe(1);
      expect(response.body.markers[0].isVerified).toBe(true);
    });

    it('should filter businesses by bounds', async () => {
      const bounds = JSON.stringify({
        north: 14.7,
        south: 14.5,
        east: 121.1,
        west: 121.0
      });

      const response = await request(app)
        .get(`/api/maps/businesses?bounds=${encodeURIComponent(bounds)}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.markers)).toBe(true);
    });

    it('should filter businesses by radius and center', async () => {
      const center = JSON.stringify({ lat: 14.5995, lng: 120.9842 });
      const radius = 50; // 50km

      const response = await request(app)
        .get(`/api/maps/businesses?center=${encodeURIComponent(center)}&radius=${radius}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.markers)).toBe(true);
      expect(response.body.filters.radius).toBe(radius);
    });

    it('should fail with invalid bounds format', async () => {
      const response = await request(app)
        .get('/api/maps/businesses?bounds=invalid');

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid bounds format');
    });

    it('should fail with invalid center format', async () => {
      const response = await request(app)
        .get('/api/maps/businesses?center=invalid&radius=10');

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid center or radius format');
    });
  });

  // Test getting business map details
  describe('GET /api/maps/business/:businessId', () => {
    it('should get detailed business information for map', async () => {
      const response = await request(app)
        .get(`/api/maps/business/${businessId1}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(businessId1.toString());
      expect(response.body.name).toBe('Test Restaurant 1');
      expect(response.body.coordinates).toHaveProperty('lat');
      expect(response.body.coordinates).toHaveProperty('lng');
      expect(response.body.contactInfo).toBeDefined();
      expect(response.body.operatingHours).toBeDefined();
      expect(response.body.stats).toBeDefined();
      expect(response.body.recentReviews).toBeDefined();
      expect(Array.isArray(response.body.recentReviews)).toBe(true);
    });

    it('should return 404 for non-existent business', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/maps/business/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Business not found');
    });
  });

  // Test search businesses near location
  describe('GET /api/maps/search', () => {
    it('should search businesses near an address', async () => {
      const response = await request(app)
        .get('/api/maps/search?address=Manila&radius=20');

      expect(response.status).toBe(200);
      expect(response.body.searchQuery.address).toBe('Manila');
      expect(response.body.searchQuery.radius).toBe('20');
      expect(Array.isArray(response.body.results)).toBe(true);
      expect(response.body.total).toBeDefined();
    });

    it('should filter search by category', async () => {
      const response = await request(app)
        .get(`/api/maps/search?address=Manila&categoryId=${categoryId}`);

      expect(response.status).toBe(200);
      expect(response.body.searchQuery.categoryId).toBe(categoryId.toString());
    });

    it('should fail without address parameter', async () => {
      const response = await request(app)
        .get('/api/maps/search?radius=20');

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Address is required for location search');
    });
  });

  // Test getting map configuration
  describe('GET /api/maps/config', () => {
    it('should get map configuration and settings', async () => {
      const response = await request(app)
        .get('/api/maps/config');

      expect(response.status).toBe(200);
      expect(response.body.defaultCenter).toHaveProperty('lat');
      expect(response.body.defaultCenter).toHaveProperty('lng');
      expect(response.body.defaultZoom).toBeDefined();
      expect(Array.isArray(response.body.categories)).toBe(true);
      expect(response.body.mapSettings).toBeDefined();
      expect(response.body.markerSettings).toBeDefined();
    });
  });

  // Test updating business location
  describe('PUT /api/maps/business/:businessId/location', () => {
    it('should update business location successfully', async () => {
      const locationData = {
        address: 'Updated Address, Makati City',
        latitude: 14.5600,
        longitude: 121.0300,
        formattedAddress: 'Updated Address, Makati City, Metro Manila, Philippines'
      };

      const response = await request(app)
        .put(`/api/maps/business/${businessId1}/location`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(locationData);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Business location updated successfully');
      expect(response.body.location.coordinates.latitude).toBe(14.5600);
      expect(response.body.location.coordinates.longitude).toBe(121.0300);
    });

    it('should fail when updating location without authentication', async () => {
      const locationData = {
        address: 'New Address',
        latitude: 14.5600,
        longitude: 121.0300
      };

      const response = await request(app)
        .put(`/api/maps/business/${businessId1}/location`)
        .send(locationData);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Missing token');
    });

    it('should fail when non-owner tries to update location', async () => {
      const locationData = {
        address: 'New Address',
        latitude: 14.5600,
        longitude: 121.0300
      };

      const response = await request(app)
        .put(`/api/maps/business/${businessId1}/location`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(locationData);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied. Owner role required.');
    });

    it('should fail when required coordinates are missing', async () => {
      const locationData = {
        address: 'New Address'
      };

      const response = await request(app)
        .put(`/api/maps/business/${businessId1}/location`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(locationData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Latitude and longitude are required');
    });

    it('should fail with invalid coordinates', async () => {
      const locationData = {
        address: 'New Address',
        latitude: 95, // Invalid latitude
        longitude: 200 // Invalid longitude
      };

      const response = await request(app)
        .put(`/api/maps/business/${businessId1}/location`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(locationData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid coordinates');
    });

    it('should fail when business not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const locationData = {
        address: 'New Address',
        latitude: 14.5600,
        longitude: 121.0300
      };

      const response = await request(app)
        .put(`/api/maps/business/${fakeId}/location`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(locationData);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Business not found');
    });

    it('should fail when trying to update another owner\'s business', async () => {
      // Create another owner
      const otherOwner = new User({ 
        name: 'Other Owner', 
        email: 'other@test.com', 
        password: 'hashed', 
        role: 'owner' 
      });
      await otherOwner.save();

      const otherOwnerToken = jwt.sign({ userId: otherOwner._id, role: 'owner' }, process.env.JWT_SECRET, { expiresIn: '1h' });

      const locationData = {
        address: 'New Address',
        latitude: 14.5600,
        longitude: 121.0300
      };

      const response = await request(app)
        .put(`/api/maps/business/${businessId1}/location`)
        .set('Authorization', `Bearer ${otherOwnerToken}`)
        .send(locationData);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied. You can only update your own business location.');
    });
  });
});
