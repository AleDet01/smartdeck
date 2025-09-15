const express = require('express');
const router = express.Router();
const { getFlash, getFlashByThematicArea, createFlashcards, listThematicAreas } = require('../controllers/flash');

// GET /flash - tutte le flashcard
router.get('/', (req, res, next) => {
	console.log('GET /flash chiamata');
	next();
}, getFlash);

// GET /flash/thematic/:thematicArea - flashcard per area tematica
router.get('/thematic/:thematicArea', (req, res, next) => {
	console.log('GET /flash/thematic/' + req.params.thematicArea + ' chiamata');
	next();
}, getFlashByThematicArea);

// POST /flash - crea nuove flashcards (bulk)
router.post('/', (req, res, next) => {
	console.log('POST /flash chiamata');
	next();
}, createFlashcards);

// GET /flash/areas/list - lista aree tematiche
router.get('/areas/list', (req, res, next) => {
	console.log('GET /flash/areas/list chiamata');
	next();
}, listThematicAreas);

module.exports = router;
