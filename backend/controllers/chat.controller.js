const Message = require('../models/message.model');
const Conversation = require('../models/conversation.model');


exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.query;
    const query = conversationId ? { conversationId } : {};
    const msgs = await Message.find(query).sort('createdAt');
    const formatted = msgs.map((m) => ({ id: m._id, text: m.text }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.setupSocket = (io) => {
  io.on('connection', async (socket) => {
    try {
      const msgs = await Message.find().sort('createdAt');
      socket.emit('chat history', msgs.map((m) => ({ id: m._id, text: m.text })));
    } catch (err) {
      console.error('Error loading messages:', err.message);
    }

    socket.on('chat message', async (msg) => {
      try {
        const message = new Message({ text: msg });
        await message.save();
        io.emit('chat message', { id: message._id, text: message.text });
      } catch (err) {
        console.error('Error saving message:', err.message);
      }
    });
  });
};

exports.createConversation = async (req, res) => {
  try {
    const { participants } = req.body;
    const conversation = new Conversation({ participants });
    await conversation.save();
    res.status(201).json({ message: 'Conversation created', conversation });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.listConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find().populate('participants', 'name');
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
