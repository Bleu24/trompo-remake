const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProductsByBusiness,
  getProductById,
} = require('../controllers/product.controller');

router.get('/', getAllProducts); // Public: list all products
router.get('/business/:businessId', getProductsByBusiness); // Products for a business
router.get('/:id', getProductById); // Detail view

module.exports = router;
