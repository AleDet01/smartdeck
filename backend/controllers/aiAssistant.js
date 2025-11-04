const Flashcard = require('../models/singleFlash');

// Funzione per generare test con AI usando API compatibile OpenAI
const generateTestWithAI = async (req, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) {
			return res.status(401).json({ error: 'Utente non autenticato' });
		}

		const { prompt } = req.body;
		if (!prompt || prompt.trim().length === 0) {
			return res.status(400).json({ error: 'Prompt richiesto' });
		}

		// Costruisci il prompt per l'AI
		const systemPrompt = `Sei un assistente che genera quiz educativi in formato JSON. 
Genera ESATTAMENTE 5 domande a scelta multipla con 3 risposte ciascuna (una corretta e due sbagliate).
Rispondi SOLO con un oggetto JSON valido in questo formato:
{
  "thematicArea": "nome dell'area tematica",
  "questions": [
    {
      "question": "testo della domanda",
      "answers": [
        {"text": "risposta 1", "isCorrect": true},
        {"text": "risposta 2", "isCorrect": false},
        {"text": "risposta 3", "isCorrect": false}
      ],
      "difficulty": "media"
    }
  ]
}

Importante:
- Una sola risposta corretta per domanda
- Esattamente 3 risposte per domanda
- Difficulty può essere: "facile", "media", "difficile"
- Non aggiungere markdown, commenti o testo extra, solo JSON puro`;

		// Usa OpenAI API
		const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
		
		if (!OPENAI_API_KEY) {
			return res.status(500).json({ 
				error: 'API Key non configurata. Aggiungi OPENAI_API_KEY nelle variabili d\'ambiente.',
				fallback: true 
			});
		}

		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${OPENAI_API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				model: 'gpt-3.5-turbo',
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: prompt }
				],
				temperature: 0.7,
				max_tokens: 2000
			})
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			console.error('Errore API OpenAI:', response.status, response.statusText, errorData);
			return res.status(500).json({ 
				error: 'Errore nella generazione del test con AI',
				details: errorData.error?.message || 'Errore sconosciuto'
			});
		}

		const aiResponse = await response.json();
		console.log('Risposta OpenAI:', aiResponse);

		let generatedText = aiResponse.choices?.[0]?.message?.content || '';
		
		if (!generatedText) {
			throw new Error('Risposta vuota dall\'AI');
		}

		// Estrai JSON dalla risposta
		const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
		if (!jsonMatch) {
			throw new Error('Impossibile estrarre JSON dalla risposta AI');
		}

		const testData = JSON.parse(jsonMatch[0]);

		// Valida il formato
		if (!testData.thematicArea || !Array.isArray(testData.questions)) {
			throw new Error('Formato test non valido');
		}

		// Salva le flashcard nel database
		const docs = testData.questions.map(q => ({
			question: q.question,
			answers: q.answers,
			thematicArea: testData.thematicArea,
			difficulty: q.difficulty || 'media',
			createdBy: userId
		}));

		const created = await Flashcard.insertMany(docs);

		res.json({
			success: true,
			testData,
			createdCount: created.length,
			message: `Test "${testData.thematicArea}" generato con successo!`
		});

	} catch (err) {
		console.error('Errore generateTestWithAI:', err);
		res.status(500).json({ 
			error: 'Errore nella generazione del test', 
			details: err.message,
			fallback: true
		});
	}
};

// Chat con AI (streaming)
const chatWithAI = async (req, res) => {
	try {
		const { message } = req.body;
		
		if (!message || message.trim().length === 0) {
			return res.status(400).json({ error: 'Messaggio richiesto' });
		}

		const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
		
		if (!OPENAI_API_KEY) {
			return res.json({
				reply: 'Ciao! Sono il tuo assistente AI. Per usarmi, l\'amministratore deve configurare una API key (OPENAI_API_KEY). Nel frattempo, descrivi il test che vuoi creare e ti aiuterò con suggerimenti!'
			});
		}

		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${OPENAI_API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				model: 'gpt-3.5-turbo',
				messages: [
					{ 
						role: 'system', 
						content: 'Sei un assistente educativo che aiuta a creare quiz e test. Rispondi in modo amichevole e conciso in italiano.' 
					},
					{ role: 'user', content: message }
				],
				temperature: 0.8,
				max_tokens: 500
			})
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			console.error('Errore API OpenAI:', errorData);
			throw new Error('Errore API OpenAI');
		}

		const aiResponse = await response.json();
		const reply = aiResponse.choices?.[0]?.message?.content || '';

		res.json({ reply: reply.trim() || 'Mi dispiace, non sono riuscito a generare una risposta.' });

	} catch (err) {
		console.error('Errore chatWithAI:', err);
		res.status(500).json({ error: 'Errore nella chat con AI', details: err.message });
	}
};

module.exports = {
	generateTestWithAI,
	chatWithAI
};
