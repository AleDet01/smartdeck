const express = require('express');
const { authMiddleware } = require('../controllers/auth');
const {
	saveTestResult,
	listAreas,
	getStatsByArea,
	getAggregateByArea,
	getRecentByArea,
	getWrongAnswersByUserArea
} = require('../controllers/testResult');

const router = express.Router();

// POST - salva risultato test (richiede autenticazione)
router.post('/', authMiddleware, saveTestResult);

// GET - lista aree
router.get('/areas/list', listAreas);

// GET - aggregate stats per area
router.get('/aggregate/:area', getAggregateByArea);

// GET - recent results per area
router.get('/recent/:area', getRecentByArea);

// GET - wrong answers for user and area
router.get('/wrong/:userId/:area', getWrongAnswersByUserArea);

// GET - statistiche per utente e area
router.get('/:userId/:area', getStatsByArea);

module.exports = router;
