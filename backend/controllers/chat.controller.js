const jwt = require('jsonwebtoken');

let messages = [];

exports.getMessages = (req, res) => {
  res.json(messages);
};

exports.setupSocket = (io) => {
  io.on('connection', (socket) => {
    const token = socket.handshake.query?.token;
    if (!token) {
      return socket.disconnect(true);
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
    } catch (err) {
      return socket.disconnect(true);
    }

    socket.emit('chat history', messages);

    socket.on('chat message', (msg) => {
      const message = { id: Date.now(), text: msg };
      messages.push(message);
      io.emit('chat message', message);
    });
  });
};
