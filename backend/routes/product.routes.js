const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const auth = require('../middleware/auth.middleware');
const { requireOwner } = require('../middleware/roles.middleware');

// Public routes
router.get('/', productController.getAllProducts);
router.get('/business/:businessId', productController.getProductsByBusiness);
router.get('/:id', productController.getProductById);

// Owner-only routes
router.post('/', auth, requireOwner, productController.createProduct);
router.put('/:id', auth, requireOwner, productController.updateProduct);
router.delete('/:id', auth, requireOwner, productController.deleteProduct);

module.exports = router;
