const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/user.model');
const Customer = require('../models/customer.model');
const Business = require('../models/business.model');
const CustomerVerification = require('../models/customerVerification.model');
const Review = require('../models/review.model');
const jwt = require('jsonwebtoken');

describe('Admin API', () => {
  let adminToken, verificationId, businessId, customerId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    await User.deleteMany({});
    await Customer.deleteMany({});
    await Business.deleteMany({});
    await CustomerVerification.deleteMany({});
    await Review.deleteMany({});

    const admin = new User({ name: 'Admin', email: 'admin@test.com', password: 'hashed', role: 'admin' });
    await admin.save();
    adminToken = jwt.sign({ userId: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const user = new User({ name: 'Cust', email: 'cust@test.com', password: 'hashed', role: 'customer' });
    await user.save();
    const customer = new Customer({ userId: user._id });
    await customer.save();
    customerId = customer._id;

    const business = new Business({ name: 'Biz' });
    await business.save();
    businessId = business._id;

    const verification = new CustomerVerification({ customerId, documents: ['id.png'] });
    await verification.save();
    verificationId = verification._id;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Customer.deleteMany({});
    await Business.deleteMany({});
    await CustomerVerification.deleteMany({});
    await Review.deleteMany({});
    await mongoose.connection.close();
  });

  it('admin updates customer verification', async () => {
    const res = await request(app)
      .put(`/api/admin/customer-verifications/${verificationId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' });
    expect(res.statusCode).toBe(200);
    expect(res.body.verification.status).toBe('approved');
  });

  it('admin lists reviews', async () => {
    await Review.create({ customerId, businessId, rating: 5, comment: 'Great' });

    const listRes = await request(app)
      .get('/api/admin/reviews')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listRes.statusCode).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.length).toBe(1);
  });
});
