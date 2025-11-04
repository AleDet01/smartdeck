const express = require('express');
const { authMiddleware } = require('../controllers/auth');
const { generateTestWithAI, chatWithAI } = require('../controllers/aiAssistant');

const router = express.Router();

// Genera test usando AI
router.post('/generate', authMiddleware, generateTestWithAI);

// Chat con AI
router.post('/chat', authMiddleware, chatWithAI);

module.exports = router;
