const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/user.model');
const Customer = require('../models/customer.model');
const BusinessOwner = require('../models/businessOwner.model');

describe('Auth register and login', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    await User.deleteMany({});
    await Customer.deleteMany({});
    await BusinessOwner.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Customer.deleteMany({});
    await BusinessOwner.deleteMany({});
    await mongoose.connection.close();
  });

  it('registers a customer', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Customer',
        email: 'cust@test.com',
        password: 'secret',
        role: 'customer',
      });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
    const customer = await Customer.findOne({ userId: res.body.user._id });
    expect(customer).not.toBeNull();
  });

  it('registers a business owner', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Owner',
        email: 'owner@test.com',
        password: 'secret',
        role: 'owner',
      });
    expect(res.statusCode).toBe(201);
    const owner = await BusinessOwner.findOne({ userId: res.body.user._id });
    expect(owner).not.toBeNull();
  });

  it('logs in a user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'owner@test.com', password: 'secret' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });
});
