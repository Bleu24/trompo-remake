const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProductsByBusiness,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/product.controller');
const auth = require('../middleware/auth.middleware');

router.get('/', getAllProducts); // Public: list all products
router.get('/business/:businessId', getProductsByBusiness); // Products for a business
router.get('/:id', getProductById); // Detail view
router.post('/', auth, createProduct); // Create product
router.put('/:id', auth, updateProduct); // Update product
router.delete('/:id', auth, deleteProduct); // Delete product

module.exports = router;
