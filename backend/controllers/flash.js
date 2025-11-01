const Flashcard = require('../models/singleFlash');

const getUserId = (req) => req.user?.id || null;
// Funzione helper che estrae l'ID utente dalla req in modo sicuro
// con ?. se req.user è null/undef ritorna undef (no errore)

// Senza ?. Javascript lancierebbe l'errore che Cannot read 
// property id of undefined

//fondamentale per il middleware authMiddleware

const buildUserQuery = (userId, additionalFields = {}) => 
	userId ? { ...additionalFields, createdBy: userId } : additionalFields;
// funzione helper intelligente che costruisce queryMongo dinamiche con data isolation opzionale
// se userID = truthy --> esegui il primo "ramo"
// se userID = falsy (null, undef) --> esegui il secondo "ramo"
// lo spread operator (...) espande le proprietà dell'oggetto additionalFields nel nuovo oggetto.

const getFlash = async (req, res) => {
	try {
		const userId = getUserId(req);
		const flashcards = await Flashcard.find(buildUserQuery(userId));
		// Dammi tutte le flashcards dell'utente loggato di qualsiasi area tematica
		console.log('Flashcard trovate per user', userId, ':', flashcards.length);
		res.json(flashcards);
	} catch (err) {
		console.error('Errore getFlash:', err);
		res.status(500).json({ error: 'Errore nel recupero delle flashcard', details: err.message });
	}
};
// Query param : thematicArea
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
			docs = payload.map(item => ({ ...item, createdBy: userId })); //array di flashcards complete
		} else if (payload?.questions && payload?.thematicArea) {
			docs = payload.questions.map(q => ({
				question: q.question, //dalla singola domanda
				answers: q.answers, // dalla sngola domanda
				thematicArea: payload.thematicArea, //dal livello superiore (comune a tutti le domande)
				difficulty: q.difficulty || 'media', // dalla domanda (media = fallback)
				createdBy: userId
			}));
		} else { //payload non valido per n motivi 
			return res.status(400).json({ error: 'Payload non valido per createFlashcards' });
		}
		
		const created = await Flashcard.insertMany(docs);
		res.status(201).json({ createdCount: created.length, created });
	} catch (err) {
		console.error('Errore createFlashcards:', err);
		res.status(500).json({ error: 'Errore nella creazione delle flashcards', details: err.message });
	}
};
// tutte le aree tematiche per quello specifico utente
const listThematicAreas = async (req, res) => {
	try {
		const userId = getUserId(req);
		// dato che ci sono n flashcards, mi ridarebbe "Area1" 20 volte se ci sono 20 flashcards con "Area1"
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
