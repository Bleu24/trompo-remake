const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProductsByBusiness,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  uploadImages,
} = require('../controllers/product.controller');
const auth = require('../middleware/auth.middleware');

router.get('/', getAllProducts); // Public: list all products
router.get('/search', searchProducts); // Wildcard search
router.get('/business/:businessId', getProductsByBusiness); // Products for a business
router.get('/:id', getProductById); // Detail view
router.post('/', auth, uploadImages, createProduct); // Create product with images
router.put('/:id', auth, uploadImages, updateProduct); // Update product with images
router.delete('/:id', auth, deleteProduct); // Delete product

module.exports = router;
