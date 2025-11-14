const express = require('express');
const { authMiddleware } = require('../controllers/auth');
const { saveTestSession, getUserStatistics, getAreaStatistics } = require('../controllers/statistics');
const { cacheMiddleware, invalidateUserCache } = require('../middleware/cache');

const router = express.Router();

// POST invalida cache statistiche dopo save
router.post('/session', authMiddleware, async (req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode === 201 && req.user?.id) {
      invalidateUserCache(req.user.id);
    }
  });
  next();
}, saveTestSession);

// GET con cache (2 minuti - statistiche cambiano poco frequentemente)
router.get('/', authMiddleware, cacheMiddleware(120), getUserStatistics);
router.get('/area/:area', authMiddleware, cacheMiddleware(120), getAreaStatistics);

module.exports = router;
