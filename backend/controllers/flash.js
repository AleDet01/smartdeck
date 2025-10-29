const Flashcard = require('../models/singleFlash');

const getUserId = (req) => req.user?.id || null;

const buildUserQuery = (userId, additionalFields = {}) => 
	userId ? { ...additionalFields, createdBy: userId } : additionalFields;

const getFlash = async (req, res) => {
	try {
		const userId = getUserId(req);
		const flashcards = await Flashcard.find(buildUserQuery(userId));
		console.log('Flashcard trovate per user', userId, ':', flashcards.length);
		res.json(flashcards);
	} catch (err) {
		console.error('Errore getFlash:', err);
		res.status(500).json({ error: 'Errore nel recupero delle flashcard', details: err.message });
	}
};

const getFlashByThematicArea = async (req, res) => {
	const { thematicArea } = req.params;
	try {
		const userId = getUserId(req);
		const flashcards = await Flashcard.find(buildUserQuery(userId, { thematicArea }));
		res.json(flashcards);
	} catch (err) {
		console.error('Errore getFlashByThematicArea:', err);
		res.status(500).json({ error: 'Errore nel recupero delle flashcard per area tematica', details: err.message });
	}
};

const createFlashcards = async (req, res) => {
	try {
		const userId = getUserId(req);
		const payload = req.body;
		let docs;
		
		if (Array.isArray(payload)) {
			docs = payload.map(item => ({ ...item, createdBy: userId }));
		} else if (payload?.questions && payload?.thematicArea) {
			docs = payload.questions.map(q => ({
				question: q.question,
				answers: q.answers,
				thematicArea: payload.thematicArea,
				difficulty: q.difficulty || 'media',
				createdBy: userId
			}));
		} else {
			return res.status(400).json({ error: 'Payload non valido per createFlashcards' });
		}
		
		const created = await Flashcard.insertMany(docs);
		res.status(201).json({ createdCount: created.length, created });
	} catch (err) {
		console.error('Errore createFlashcards:', err);
		res.status(500).json({ error: 'Errore nella creazione delle flashcards', details: err.message });
	}
};

const listThematicAreas = async (req, res) => {
	try {
		const userId = getUserId(req);
		const areas = await Flashcard.distinct('thematicArea', buildUserQuery(userId));
		res.json({ areas });
	} catch (err) {
		console.error('Errore listThematicAreas:', err);
		res.status(500).json({ error: 'Errore nel recupero delle aree tematiche', details: err.message });
	}
};

module.exports = {
	getFlash,
	getFlashByThematicArea,
	createFlashcards,
	listThematicAreas
};
