const express = require('express');
const { register, login, me, logout } = require('../controllers/auth');
const { validateLogin, validateRegister } = require('../middleware/validation');
const { authLimiter, registerLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Register with validation and rate limiting
router.post('/register', registerLimiter, validateRegister, register);

// Login with validation and rate limiting
router.post('/login', authLimiter, validateLogin, login);

// Get current user (protected)
router.get('/me', me);

// Logout
router.post('/logout', logout);

module.exports = router;
