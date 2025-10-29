const TestResult = require('../models/testResult');

const calculateStats = (results) => {
  const totalTests = results.length;
  const totalQuestions = results.reduce((sum, r) => sum + r.numQuestions, 0);
  const totalCorrect = results.reduce((sum, r) => sum + r.correctCount, 0);
  const totalTime = results.reduce((sum, r) => sum + r.totalTime, 0);
  
  return {
    totalTests,
    totalQuestions,
    totalCorrect,
    totalTime,
    avgTime: totalTime / totalQuestions,
    avgScore: totalCorrect / totalQuestions
  };
};

// Salva un nuovo risultato test
exports.saveTestResult = async (req, res) => {
  try {
    const { area, numQuestions, answers, correctCount, totalTime } = req.body;
    const effectiveUserId = req.user?.id || req.body.userId;
    
    if (!effectiveUserId) {
      return res.status(401).json({ error: 'Utente non autenticato' });
    }
    
    const testResult = await new TestResult({ 
      userId: effectiveUserId, 
      area, 
      numQuestions, 
      answers, 
      correctCount, 
      totalTime 
    }).save();
    
    res.status(201).json({ message: 'Test salvato', testResult });
  } catch (err) {
    res.status(500).json({ error: 'Errore salvataggio test', details: err.message });
  }
};

// Statistiche per utente e area
exports.getStatsByArea = async (req, res) => {
  try {
    const { userId, area } = req.params;
    const results = await TestResult.find({ userId, area });
    
    if (!results.length) {
      return res.json({ stats: null });
    }
    
    res.json({ stats: calculateStats(results), results });
  } catch (err) {
    res.status(500).json({ error: 'Errore recupero statistiche', details: err.message });
  }
};

// Lista aree disponibili (distinct)
exports.listAreas = async (req, res) => {
  try {
    const { userId } = req.query;
    const query = userId ? { userId } : {};
    const areas = await TestResult.distinct('area', query);
    console.log('[testResult.listAreas] found areas:', areas.length, 'for userId:', userId || 'ALL');
    res.json({ areas });
  } catch (err) {
    res.status(500).json({ error: 'Errore recupero aree', details: err.message });
  }
};

// Statistiche aggregate per area (tutti gli utenti)
exports.getAggregateByArea = async (req, res) => {
  try {
    const { area } = req.params;
    const results = await TestResult.find({ area });
    
    if (!results.length) {
      return res.json({ stats: null });
    }
    
    const stats = calculateStats(results);
    
    // Build distribution of scores (percentage bins)
    const scores = results.map(r => Math.round((r.correctCount / r.numQuestions) * 100));
    const bins = [0, 0, 0, 0, 0];
    scores.forEach(s => {
      const idx = Math.min(Math.floor(s / 20), 4);
      bins[idx]++;
    });
    
    res.json({ stats: { ...stats, bins }, results });
  } catch (err) {
    res.status(500).json({ error: 'Errore recupero aggregate', details: err.message });
  }
};

// Recent results per area (limit)
exports.getRecentByArea = async (req, res) => {
  try {
    const { area } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const results = await TestResult.find({ area }).sort({ createdAt: -1 }).limit(limit);
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: 'Errore recupero recenti', details: err.message });
  }
};

// Wrong answers by user and area (flattened), latest first, de-duplicated by question+correctAnswer
exports.getWrongAnswersByUserArea = async (req, res) => {
  try {
    const { userId, area } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const results = await TestResult.find({ userId, area }).sort({ createdAt: -1 }).limit(150);
    
    const wrong = [];
    const seen = new Set();
    
    for (const r of results) {
      if (wrong.length >= limit) break;
      
      for (const a of (r.answers || [])) {
        if (!a?.isCorrect) {
          const key = `${a.question?.trim() || ''}||${a.correctAnswer?.trim() || ''}`.toLowerCase();
          
          if (!seen.has(key)) {
            wrong.push({
              question: a.question?.trim() || '',
              userAnswer: a.userAnswer,
              correctAnswer: a.correctAnswer?.trim() || '',
              createdAt: r.createdAt
            });
            seen.add(key);
            
            if (wrong.length >= limit) break;
          }
        }
      }
    }
    
    res.json({ wrong });
  } catch (err) {
    res.status(500).json({ error: 'Errore recupero risposte sbagliate', details: err.message });
  }
};
