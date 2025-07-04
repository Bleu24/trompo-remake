let messages = [];

exports.getMessages = (req, res) => {
  res.json(messages);
};

exports.setupSocket = (io) => {
  io.on('connection', (socket) => {
    socket.emit('chat history', messages);

    socket.on('chat message', (msg) => {
      const message = { id: Date.now(), text: msg };
      messages.push(message);
      io.emit('chat message', message);
    });
  });
};
