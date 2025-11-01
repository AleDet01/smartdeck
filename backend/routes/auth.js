const express = require('express');
const { register, login, me, logout } = require('../controllers/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', me);
router.post('/logout', logout);

module.exports = router;
