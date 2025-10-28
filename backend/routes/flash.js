const express = require('express');
const router = express.Router();
const { getFlash, getFlashByThematicArea, createFlashcards, listThematicAreas } = require('../controllers/flash');
const { optionalAuthMiddleware, authMiddleware } = require('../controllers/auth');

router.get('/', optionalAuthMiddleware, getFlash);
router.get('/thematic/:thematicArea', optionalAuthMiddleware, getFlashByThematicArea);
router.post('/', authMiddleware, createFlashcards);
router.get('/areas/list', optionalAuthMiddleware, listThematicAreas);

module.exports = router;
