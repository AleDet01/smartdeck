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

// Ottieni tutte le statistiche dell'utente
const getUserStatistics = async (req, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) {
			return res.status(401).json({ error: 'Utente non autenticato' });
		}

		// Tutte le sessioni dell'utente
		const sessions = await TestSession.find({ userId }).sort({ completedAt: -1 });

		if (sessions.length === 0) {
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
				progressOverTime: [],
				difficultyDistribution: { facile: 0, media: 0, difficile: 0 }
			});
		}

		// Statistiche generali
		const totalSessions = sessions.length;
		const totalQuestions = sessions.reduce((sum, s) => sum + s.totalQuestions, 0);
		const totalCorrect = sessions.reduce((sum, s) => sum + s.correctAnswers, 0);
		const totalWrong = sessions.reduce((sum, s) => sum + s.wrongAnswers, 0);
		const averageScore = sessions.reduce((sum, s) => sum + s.score, 0) / totalSessions;
		const averageDuration = sessions.reduce((sum, s) => sum + s.duration, 0) / totalSessions;

		// Statistiche per area tematica
		const byArea = {};
		sessions.forEach(s => {
			if (!byArea[s.thematicArea]) {
				byArea[s.thematicArea] = {
					totalSessions: 0,
					totalQuestions: 0,
					totalCorrect: 0,
					totalWrong: 0,
					averageScore: 0,
					bestScore: 0,
					worstScore: 100,
					scores: []
				};
			}
			const area = byArea[s.thematicArea];
			area.totalSessions++;
			area.totalQuestions += s.totalQuestions;
			area.totalCorrect += s.correctAnswers;
			area.totalWrong += s.wrongAnswers;
			area.scores.push(s.score);
			area.bestScore = Math.max(area.bestScore, s.score);
			area.worstScore = Math.min(area.worstScore, s.score);
		});

		// Calcola media per area
		Object.keys(byArea).forEach(area => {
			const data = byArea[area];
			data.averageScore = data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length;
		});

		// Ultime 10 sessioni
		const recentSessions = sessions.slice(0, 10).map(s => ({
			id: s._id,
			thematicArea: s.thematicArea,
			score: s.score,
			correctAnswers: s.correctAnswers,
			totalQuestions: s.totalQuestions,
			duration: s.duration,
			completedAt: s.completedAt
		}));

		// Progresso nel tempo (ultime 30 sessioni)
		const progressOverTime = sessions.slice(0, 30).reverse().map((s, idx) => ({
			sessionNumber: idx + 1,
			score: s.score,
			date: s.completedAt,
			thematicArea: s.thematicArea
		}));

		// Best & Worst performance
		const bestSession = sessions.reduce((best, s) => s.score > best.score ? s : best, sessions[0]);
		const worstSession = sessions.reduce((worst, s) => s.score < worst.score ? s : worst, sessions[0]);

		// Streak (sessioni consecutive con score >= 60%)
		let currentStreak = 0;
		let maxStreak = 0;
		for (const s of sessions) {
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
			sessions: sessions.map(s => ({
				id: s._id,
				thematicArea: s.thematicArea,
				score: s.score,
				correctAnswers: s.correctAnswers,
				totalQuestions: s.totalQuestions,
				duration: s.duration,
				completedAt: s.completedAt
			})),
			byArea,
			recentSessions,
			progressOverTime,
			bestSession: {
				thematicArea: bestSession.thematicArea,
				score: bestSession.score,
				date: bestSession.completedAt
			},
			worstSession: {
				thematicArea: worstSession.thematicArea,
				score: worstSession.score,
				date: worstSession.completedAt
			},
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
