const express = require('express');
const router = express.Router();
const {
  getCustomerTransactions,
  getTransactionById,
  createTransaction,
  updateTransactionStatus,
  getAllTransactions
} = require('../controllers/transaction.controller');
const auth = require('../middleware/auth.middleware');

// Customer routes
router.get('/', auth, getCustomerTransactions); // Get customer's transactions
router.get('/:id', auth, getTransactionById); // Get specific transaction
router.post('/', auth, createTransaction); // Create new transaction

// Admin/Owner routes
router.put('/:id/status', auth, updateTransactionStatus); // Update transaction status
router.get('/admin/all', auth, getAllTransactions); // Get all transactions (admin only)

module.exports = router;
