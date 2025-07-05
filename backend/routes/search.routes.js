const express = require('express');
const router = express.Router();

const {
  globalSearch,
  getSearchSuggestions,
} = require('../controllers/search.controller');

router.get('/', globalSearch);
router.get('/suggestions', getSearchSuggestions);

module.exports = router;
