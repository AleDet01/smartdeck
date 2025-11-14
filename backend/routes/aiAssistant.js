const express = require('express');
const { authMiddleware } = require('../controllers/auth');
const { generateTestWithAI, chatWithAI, streamChatWithAI } = require('../controllers/aiAssistant');
const { validateAIPrompt } = require('../middleware/validation');
const { aiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Genera test usando AI (with rate limiting and validation)
router.post('/generate', aiLimiter, authMiddleware, validateAIPrompt, generateTestWithAI);

// Chat con AI normale (with rate limiting and validation)
router.post('/chat', aiLimiter, authMiddleware, chatWithAI);

// Chat con AI streaming (GPT-4o, GPT-4o-mini, O1-preview support)
router.post('/stream', aiLimiter, authMiddleware, validateAIPrompt, streamChatWithAI);

module.exports = router;
