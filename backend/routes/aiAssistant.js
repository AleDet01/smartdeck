const express = require('express');
const { authMiddleware } = require('../controllers/auth');
const { generateTestWithAI, chatWithAI } = require('../controllers/aiAssistant');
const { validateAIPrompt } = require('../middleware/validation');
const { aiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Genera test usando AI (with rate limiting and validation)
router.post('/generate', aiLimiter, authMiddleware, validateAIPrompt, generateTestWithAI);

// Chat con AI (with rate limiting and validation)
router.post('/chat', aiLimiter, authMiddleware, chatWithAI);

module.exports = router;
