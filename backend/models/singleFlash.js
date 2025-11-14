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
	createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
	isActive: { type: Boolean, default: true }, // Soft delete
	usageCount: { type: Number, default: 0 }, // Track popolarità
	lastUsed: { type: Date }
}, {
	timestamps: true,
	versionKey: false
});

// Indexes per query ottimizzate in produzione
flashcardSchema.index({ createdBy: 1, thematicArea: 1 }); // Cerca test per utente/area
flashcardSchema.index({ createdBy: 1, createdAt: -1 }); // Cronologia utente
flashcardSchema.index({ thematicArea: 1, difficulty: 1 }); // Filtra per area/difficoltà
flashcardSchema.index({ createdBy: 1, isActive: 1 }); // Query active flashcards
flashcardSchema.index({ usageCount: -1, thematicArea: 1 }); // Flashcard più popolari

// Method per incrementare usage
flashcardSchema.methods.incrementUsage = function() {
	this.usageCount += 1;
	this.lastUsed = new Date();
	return this.save();
};

module.exports = mongoose.model('Flashcard', flashcardSchema, 'datasmartdeckCollection');
