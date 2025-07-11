const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const { register, login, getProfile, updateProfile, changePassword, deleteAccount, upload } = require('../controllers/auth.controller');

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, getProfile);
router.put('/profile', auth, upload.single('profilePicture'), updateProfile);
router.put('/change-password', auth, changePassword);
router.delete('/delete-account', auth, deleteAccount);

module.exports = router;
