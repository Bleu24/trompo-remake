const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const Business = require('../models/business.model');
const Sellable = require('../models/sellable.model');
const Category = require('../models/category.model');
const Location = require('../models/location.model');
const BusinessOwner = require('../models/businessOwner.model');
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');

// Basic tests for search endpoints

describe('Search API', () => {
  let ownerToken;
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);

    await Business.deleteMany({});
    await Sellable.deleteMany({});
    await Category.deleteMany({});
    await Location.deleteMany({});
    await BusinessOwner.deleteMany({});
    await User.deleteMany({});

    const user = new User({
      name: 'Owner',
      email: 'owner@example.com',
      password: 'hashed',
      role: 'owner'
    });
    await user.save();
    const owner = new BusinessOwner({ userId: user._id });
    await owner.save();
    ownerToken = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET);

    const category = await Category.create({ name: 'Food' });
    const location = await Location.create({ name: 'Metro Manila' });
    const business = await Business.create({
      name: 'Trompo Bistro',
      description: 'Great tacos',
      ownerId: owner._id,
      categoryId: category._id,
      locationId: location._id,
      isVerified: true
    });
    await Sellable.create({
      businessId: business._id,
      title: 'Trompo Taco',
      description: 'Delicious',
      type: 'product',
      price: 5,
      inventory: 10
    });
  });

  afterAll(async () => {
    await Business.deleteMany({});
    await Sellable.deleteMany({});
    await Category.deleteMany({});
    await Location.deleteMany({});
    await BusinessOwner.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  it('responds with search results', async () => {
    const res = await request(app)
      .get('/api/search')
      .query({ q: 'Trompo' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('businesses');
    expect(Array.isArray(res.body.data.businesses)).toBe(true);
    expect(res.body).toHaveProperty('pagination');
  });

  it('returns suggestions for a query', async () => {
    const res = await request(app)
      .get('/api/search/suggestions')
      .query({ q: 'Tr' });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.suggestions)).toBe(true);
  });
});
