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

// Indici per query veloci
testSessionSchema.index({ userId: 1, completedAt: -1 });
testSessionSchema.index({ userId: 1, thematicArea: 1 });

module.exports = mongoose.model('TestSession', testSessionSchema, 'testSessions');
