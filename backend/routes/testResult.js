const express = require('express');
const router = express.Router();
const testResultController = require('../controllers/testResult');

// POST /testresult - salva risultato test
router.post('/', testResultController.saveTestResult);

// GET /testresult/areas - lista aree
router.get('/areas/list', testResultController.listAreas);

// GET /testresult/aggregate/:area - aggregate stats per area
router.get('/aggregate/:area', testResultController.getAggregateByArea);

// GET /testresult/recent/:area - recent results per area
router.get('/recent/:area', testResultController.getRecentByArea);

// GET /testresult/:userId/:area - statistiche per utente e area
router.get('/:userId/:area', testResultController.getStatsByArea);

module.exports = router;
