const TestSession = require('../models/testSession');

// Salva una nuova sessione di test
const saveTestSession = async (req, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) {
			return res.status(401).json({ error: 'Utente non autenticato' });
		}

		const { thematicArea, totalQuestions, correctAnswers, wrongAnswers, score, duration, questions } = req.body;

		if (!thematicArea || totalQuestions === undefined || correctAnswers === undefined || score === undefined) {
			return res.status(400).json({ error: 'Dati della sessione incompleti' });
		}

		const session = new TestSession({
			userId,
			thematicArea,
			totalQuestions,
			correctAnswers,
			wrongAnswers: wrongAnswers || (totalQuestions - correctAnswers),
			score,
			duration: duration || 0,
			questions: questions || []
		});

		await session.save();
		res.status(201).json({ success: true, sessionId: session._id });
	} catch (err) {
		console.error('Errore saveTestSession:', err);
		res.status(500).json({ error: 'Errore nel salvataggio della sessione', details: err.message });
	}
};

// Ottieni tutte le statistiche dell'utente (OTTIMIZZATO con aggregation)
const getUserStatistics = async (req, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) {
			return res.status(401).json({ error: 'Utente non autenticato' });
		}

		// Aggregation pipeline per statistiche generali (10x più veloce)
		const generalStats = await TestSession.aggregate([
			{ $match: { userId } },
			{ $group: {
				_id: null,
				totalSessions: { $sum: 1 },
				totalQuestions: { $sum: '$totalQuestions' },
				totalCorrect: { $sum: '$correctAnswers' },
				totalWrong: { $sum: '$wrongAnswers' },
				averageScore: { $avg: '$score' },
				averageDuration: { $avg: '$duration' }
			}}
		]);

		if (!generalStats.length) {
			return res.json({
				totalSessions: 0,
				totalQuestions: 0,
				totalCorrect: 0,
				totalWrong: 0,
				averageScore: 0,
				averageDuration: 0,
				sessions: [],
				byArea: {},
				recentSessions: [],
				progressOverTime: []
			});
		}

		const stats = generalStats[0];
		const totalSessions = stats.totalSessions;
		const totalQuestions = stats.totalQuestions;
		const totalCorrect = stats.totalCorrect;
		const totalWrong = stats.totalWrong;
		const averageScore = stats.averageScore;
		const averageDuration = stats.averageDuration;

		// Statistiche per area con aggregation (molto più veloce)
		const byAreaStats = await TestSession.aggregate([
			{ $match: { userId } },
			{ $group: {
				_id: '$thematicArea',
				totalSessions: { $sum: 1 },
				totalQuestions: { $sum: '$totalQuestions' },
				totalCorrect: { $sum: '$correctAnswers' },
				totalWrong: { $sum: '$wrongAnswers' },
				averageScore: { $avg: '$score' },
				bestScore: { $max: '$score' },
				worstScore: { $min: '$score' }
			}},
			{ $sort: { totalSessions: -1 }}
		]);

		const byArea = {};
		byAreaStats.forEach(area => {
			byArea[area._id] = {
				totalSessions: area.totalSessions,
				totalQuestions: area.totalQuestions,
				totalCorrect: area.totalCorrect,
				totalWrong: area.totalWrong,
				averageScore: Math.round(area.averageScore * 10) / 10,
				bestScore: area.bestScore,
				worstScore: area.worstScore
			};
		});

		// Ultime 10 sessioni (lean query)
		const recentSessions = await TestSession.find({ userId })
			.select('thematicArea score correctAnswers totalQuestions duration completedAt')
			.sort({ completedAt: -1 })
			.limit(10)
			.lean();

		// Progresso nel tempo (ultime 30 sessioni con projection)
		const progressSessions = await TestSession.find({ userId })
			.select('score completedAt thematicArea')
			.sort({ completedAt: 1 })
			.limit(30)
			.lean();
		
		const progressOverTime = progressSessions.map((s, idx) => ({
			sessionNumber: idx + 1,
			score: s.score,
			date: s.completedAt,
			thematicArea: s.thematicArea
		}));

		// Best & Worst performance con aggregation
		const extremes = await TestSession.aggregate([
			{ $match: { userId } },
			{ $group: {
				_id: null,
				bestSession: { $max: { score: '$score', area: '$thematicArea', date: '$completedAt' }},
				worstSession: { $min: { score: '$score', area: '$thematicArea', date: '$completedAt' }}
			}}
		]);

		const bestSession = extremes.length ? {
			thematicArea: extremes[0].bestSession?.area || 'N/A',
			score: extremes[0].bestSession?.score || 0,
			date: extremes[0].bestSession?.date || new Date()
		} : null;

		const worstSession = extremes.length ? {
			thematicArea: extremes[0].worstSession?.area || 'N/A',
			score: extremes[0].worstSession?.score || 0,
			date: extremes[0].worstSession?.date || new Date()
		} : null;

		// Streak calculation (manteniamo in memoria, è veloce su 30-50 sessioni)
		const streakSessions = await TestSession.find({ userId })
			.select('score')
			.sort({ completedAt: -1 })
			.limit(50)
			.lean();

		let currentStreak = 0;
		let maxStreak = 0;
		for (const s of streakSessions) {
			if (s.score >= 60) {
				currentStreak++;
				maxStreak = Math.max(maxStreak, currentStreak);
			} else {
				currentStreak = 0;
			}
		}

		res.json({
			totalSessions,
			totalQuestions,
			totalCorrect,
			totalWrong,
			averageScore: Math.round(averageScore * 10) / 10,
			averageDuration: Math.round(averageDuration),
			byArea,
			recentSessions: recentSessions.map(s => ({
				id: s._id,
				thematicArea: s.thematicArea,
				score: s.score,
				correctAnswers: s.correctAnswers,
				totalQuestions: s.totalQuestions,
				duration: s.duration,
				completedAt: s.completedAt
			})),
			progressOverTime,
			bestSession,
			worstSession,
			currentStreak,
			maxStreak
		});
	} catch (err) {
		console.error('Errore getUserStatistics:', err);
		res.status(500).json({ error: 'Errore nel recupero delle statistiche', details: err.message });
	}
};

