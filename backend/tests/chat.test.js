const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const io = require('socket.io-client');

const PORT = process.env.PORT;

describe('Chat API', () => {
  let client;
  let token;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    token = jwt.sign({ userId: 'tester' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const socketUrl = process.env.NODE_ENV === 'production' 
      ? `https://trompo-remake.onrender.com` 
      : `http://localhost:${PORT}`;
    client = io(socketUrl, { auth: { token } });
    await new Promise((resolve) => client.on('connect', resolve));
  });

  afterAll(async () => {
    client.close();
    await mongoose.connection.close();
  });

  it('creates a conversation by sending messages', async () => {
    const messagePromise = new Promise((resolve) => client.once('chat message', resolve));
    client.emit('chat message', 'hello world');
    const message = await messagePromise;
    expect(message).toHaveProperty('text', 'hello world');
  });

  it('fetches conversation history', async () => {
    const res = await request(app).get('/api/chat/messages');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('authenticates socket connection using JWT', () => {
    expect(client.connected).toBe(true);
  });
});
