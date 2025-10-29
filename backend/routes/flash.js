const express = require('express');
const { optionalAuthMiddleware, authMiddleware } = require('../controllers/auth');
const { getFlash, getFlashByThematicArea, createFlashcards, listThematicAreas } = require('../controllers/flash');

const router = express.Router();

router.get('/', optionalAuthMiddleware, getFlash);
router.get('/areas/list', optionalAuthMiddleware, listThematicAreas);
router.get('/thematic/:thematicArea', optionalAuthMiddleware, getFlashByThematicArea);
router.post('/', authMiddleware, createFlashcards);

module.exports = router;
