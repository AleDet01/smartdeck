const Flashcard = require('../models/singleFlash');

// GET /flash - restituisce tutte le flashcard
const getFlash = async (req, res) => {
			 try {
							 const flashcards = await Flashcard.find();
							 console.log('Numero flashcard trovate:', flashcards.length);
							 if (flashcards.length === 0) {
								 console.log('Nessuna flashcard trovata.');
							 } else {
								 console.log('Esempio flashcard:', JSON.stringify(flashcards[0], null, 2));
							 }
							 res.json(flashcards);
			 } catch (err) {
							 console.error('Errore dettagliato getFlash:', err);
							 res.status(500).json({ error: 'Errore nel recupero delle flashcard', details: err.message });
			 }
};

// GET /flash/thematic/:thematicArea - restituisce le flashcard per thematicArea
const getFlashByThematicArea = async (req, res) => {
	const { thematicArea } = req.params;
       try {
	       const flashcards = await Flashcard.find({ thematicArea });
	       res.json(flashcards);
       } catch (err) {
	       console.error('Errore dettagliato getFlashByThematicArea:', err);
	       res.status(500).json({ error: 'Errore nel recupero delle flashcard per area tematica', details: err.message });
       }
};

module.exports = {
	getFlash,
	getFlashByThematicArea
};

// Create multiple flashcards (bulk) --> questo metodo serve alla sezione "Crea nuovo test" per creare n flashcards
const createFlashcards = async (req, res) => {
	try {
		const payload = req.body;
		let docs = [];
		if (Array.isArray(payload)) {
			docs = payload;
		} else if (payload && payload.questions && payload.thematicArea) {
			docs = payload.questions.map(q => ({
				question: q.question,
				answers: q.answers,
				thematicArea: payload.thematicArea,
				difficulty: q.difficulty || 'media'
			}));
		} else {
			return res.status(400).json({ error: 'Payload non valido per createFlashcards' });
		}
		const created = await Flashcard.insertMany(docs);
		res.status(201).json({ createdCount: created.length, created });
	} catch (err) {
		console.error('Errore dettagliato createFlashcards:', err);
		res.status(500).json({ error: 'Errore nella creazione delle flashcards', details: err.message });
	}
};

const listThematicAreas = async (req, res) => {
	try {
		const areas = await Flashcard.distinct('thematicArea');
		res.json({ areas });
	} catch (err) {
		console.error('Errore dettagliato listThematicAreas:', err);
		res.status(500).json({ error: 'Errore nel recupero delle aree tematiche', details: err.message });
	}
};

module.exports = {
	getFlash,
	getFlashByThematicArea,
	createFlashcards,
	listThematicAreas
};
