const express = require('express');
const { optionalAuthMiddleware, authMiddleware } = require('../controllers/auth');
const { getFlash, getFlashByThematicArea, createFlashcards, listThematicAreas } = require('../controllers/flash');
const { cacheMiddleware, invalidateUserCache } = require('../middleware/cache');

const router = express.Router();

// GET routes con cache (5 minuti)
router.get('/', optionalAuthMiddleware, cacheMiddleware(300), getFlash);
router.get('/areas/list', optionalAuthMiddleware, cacheMiddleware(600), listThematicAreas); 
router.get('/thematic/:thematicArea', optionalAuthMiddleware, cacheMiddleware(300), getFlashByThematicArea);

// POST invalida cache utente
router.post('/', authMiddleware, async (req, res, next) => {
  // Hook per invalidare cache dopo creazione
  res.on('finish', () => {
    if (res.statusCode === 201 && req.user?.id) {
      invalidateUserCache(req.user.id);
    }
  });
  next();
}, createFlashcards);

module.exports = router;