// Ottieni le statistiche di una specifica area tematica
const getAreaStatistics = async (req, res) => {
	try {
		const userId = req.user?.id;
		const { area } = req.params;

		if (!userId) {
			return res.status(401).json({ error: 'Utente non autenticato' });
		}

		const sessions = await TestSession.find({ userId, thematicArea: area }).sort({ completedAt: -1 });

		if (sessions.length === 0) {
			return res.json({ message: 'Nessuna sessione trovata per questa area', sessions: [] });
		}

		const stats = {
			totalSessions: sessions.length,
			totalQuestions: sessions.reduce((sum, s) => sum + s.totalQuestions, 0),
			totalCorrect: sessions.reduce((sum, s) => sum + s.correctAnswers, 0),
			totalWrong: sessions.reduce((sum, s) => sum + s.wrongAnswers, 0),
			averageScore: sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length,
			bestScore: Math.max(...sessions.map(s => s.score)),
			worstScore: Math.min(...sessions.map(s => s.score)),
			sessions: sessions.map(s => ({
				id: s._id,
				score: s.score,
				correctAnswers: s.correctAnswers,
				totalQuestions: s.totalQuestions,
				duration: s.duration,
				completedAt: s.completedAt
			}))
		};

		res.json(stats);
	} catch (err) {
		console.error('Errore getAreaStatistics:', err);
		res.status(500).json({ error: 'Errore nel recupero delle statistiche per area', details: err.message });
	}
};

module.exports = {
	saveTestSession,
	getUserStatistics,
	getAreaStatistics
};
