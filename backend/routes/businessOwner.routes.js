const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const {
  registerAsOwner,
  getMyOwnerProfile,
  createOwnerProduct,
  updateOwnerProduct,
  deleteOwnerProduct,
} = require('../controllers/businessOwner.controller');

router.post('/register', auth, registerAsOwner);
router.get('/me', auth, getMyOwnerProfile);
router.post('/products', auth, createOwnerProduct);
router.put('/products/:id', auth, updateOwnerProduct);
router.delete('/products/:id', auth, deleteOwnerProduct);

module.exports = router;
