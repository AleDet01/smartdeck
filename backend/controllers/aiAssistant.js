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

		// Usa Hugging Face Inference API (gratuita) come alternativa open source
		const HF_API_KEY = process.env.HF_API_KEY || '';
		const API_URL = 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2';
		
		if (!HF_API_KEY) {
			return res.status(500).json({ 
				error: 'API Key non configurata. Aggiungi HF_API_KEY nelle variabili d\'ambiente.',
				fallback: true 
			});
		}

		const response = await fetch(API_URL, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${HF_API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				inputs: `${systemPrompt}\n\nRichiesta utente: ${prompt}\n\nJSON:`,
				parameters: {
					max_new_tokens: 2000,
					temperature: 0.7,
					top_p: 0.95,
					return_full_text: false
				}
			})
		});

		if (!response.ok) {
			console.error('Errore API AI:', response.status, response.statusText);
			return res.status(500).json({ error: 'Errore nella generazione del test con AI' });
		}

		const aiResponse = await response.json();
		console.log('Risposta AI:', aiResponse);

		let generatedText = '';
		if (Array.isArray(aiResponse) && aiResponse[0]?.generated_text) {
			generatedText = aiResponse[0].generated_text;
		} else if (aiResponse.generated_text) {
			generatedText = aiResponse.generated_text;
		} else {
			throw new Error('Formato risposta AI non valido');
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

		const HF_API_KEY = process.env.HF_API_KEY || '';
		
		if (!HF_API_KEY) {
			return res.json({
				reply: 'Ciao! Sono il tuo assistente AI. Per usarmi, l\'amministratore deve configurare una API key (HF_API_KEY). Nel frattempo, descrivi il test che vuoi creare e ti aiuterò con suggerimenti!'
			});
		}

		const API_URL = 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2';

		const response = await fetch(API_URL, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${HF_API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				inputs: `Sei un assistente educativo che aiuta a creare quiz e test. Rispondi in modo amichevole e conciso.\n\nUtente: ${message}\n\nAssistente:`,
				parameters: {
					max_new_tokens: 500,
					temperature: 0.8,
					top_p: 0.9,
					return_full_text: false
				}
			})
		});

		if (!response.ok) {
			throw new Error('Errore API AI');
		}

		const aiResponse = await response.json();
		let reply = '';
		
		if (Array.isArray(aiResponse) && aiResponse[0]?.generated_text) {
			reply = aiResponse[0].generated_text;
		} else if (aiResponse.generated_text) {
			reply = aiResponse.generated_text;
		}

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
