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
    const userId = req.user?.id || req.body.userId;
    if (!userId) return res.status(401).json({ error: 'Utente non autenticato' });
    
    const testResult = await TestResult.create({ ...req.body, userId });
    res.status(201).json({ message: 'Test salvato', testResult });
  } catch (err) {
    res.status(500).json({ error: 'Errore salvataggio test', details: err.message });
  }
};

// Statistiche per utente e area
exports.getStatsByArea = async (req, res) => {
  try {
    const results = await TestResult.find(req.params);
    res.json({ stats: results.length ? calculateStats(results) : null, results });
  } catch (err) {
    res.status(500).json({ error: 'Errore recupero statistiche', details: err.message });
  }
};

// Statistiche aggregate per area (tutti gli utenti)
exports.getAggregateByArea = async (req, res) => {
  try {
    const results = await TestResult.find(req.params);
    if (!results.length) return res.json({ stats: null });
    
    const bins = [0, 0, 0, 0, 0];
    results.forEach(r => bins[Math.min(Math.floor((r.correctCount / r.numQuestions) * 5), 4)]++);
    
    res.json({ stats: { ...calculateStats(results), bins }, results });
  } catch (err) {
    res.status(500).json({ error: 'Errore recupero aggregate', details: err.message });
  }
};

// Recent results per area (limit)
exports.getRecentByArea = async (req, res) => {
  try {
    const results = await TestResult.find(req.params).sort({ createdAt: -1 }).limit(parseInt(req.query.limit) || 20);
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: 'Errore recupero recenti', details: err.message });
  }
};

// Wrong answers by user and area (flattened), latest first, de-duplicated by question+correctAnswer
exports.getWrongAnswersByUserArea = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const results = await TestResult.find(req.params).sort({ createdAt: -1 }).limit(150);
    
    const wrong = [], seen = new Set();
    
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
