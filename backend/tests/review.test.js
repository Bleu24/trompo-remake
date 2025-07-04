const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/user.model');
const Customer = require('../models/customer.model');
const Business = require('../models/business.model');
const Review = require('../models/review.model');
const jwt = require('jsonwebtoken');

describe('Review API', () => {
  let token1, token2, businessId, reviewId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    await User.deleteMany({});
    await Customer.deleteMany({});
    await Business.deleteMany({});
    await Review.deleteMany({});

    const user1 = new User({ name: 'Cust1', email: 'c1@test.com', password: 'hash', role: 'customer' });
    await user1.save();
    const cust1 = new Customer({ userId: user1._id });
    await cust1.save();
    token1 = jwt.sign({ userId: user1._id, role: user1.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const user2 = new User({ name: 'Cust2', email: 'c2@test.com', password: 'hash', role: 'customer' });
    await user2.save();
    const cust2 = new Customer({ userId: user2._id });
    await cust2.save();
    token2 = jwt.sign({ userId: user2._id, role: user2.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const biz = new Business({ name: 'Biz' });
    await biz.save();
    businessId = biz._id;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Customer.deleteMany({});
    await Business.deleteMany({});
    await Review.deleteMany({});
    await mongoose.connection.close();
  });

  it('creates a review', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token1}`)
      .send({ businessId: businessId.toString(), rating: 5, comment: 'Great' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('review');
    reviewId = res.body.review._id;
  });

  it('lists reviews for a business', async () => {
    const res = await request(app).get(`/api/businesses/${businessId}/reviews`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });

  it('updates own review', async () => {
    const res = await request(app)
      .put(`/api/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ comment: 'Updated' });
    expect(res.statusCode).toBe(200);
    expect(res.body.review.comment).toBe('Updated');
  });

  it('fails to update others review', async () => {
    const res = await request(app)
      .put(`/api/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ comment: 'Hacked' });
    expect(res.statusCode).toBe(404);
  });

  it('deletes own review', async () => {
    const res = await request(app)
      .delete(`/api/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${token1}`);
    expect(res.statusCode).toBe(200);
  });

  it('reviews list empty after deletion', async () => {
    const res = await request(app).get(`/api/businesses/${businessId}/reviews`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });
});
