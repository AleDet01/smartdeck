const express = require('express');
const { register, login, me, logout, getAllUsers } = require('../controllers/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', me);
router.post('/logout', logout);
router.get('/_users', getAllUsers);

module.exports = router;
