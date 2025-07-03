const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/user.model');
const Business = require('../models/business.model');
const Category = require('../models/category.model');
const Location = require('../models/location.model');
const Sellable = require('../models/sellable.model');
const jwt = require('jsonwebtoken');

describe('Product API', () => {
  let ownerToken, adminToken, otherOwnerToken;
  let ownerId, adminId, otherOwnerId;
  let categoryId, locationId;
  let businessId, otherBusinessId;
  let productId, serviceId;

  // Clean database before tests
  beforeAll(async () => {
    await User.deleteMany({});
    await Business.deleteMany({});
    await Category.deleteMany({});
    await Location.deleteMany({});
    await Sellable.deleteMany({});
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

    const admin = new User({ 
      name: 'Test Admin', 
      email: 'admin@test.com', 
      password: 'hashed', 
      role: 'admin' 
    });
    await admin.save();
    adminId = admin._id;

    const otherOwner = new User({ 
      name: 'Other Owner', 
      email: 'other@test.com', 
      password: 'hashed', 
      role: 'owner' 
    });
    await otherOwner.save();
    otherOwnerId = otherOwner._id;

    // Generate JWT tokens
    ownerToken = jwt.sign({ userId: ownerId, role: 'owner' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    adminToken = jwt.sign({ userId: adminId, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    otherOwnerToken = jwt.sign({ userId: otherOwnerId, role: 'owner' }, process.env.JWT_SECRET, { expiresIn: '1h' });

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
      ownerId: otherOwnerId,
      categoryId,
      locationId
    });
    await otherBusiness.save();
    otherBusinessId = otherBusiness._id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // Test creating a product
  describe('POST /api/products', () => {
    it('should create a product successfully', async () => {
      const productData = {
        businessId,
        title: 'Burger',
        description: 'Delicious burger',
        type: 'product',
        price: 10.99,
        inventory: 50
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(productData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Product created successfully');
      expect(response.body.product.title).toBe('Burger');
      expect(response.body.product.price).toBe(10.99);
      expect(response.body.product.inventory).toBe(50);
      
      productId = response.body.product._id;
    });

    it('should create a service successfully', async () => {
      const serviceData = {
        businessId,
        title: 'Delivery Service',
        description: 'Fast delivery',
        type: 'service',
        price: 5.00
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(serviceData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Product created successfully');
      expect(response.body.product.title).toBe('Delivery Service');
      expect(response.body.product.type).toBe('service');
      
      serviceId = response.body.product._id;
    });

    it('should fail when creating product without authentication', async () => {
      const productData = {
        businessId,
        title: 'Unauthorized Product',
        type: 'product',
        price: 15.99,
        inventory: 10
      };

      const response = await request(app)
        .post('/api/products')
        .send(productData);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Missing token');
    });

    it('should fail when non-owner tries to create product', async () => {
      const productData = {
        businessId,
        title: 'Unauthorized Product',
        type: 'product',
        price: 15.99,
        inventory: 10
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied. Owner role required.');
    });

    it('should fail when owner tries to create product for another business', async () => {
      const productData = {
        businessId: otherBusinessId,
        title: 'Unauthorized Product',
        type: 'product',
        price: 15.99,
        inventory: 10
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(productData);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied. You can only create products for your own business.');
    });

    it('should fail when required fields are missing', async () => {
      const productData = {
        businessId,
        description: 'Missing required fields'
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(productData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Title, type, and price are required');
    });

    it('should fail when product type requires inventory but none provided', async () => {
      const productData = {
        businessId,
        title: 'Product without inventory',
        type: 'product',
        price: 10.99
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(productData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Inventory is required for products and must be >= 0');
    });
  });

  // Test getting all products
  describe('GET /api/products', () => {
    it('should get all products', async () => {
      const response = await request(app).get('/api/products');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should filter products by category', async () => {
      const response = await request(app).get('/api/products?category=product');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach(product => {
        expect(product.type).toBe('product');
      });
    });

    it('should filter products by price range', async () => {
      const response = await request(app).get('/api/products?minPrice=5&maxPrice=15');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach(product => {
        expect(product.price).toBeGreaterThanOrEqual(5);
        expect(product.price).toBeLessThanOrEqual(15);
      });
    });

    it('should filter available products', async () => {
      const response = await request(app).get('/api/products?available=true');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach(product => {
        if (product.type === 'product') {
          expect(product.inventory).toBeGreaterThan(0);
        }
      });
    });
  });

  // Test getting products by business
  describe('GET /api/products/business/:businessId', () => {
    it('should get products for a specific business', async () => {
      const response = await request(app).get(`/api/products/business/${businessId}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach(product => {
        expect(product.businessId._id).toBe(businessId.toString());
      });
    });

    it('should return 404 for non-existent business', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).get(`/api/products/business/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Business not found');
    });

    it('should filter products by business and category', async () => {
      const response = await request(app).get(`/api/products/business/${businessId}?category=service`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach(product => {
        expect(product.type).toBe('service');
        expect(product.businessId._id).toBe(businessId.toString());
      });
    });
  });

  // Test getting product by ID
  describe('GET /api/products/:id', () => {
    it('should get a product by ID', async () => {
      const response = await request(app).get(`/api/products/${productId}`);

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(productId);
      expect(response.body.title).toBe('Burger');
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).get(`/api/products/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Product not found');
    });
  });

  // Test updating a product
  describe('PUT /api/products/:id', () => {
    it('should update a product successfully', async () => {
      const updateData = {
        title: 'Updated Burger',
        price: 12.99,
        inventory: 40
      };

      const response = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Product updated successfully');
      expect(response.body.product.title).toBe('Updated Burger');
      expect(response.body.product.price).toBe(12.99);
      expect(response.body.product.inventory).toBe(40);
    });

    it('should fail when updating product without authentication', async () => {
      const response = await request(app)
        .put(`/api/products/${productId}`)
        .send({ title: 'Unauthorized Update' });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Missing token');
    });

    it('should fail when non-owner tries to update product', async () => {
      const response = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${otherOwnerToken}`)
        .send({ title: 'Unauthorized Update' });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied. You can only update products for your own business.');
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/products/${fakeId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Product not found');
    });
  });

  // Test deleting a product
  describe('DELETE /api/products/:id', () => {
    it('should fail when deleting product without authentication', async () => {
      const response = await request(app).delete(`/api/products/${productId}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Missing token');
    });

    it('should fail when non-owner tries to delete product', async () => {
      const response = await request(app)
        .delete(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${otherOwnerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied. You can only delete products for your own business.');
    });

    it('should delete a product successfully', async () => {
      const response = await request(app)
        .delete(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Product deleted successfully');
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/products/${fakeId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Product not found');
    });

    it('should confirm product was deleted', async () => {
      const response = await request(app).get(`/api/products/${productId}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Product not found');
    });
  });
});
