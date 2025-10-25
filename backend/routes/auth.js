const express = require('express');
const { register, login, me, logout, startGoogleAuth, googleCallback } = require('../controllers/auth');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', me);
router.post('/logout', logout);

// OAuth Google
router.get('/google', startGoogleAuth);
router.get('/google/callback', googleCallback);

router.get('/_users', async (req, res) => {
	try {
		const users = await require('../models/user').find().select('-password');
		res.json({ users });
	} catch (err) {
		res.status(500).json({ error: 'Errore recupero utenti', details: err.message });
	}
});

module.exports = router;
