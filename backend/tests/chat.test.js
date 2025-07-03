const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/user.model');
const Business = require('../models/business.model');
const Category = require('../models/category.model');
const Location = require('../models/location.model');
const Conversation = require('../models/conversation.model');
const Message = require('../models/message.model');
const Sellable = require('../models/sellable.model');
const jwt = require('jsonwebtoken');

describe('Chat API', () => {
  let customerToken, ownerToken, adminToken;
  let customerId, ownerId, adminId;
  let categoryId, locationId, businessId, productId;
  let conversationId, messageId;

  // Clean database before tests
  beforeAll(async () => {
    await User.deleteMany({});
    await Business.deleteMany({});
    await Category.deleteMany({});
    await Location.deleteMany({});
    await Conversation.deleteMany({});
    await Message.deleteMany({});
    await Sellable.deleteMany({});
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

    const admin = new User({ 
      name: 'Test Admin', 
      email: 'admin@test.com', 
      password: 'hashed', 
      role: 'admin' 
    });
    await admin.save();
    adminId = admin._id;

    // Generate JWT tokens
    customerToken = jwt.sign({ userId: customerId, role: 'customer' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    ownerToken = jwt.sign({ userId: ownerId, role: 'owner' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    adminToken = jwt.sign({ userId: adminId, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Create test category and location
    const category = new Category({ name: 'Food' });
    await category.save();
    categoryId = category._id;

    const location = new Location({ name: 'Metro Manila' });
    await location.save();
    locationId = location._id;

    // Create test business
    const business = new Business({
      name: 'Test Restaurant',
      description: 'A test restaurant',
      ownerId,
      categoryId,
      locationId
    });
    await business.save();
    businessId = business._id;

    // Create test product
    const product = new Sellable({
      businessId,
      title: 'Test Burger',
      description: 'Delicious test burger',
      type: 'product',
      price: 15.99,
      inventory: 10
    });
    await product.save();
    productId = product._id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // Test creating/getting conversation
  describe('POST /api/chat/conversations', () => {
    it('should create a new conversation successfully', async () => {
      const conversationData = {
        participantId: ownerId.toString(),
        businessId: businessId.toString()
      };

      const response = await request(app)
        .post('/api/chat/conversations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(conversationData);

      expect(response.status).toBe(200);
      expect(response.body.participants).toHaveLength(2);
      expect(response.body.businessId._id).toBe(businessId.toString());
      expect(response.body.type).toBe('direct');
      
      conversationId = response.body._id;
    });

    it('should return existing conversation if already exists', async () => {
      const conversationData = {
        participantId: ownerId.toString(),
        businessId: businessId.toString()
      };

      const response = await request(app)
        .post('/api/chat/conversations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(conversationData);

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(conversationId);
    });

    it('should create support conversation with admin', async () => {
      const conversationData = {
        participantId: adminId.toString()
      };

      const response = await request(app)
        .post('/api/chat/conversations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(conversationData);

      expect(response.status).toBe(200);
      expect(response.body.type).toBe('support');
    });

    it('should fail when participant not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const conversationData = {
        participantId: fakeId.toString()
      };

      const response = await request(app)
        .post('/api/chat/conversations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(conversationData);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Participant not found');
    });

    it('should fail when business not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const conversationData = {
        participantId: ownerId.toString(),
        businessId: fakeId.toString()
      };

      const response = await request(app)
        .post('/api/chat/conversations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(conversationData);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Business not found');
    });

    it('should fail without authentication', async () => {
      const conversationData = {
        participantId: ownerId.toString()
      };

      const response = await request(app)
        .post('/api/chat/conversations')
        .send(conversationData);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Missing token');
    });
  });

  // Test getting conversations
  describe('GET /api/chat/conversations', () => {
    it('should get user conversations with unread counts', async () => {
      const response = await request(app)
        .get('/api/chat/conversations')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.conversations)).toBe(true);
      expect(response.body.conversations.length).toBeGreaterThan(0);
      expect(response.body.pagination).toBeDefined();
      
      // Check unread count is included
      response.body.conversations.forEach(conversation => {
        expect(conversation.unreadCount).toBeDefined();
      });
    });

    it('should paginate conversations', async () => {
      const response = await request(app)
        .get('/api/chat/conversations?page=1&limit=1')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.conversations.length).toBeLessThanOrEqual(1);
      expect(response.body.pagination.limit).toBe(1);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/chat/conversations');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Missing token');
    });
  });

  // Test sending messages
  describe('POST /api/chat/messages', () => {
    it('should send a text message successfully', async () => {
      const messageData = {
        conversationId,
        content: 'Hello! I\'m interested in your restaurant.',
        messageType: 'text'
      };

      const response = await request(app)
        .post('/api/chat/messages')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(messageData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Message sent successfully');
      expect(response.body.data.content).toBe(messageData.content);
      expect(response.body.data.messageType).toBe('text');
      
      messageId = response.body.data._id;
    });

    it('should send a product message successfully', async () => {
      const messageData = {
        conversationId,
        content: 'Check out this burger!',
        messageType: 'product',
        productId: productId.toString()
      };

      const response = await request(app)
        .post('/api/chat/messages')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(messageData);

      expect(response.status).toBe(201);
      expect(response.body.data.messageType).toBe('product');
      expect(response.body.data.productId._id).toBe(productId.toString());
    });

    it('should fail when conversation not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const messageData = {
        conversationId: fakeId.toString(),
        content: 'Test message'
      };

      const response = await request(app)
        .post('/api/chat/messages')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(messageData);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Conversation not found or access denied');
    });

    it('should fail when content is missing for text message', async () => {
      const messageData = {
        conversationId,
        messageType: 'text'
      };

      const response = await request(app)
        .post('/api/chat/messages')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(messageData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Message content is required');
    });

    it('should fail when product ID is missing for product message', async () => {
      const messageData = {
        conversationId,
        content: 'Product message',
        messageType: 'product'
      };

      const response = await request(app)
        .post('/api/chat/messages')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(messageData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Product ID is required for product messages');
    });

    it('should fail when product not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const messageData = {
        conversationId,
        content: 'Product message',
        messageType: 'product',
        productId: fakeId.toString()
      };

      const response = await request(app)
        .post('/api/chat/messages')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(messageData);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Product not found');
    });

    it('should fail without authentication', async () => {
      const messageData = {
        conversationId,
        content: 'Test message'
      };

      const response = await request(app)
        .post('/api/chat/messages')
        .send(messageData);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Missing token');
    });
  });

  // Test getting messages
  describe('GET /api/chat/conversations/:conversationId/messages', () => {
    it('should get messages for a conversation', async () => {
      const response = await request(app)
        .get(`/api/chat/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.messages)).toBe(true);
      expect(response.body.messages.length).toBeGreaterThan(0);
      expect(response.body.pagination).toBeDefined();
    });

    it('should paginate messages', async () => {
      const response = await request(app)
        .get(`/api/chat/conversations/${conversationId}/messages?page=1&limit=1`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.messages.length).toBeLessThanOrEqual(1);
      expect(response.body.pagination.limit).toBe(1);
    });

    it('should fail when conversation not found or access denied', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/chat/conversations/${fakeId}/messages`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Conversation not found or access denied');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/api/chat/conversations/${conversationId}/messages`);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Missing token');
    });
  });

  // Test marking messages as read
  describe('PUT /api/chat/conversations/:conversationId/read', () => {
    it('should mark messages as read successfully', async () => {
      const response = await request(app)
        .put(`/api/chat/conversations/${conversationId}/read`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Messages marked as read');
      expect(response.body.modifiedCount).toBeDefined();
    });

    it('should fail when conversation not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/chat/conversations/${fakeId}/read`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Conversation not found or access denied');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .put(`/api/chat/conversations/${conversationId}/read`);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Missing token');
    });
  });

  // Test getting unread count
  describe('GET /api/chat/unread-count', () => {
    it('should get unread message count', async () => {
      const response = await request(app)
        .get('/api/chat/unread-count')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.unreadCount).toBeDefined();
      expect(typeof response.body.unreadCount).toBe('number');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/chat/unread-count');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Missing token');
    });
  });

  // Test deleting messages
  describe('DELETE /api/chat/messages/:messageId', () => {
    it('should delete own message successfully', async () => {
      const response = await request(app)
        .delete(`/api/chat/messages/${messageId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Message deleted successfully');
    });

    it('should fail when trying to delete another user\'s message', async () => {
      // Create a message from owner first
      const ownerMessage = new Message({
        conversationId,
        senderId: ownerId,
        content: 'Owner message',
        readBy: [{ userId: ownerId, readAt: new Date() }]
      });
      await ownerMessage.save();

      const response = await request(app)
        .delete(`/api/chat/messages/${ownerMessage._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Message not found or access denied');
    });

    it('should fail when message not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/chat/messages/${fakeId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Message not found or access denied');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .delete(`/api/chat/messages/${messageId}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Missing token');
    });
  });
});
