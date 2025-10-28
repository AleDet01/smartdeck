const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
	text: { type: String, required: true },
	isCorrect: { type: Boolean, required: true }
});

const flashcardSchema = new mongoose.Schema({
	question: { type: String, required: true },
	answers: { type: [answerSchema], required: true, validate: [arr => arr.length === 3, 'Devi fornire esattamente 3 risposte'] },
	thematicArea: { type: String, required: true },
	difficulty: { type: String, required: true, enum: ['facile', 'media', 'difficile'] },
	createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Flashcard', flashcardSchema, 'datasmartdeckCollection');
