const request = require('supertest');
const app = require('../server'); // Path to your Express app
const mongoose = require('mongoose');
const User = require('../models/user.model');
const Business = require('../models/business.model');
const Category = require('../models/category.model');
const Location = require('../models/location.model');
const jwt = require('jsonwebtoken');

describe('Business API', () => {
  let token, userId, categoryId, locationId;

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

    // Create a mock user
    const user = new User({ name: 'Test Owner', email: 'owner@test.com', password: 'hashed', role: 'owner' });
    await user.save();
    userId = user._id;

    // Generate JWT manually
    token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

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
  });

  it('should search businesses by name', async () => {
    const res = await request(app).get('/api/businesses/search').query({ q: 'Stu' });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe('Async Studio');
  });
});
