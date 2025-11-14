const mongoose = require('mongoose');

const questionResultSchema = new mongoose.Schema({
	questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flashcard' },
	questionText: { type: String, required: true },
	userAnswerIndex: { type: Number, required: true },
	userAnswerText: { type: String, required: true },
	correctAnswerIndex: { type: Number, required: true },
	correctAnswerText: { type: String, required: true },
	isCorrect: { type: Boolean, required: true },
	timeSpent: { type: Number, default: 0 } // secondi per rispondere
});

const testSessionSchema = new mongoose.Schema({
	userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	thematicArea: { type: String, required: true },
	totalQuestions: { type: Number, required: true },
	correctAnswers: { type: Number, required: true },
	wrongAnswers: { type: Number, required: true },
	score: { type: Number, required: true }, // percentuale 0-100
	duration: { type: Number, required: true }, // durata totale in secondi
	questions: [questionResultSchema],
	completedAt: { type: Date, default: Date.now }
}, {
	timestamps: true
});

// Indici ottimizzati per produzione
testSessionSchema.index({ userId: 1, completedAt: -1 }); // Cronologia user
testSessionSchema.index({ userId: 1, thematicArea: 1 }); // Filtra per area
testSessionSchema.index({ userId: 1, score: -1 }); // Best scores
testSessionSchema.index({ thematicArea: 1, score: -1 }); // Leaderboard per area
testSessionSchema.index({ completedAt: -1 }); // Recent tests globali
testSessionSchema.index({ userId: 1, 'questions.isCorrect': 1 }); // Analytics risposte

// Virtual per calcoli aggregati
testSessionSchema.virtual('averageTimePerQuestion').get(function() {
	return this.totalQuestions > 0 ? Math.round(this.duration / this.totalQuestions) : 0;
});

testSessionSchema.virtual('accuracyRate').get(function() {
	return this.totalQuestions > 0 ? Math.round((this.correctAnswers / this.totalQuestions) * 100) : 0;
});

// Method per statistiche avanzate
testSessionSchema.statics.getUserStats = async function(userId, daysBack = 30) {
	const since = new Date();
	since.setDate(since.getDate() - daysBack);
	
	return await this.aggregate([
		{ $match: { userId: mongoose.Types.ObjectId(userId), completedAt: { $gte: since } } },
		{ $group: {
			_id: null,
			totalTests: { $sum: 1 },
			avgScore: { $avg: '$score' },
			totalQuestions: { $sum: '$totalQuestions' },
			totalCorrect: { $sum: '$correctAnswers' },
			avgDuration: { $avg: '$duration' }
		}}
	]);
};

module.exports = mongoose.model('TestSession', testSessionSchema, 'testSessions');
