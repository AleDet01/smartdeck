const express = require('express');
const { authMiddleware } = require('../controllers/auth');
const { saveTestSession, getUserStatistics, getAreaStatistics } = require('../controllers/statistics');

const router = express.Router();

// Salva una nuova sessione di test
router.post('/session', authMiddleware, saveTestSession);

// Ottieni tutte le statistiche dell'utente
router.get('/', authMiddleware, getUserStatistics);

// Ottieni le statistiche per una specifica area tematica
router.get('/area/:area', authMiddleware, getAreaStatistics);

module.exports = router;
