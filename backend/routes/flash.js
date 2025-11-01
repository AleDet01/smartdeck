const express = require('express');
const { optionalAuthMiddleware, authMiddleware } = require('../controllers/auth');
const { getFlash, getFlashByThematicArea, createFlashcards, listThematicAreas } = require('../controllers/flash');

const router = express.Router();
// Crea un miniapp express indipendente per esporre singolarmente queste route

router.get('/', optionalAuthMiddleware, getFlash); // dammi tutte le flashcards
router.get('/areas/list', optionalAuthMiddleware, listThematicAreas); 
// dammi una lista di tutte le aree esistenti delle flashcards
router.get('/thematic/:thematicArea', optionalAuthMiddleware, getFlashByThematicArea);
// dammi tutte le flashcards per thematicArea
router.post('/', authMiddleware, createFlashcards);
// Creami delle flashcards

module.exports = router;
