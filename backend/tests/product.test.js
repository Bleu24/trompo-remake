const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const Business = require('../models/business.model');
const Sellable = require('../models/sellable.model');

describe('Product API', () => {
  let businessId, productId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    await Business.deleteMany({});
    await Sellable.deleteMany({});

    const business = new Business({ name: 'Test Business' });
    await business.save();
    businessId = business._id;

    const product = new Sellable({
      businessId,
      title: 'Test Product',
      description: 'Sample',
      type: 'product',
      price: 10,
      inventory: 100,
    });
    await product.save();
    productId = product._id;

    const product2 = new Sellable({
      businessId,
      title: 'Second Product',
      type: 'product',
      price: 20,
      inventory: 50,
    });
    await product2.save();
  }, 10000);

  afterAll(async () => {
    await Business.deleteMany({});
    await Sellable.deleteMany({});
    await mongoose.connection.close();
  });

  it('should list all products', async () => {
    const res = await request(app).get('/api/products/');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  it('should get products by business', async () => {
    const res = await request(app).get(`/api/products/business/${businessId}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    res.body.forEach(p => {
      expect(p.businessId._id.toString()).toBe(businessId.toString());
    });
  });

  it('should get a product by id', async () => {
    const res = await request(app).get(`/api/products/${productId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body._id.toString()).toBe(productId.toString());
  });
});
