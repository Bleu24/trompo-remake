const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const Business = require('../models/business.model');
const Sellable = require('../models/sellable.model');
const BusinessOwner = require('../models/businessOwner.model');
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');

describe('Business Owner Product API', () => {
  let businessId, token, productId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    await Business.deleteMany({});
    await Sellable.deleteMany({});
    await BusinessOwner.deleteMany({});
    await User.deleteMany({});

    const user = new User({ name: 'Owner', email: 'owner@ex.com', password: 'hash', role: 'owner' });
    await user.save();
    const owner = new BusinessOwner({ userId: user._id });
    await owner.save();
    token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const business = new Business({ name: 'Owner Biz', ownerId: owner._id });
    await business.save();
    businessId = business._id;
  });

  afterAll(async () => {
    await Business.deleteMany({});
    await Sellable.deleteMany({});
    await BusinessOwner.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  it('owner creates product', async () => {
    const res = await request(app)
      .post('/api/owner/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        businessId: businessId.toString(),
        title: 'Owner Product',
        description: 'Demo',
        price: 5,
        inventory: 10,
      });
    expect(res.statusCode).toBe(201);
    productId = res.body.product._id;
  });

  it('owner updates product', async () => {
    const res = await request(app)
      .put(`/api/owner/products/${productId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated Owner Product' });
    expect(res.statusCode).toBe(200);
    expect(res.body.product.title).toBe('Updated Owner Product');
  });

  it('owner deletes product', async () => {
    const res = await request(app)
      .delete(`/api/owner/products/${productId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
  });
});
