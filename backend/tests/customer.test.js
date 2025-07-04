const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/user.model');
const Customer = require('../models/customer.model');
const Business = require('../models/business.model');
const SavedBusiness = require('../models/savedBusiness.model');
const CustomerVerification = require('../models/customerVerification.model');
const jwt = require('jsonwebtoken');

describe('Customer API', () => {
  let token, customerId, businessId1, businessId2;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    await User.deleteMany({});
    await Customer.deleteMany({});
    await Business.deleteMany({});
    await SavedBusiness.deleteMany({});
    await CustomerVerification.deleteMany({});

    const user = new User({ name: 'Test Cust', email: 'cust@test.com', password: 'hashed', role: 'customer' });
    await user.save();
    const customer = new Customer({ userId: user._id });
    await customer.save();
    customerId = customer._id;
    token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const biz1 = new Business({ name: 'Biz1' });
    const biz2 = new Business({ name: 'Biz2' });
    await biz1.save();
    await biz2.save();
    businessId1 = biz1._id;
    businessId2 = biz2._id;
    await SavedBusiness.create([{ customerId, businessId: businessId1 }, { customerId, businessId: businessId2 }]);
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Customer.deleteMany({});
    await Business.deleteMany({});
    await SavedBusiness.deleteMany({});
    await CustomerVerification.deleteMany({});
    await mongoose.connection.close();
  });

  it('customer submits verification', async () => {
    const res = await request(app)
      .post('/api/customers/verification')
      .set('Authorization', `Bearer ${token}`)
      .send({ documents: ['id.png'] });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('verification');
  });

  it('customer views saved businesses', async () => {
    const res = await request(app)
      .get('/api/customers/saved-businesses')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
  });
});
