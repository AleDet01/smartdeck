const Flashcard = require('../models/singleFlash');
const OpenAI = require('openai');

// Inizializza il client OpenAI
let openaiClient = null;
const initOpenAI = () => {
	if (!openaiClient && process.env.OPENAI_API_KEY) {
		openaiClient = new OpenAI({
			apiKey: process.env.OPENAI_API_KEY
		});
	}
	return openaiClient;
};

// Funzione per generare test con AI da qualsiasi input libero
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

		const client = initOpenAI();
		if (!client) {
			return res.status(500).json({ 
				error: 'API Key OpenAI non configurata. Aggiungi OPENAI_API_KEY nelle variabili d\'ambiente.',
				fallback: true 
			});
		}

		// Prompt migliorato: interpreta qualsiasi richiesta e genera flashcard
		const systemPrompt = `Sei un assistente educativo esperto che genera quiz da qualsiasi input.

ISTRUZIONI:
1. Analizza attentamente la richiesta dell'utente (può essere generica, specifica, un argomento, una domanda, un testo da studiare, ecc.)
2. Estrai l'argomento principale e genera domande pertinenti
3. Se l'utente non specifica il numero di domande, genera 5-8 domande
4. Se l'utente specifica un numero, rispettalo (max 20)
5. Genera domande a scelta multipla con ESATTAMENTE 3 risposte per domanda (1 corretta, 2 sbagliate)

FORMATO OUTPUT - Rispondi SOLO con JSON puro (no markdown, no commenti):
{
  "thematicArea": "nome breve e descrittivo dell'argomento (es: Storia Romana, Equazioni, Verbi Inglesi)",
  "questions": [
    {
      "question": "testo della domanda chiaro e preciso",
      "answers": [
        {"text": "risposta corretta", "isCorrect": true},
        {"text": "risposta sbagliata plausibile", "isCorrect": false},
        {"text": "altra risposta sbagliata plausibile", "isCorrect": false}
      ],
      "difficulty": "facile"|"media"|"difficile"
    }
  ]
}

REGOLE IMPORTANTI:
- Una sola risposta corretta per domanda
- Esattamente 3 risposte per domanda
- Risposte sbagliate plausibili (non ovvie)
- Domande varie e progressive in difficoltà
- ThematicArea conciso (max 50 caratteri)
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

		// Chiama OpenAI con il nuovo SDK
		console.log(`🤖 Generazione flashcard per prompt: "${prompt.substring(0, 100)}..."`);
		
		const completion = await client.chat.completions.create({
			model: 'gpt-3.5-turbo',
			messages: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: prompt }
			],
			temperature: 0.7,
			max_tokens: 2500,
			response_format: { type: "json_object" }
		});

		let generatedText = completion.choices?.[0]?.message?.content || '';
		
		if (!generatedText) {
			throw new Error('Risposta vuota dall\'AI');
		}

		console.log('✓ Risposta AI ricevuta, parsing JSON...');
		
		// Estrai e valida JSON
		let testData;
		try {
			testData = JSON.parse(generatedText);
		} catch (parseError) {
			// Fallback: cerca JSON nel testo
			const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
			if (!jsonMatch) {
				throw new Error('Impossibile estrarre JSON dalla risposta AI');
			}
			testData = JSON.parse(jsonMatch[0]);
		}

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

		const client = initOpenAI();
		if (!client) {
			return res.json({
				reply: 'Ciao! Sono il tuo assistente AI. Per usarmi, l\'amministratore deve configurare una API key (OPENAI_API_KEY). Nel frattempo, descrivi il test che vuoi creare e ti aiuterò con suggerimenti!'
			});
		}

		console.log(`💬 Chat AI: "${message.substring(0, 80)}..."`);

		const completion = await client.chat.completions.create({
			model: 'gpt-3.5-turbo',
			messages: [
				{ 
					role: 'system', 
					content: 'Sei un assistente educativo che aiuta a studiare e creare flashcard. Rispondi in modo amichevole, conciso e incoraggiante in italiano.' 
				},
				{ role: 'user', content: message }
			],
			temperature: 0.8,
			max_tokens: 500
		});

		const reply = completion.choices?.[0]?.message?.content || '';

		console.log('✓ Chat risposta inviata');
		res.json({ reply: reply.trim() || 'Mi dispiace, non sono riuscito a generare una risposta.' });

	} catch (err) {
		console.error('❌ Errore chatWithAI:', err.message);
		res.status(500).json({ error: 'Errore nella chat con AI', details: err.message });
	}
};

module.exports = {
	generateTestWithAI,
	chatWithAI
};
