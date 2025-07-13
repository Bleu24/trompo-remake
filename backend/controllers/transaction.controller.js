const Transaction = require('../models/transaction.model');
const Customer = require('../models/customer.model');
const { createOrderNotification } = require('./notification.controller');

// Get all transactions for a customer
exports.getCustomerTransactions = async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const customer = await Customer.findOne({ userId: req.user.userId });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const transactions = await Transaction.find({ customerId: customer._id })
      .populate('businessId', 'name')
      .populate('sellableId', 'title price')
      .sort({ createdAt: -1 });
    
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get transaction by ID
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('customerId')
      .populate('businessId', 'name')
      .populate('sellableId', 'title price');
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    // Check if user is authorized to view this transaction
    if (req.user.role === 'customer') {
      const customer = await Customer.findOne({ userId: req.user.userId });
      if (!customer || transaction.customerId.toString() !== customer._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }
    
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Create a new transaction
exports.createTransaction = async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const customer = await Customer.findOne({ userId: req.user.userId });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const { businessId, sellableId, amount, paymentMethod } = req.body;
    
    const transaction = new Transaction({
      customerId: customer._id,
      businessId,
      sellableId,
      amount,
      paymentMethod,
      status: 'pending'
    });
    
    await transaction.save();
    
    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('businessId', 'name')
      .populate('sellableId', 'title price')
      .populate({
        path: 'customerId',
        populate: { path: 'userId', select: 'name email' }
      });
    
    // Create notification for business owner
    try {
      console.log('Creating order notification for transaction:', populatedTransaction._id);
      await createOrderNotification(populatedTransaction, 'order_placed', req.io);
      console.log('Order notification created successfully');
    } catch (notifErr) {
      console.error('Failed to create order notification:', notifErr);
      // Don't fail the transaction creation if notification fails
    }
    
    res.status(201).json({ 
      message: 'Transaction created successfully', 
      transaction: populatedTransaction 
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update transaction status
exports.updateTransactionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('businessId', 'name ownerId')
    .populate('sellableId', 'title price')
    .populate({
      path: 'customerId',
      populate: { path: 'userId', select: 'name email' }
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    // Create notification for customer about status change
    try {
      const notificationType = status === 'completed' ? 'order_completed' 
                             : status === 'cancelled' ? 'order_cancelled'
                             : 'order_confirmed';
      await createOrderNotification(transaction, notificationType, req.io);
    } catch (notifErr) {
      console.error('Failed to create status update notification:', notifErr);
      // Don't fail the status update if notification fails
    }
    
    res.json({ message: 'Transaction status updated', transaction });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all transactions (admin only)
exports.getAllTransactions = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const transactions = await Transaction.find()
      .populate('customerId')
      .populate('businessId', 'name')
      .populate('sellableId', 'title price')
      .sort({ createdAt: -1 });
    
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
