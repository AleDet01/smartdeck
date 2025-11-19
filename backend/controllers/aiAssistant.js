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

		// Sistema prompt migliorato - interpreta QUALSIASI input in modo intelligente
		const systemPrompt = `Sei un assistente AI educativo avanzato specializzato nella creazione di flashcard e quiz interattivi. Sei intelligente, flessibile e comprendi il contesto.

🎯 CAPACITÀ:
- Comprendi richieste vaghe ("voglio studiare storia") → generi quiz sulla storia
- Comprendi richieste specifiche ("crea 10 domande sulla rivoluzione francese livello medio") → rispetti esattamente
- Comprendi argomenti ("Seconda Guerra Mondiale") → generi quiz appropriato
- Comprendi testi lunghi → estrai concetti chiave e crei domande
- Comprendi domande ("cosa devo sapere sul DNA?") → crei quiz su DNA
- Comprendi linguaggio naturale in qualsiasi forma

📋 REGOLE DI INTERPRETAZIONE:
1. SEMPRE estrai l'argomento principale anche da input vaghi
2. Se NON specificato: genera 6-8 domande di difficoltà mista
3. Se specificato numero: rispettalo (max 20)
4. Se specificata difficoltà: rispettala, altrimenti varia (facile→media→difficile)
5. Crea domande EDUCATIVE, non banali

✅ FORMATO OUTPUT (SOLO JSON, niente altro):
{
  "thematicArea": "Titolo Breve e Chiaro (max 50 char)",
  "questions": [
    {
      "question": "Domanda chiara e precisa che testa la comprensione",
      "answers": [
        {"text": "Risposta CORRETTA ben formulata", "isCorrect": true},
        {"text": "Distractor plausibile e realistico", "isCorrect": false},
        {"text": "Altro distractor credibile", "isCorrect": false}
      ],
      "difficulty": "facile"
    }
  ]
}

⚠️ VINCOLI RIGIDI:
- Esattamente 3 risposte per domanda (1 vera, 2 false)
- Risposte false PLAUSIBILI (non ovviamente sbagliate)
- Difficulty DEVE essere: "facile", "media" o "difficile"
- ThematicArea: conciso, descrittivo, no emoji
- Output: SOLO JSON valido, no markdown, no spiegazioni extra

💡 ESEMPI INPUT/OUTPUT:
Input: "storia romana"
→ thematicArea: "Storia dell'Impero Romano", 7 domande varie

Input: "crea 5 domande facili sulla fotosintesi"
→ thematicArea: "Fotosintesi Clorofilliana", 5 domande facili

Input: "voglio imparare le equazioni di secondo grado"
→ thematicArea: "Equazioni di Secondo Grado", 6-8 domande progressive

GENERA SEMPRE contenuti di qualità, educativi e ben bilanciati.`;

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
		console.error('❌ Errore generateTestWithAI:', err.message);
		console.error('Dettagli errore:', JSON.stringify(err, null, 2));
		
		// Gestisci errori specifici di OpenAI
		if (err.status === 401 || err.message?.includes('Incorrect API key')) {
			return res.status(500).json({ 
				error: 'Chiave API OpenAI non valida o scaduta. Contatta l\'amministratore.',
				details: 'API Key Error',
				fallback: true
			});
		}
		
		if (err.status === 429 || err.message?.includes('rate limit')) {
			return res.status(500).json({ 
				error: 'Troppe richieste. Riprova tra qualche secondo.',
				details: 'Rate limit exceeded',
				fallback: true
			});
		}

		if (err.status === 402 || err.message?.includes('insufficient_quota')) {
			return res.status(500).json({ 
				error: 'Account OpenAI senza crediti. Contatta l\'amministratore.',
				details: 'Insufficient quota',
				fallback: true
			});
		}
		
		res.status(500).json({ 
			error: 'Errore nella generazione del test', 
			details: err.message || 'Errore sconosciuto',
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

// Streaming chat avanzata
const streamChatWithAI = async (req, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) {
			return res.status(401).json({ error: 'Utente non autenticato' });
		}
		console.log(`🔐 streamChatWithAI called by userId: ${userId}`);

		const { prompt, model = 'gpt-4o', conversationHistory = [], files = null, mode = 'auto' } = req.body;

		if (!prompt || prompt.trim().length === 0) {
			return res.status(400).json({ error: 'Prompt richiesto' });
		}

		const client = initOpenAI();
		if (!client) {
			return res.status(500).json({ 
				error: 'API Key OpenAI non configurata',
				fallback: true 
			});
		}

		// Headers per Server-Sent Events
		res.setHeader('Content-Type', 'text/event-stream');
		res.setHeader('Cache-Control', 'no-cache');
		res.setHeader('Connection', 'keep-alive');

		// Verifica se è una richiesta di generazione test
		const forceTestGeneration = typeof mode === 'string' && ['test', 'flashcards', 'quiz'].includes(mode.toLowerCase());
		const isTestGeneration = forceTestGeneration || /genera|crea|test|quiz|flashcard|domande|esercizi/i.test(prompt);

		// Sistema prompt avanzato dinamico
		let systemPrompt = `Sei un assistente AI educativo avanzato integrato in SmartDeck.

CAPACITÀ PRINCIPALI:
- Rispondere a domande educative con spiegazioni chiare
- Analizzare documenti e creare flashcard
- Fornire spiegazioni dettagliate e esempi pratici

STILE DI RISPOSTA:
- Professionale ma amichevole
- Usa esempi concreti quando possibile
- Struttura risposte con bullet points quando utile
- Usa emoji occasionalmente per rendere il testo più vivace
- Rispondi sempre in italiano eccellente

FORMATTAZIONE:
- Usa **grassetto** per concetti importanti
- Usa elenchi puntati per liste
- Usa numeri per passaggi sequenziali
- Usa \`code\` per termini tecnici`;

		if (isTestGeneration) {
			systemPrompt = `Sei un generatore di test esperto per SmartDeck.
Il tuo UNICO scopo è generare un JSON valido contenente domande e risposte basate sulla richiesta dell'utente.

REGOLE RIGIDE:
1. Output DEVE essere SOLO un oggetto JSON valido.
2. Niente testo prima o dopo il JSON.
3. Struttura JSON richiesta:
{
  "thematicArea": "Titolo conciso dell'argomento",
  "questions": [
    {
      "question": "Testo della domanda",
      "answers": [
        {"text": "Risposta corretta", "isCorrect": true},
        {"text": "Distrattore 1", "isCorrect": false},
        {"text": "Distrattore 2", "isCorrect": false}
      ],
      "difficulty": "facile" | "media" | "difficile"
    }
  ]
}
4. Genera almeno 5 domande se non specificato diversamente.
5. Le risposte errate devono essere plausibili.`;
		}

		// Costruisci messaggi con contesto
		const messages = [
			{ role: 'system', content: systemPrompt },
			...conversationHistory.slice(-10), // Ultimi 10 messaggi
			{ role: 'user', content: prompt }
		];

		if (isTestGeneration) {
			// Usa response_format JSON per test generation
			try {
				const completion = await client.chat.completions.create({
					model: model === 'o1-preview' ? 'gpt-4o' : model,
					messages,
					temperature: 0.7,
					response_format: { type: "json_object" },
					max_tokens: 3000
				});

				const content = completion.choices?.[0]?.message?.content || '';
				const testData = JSON.parse(content);

				if (!testData.thematicArea || !Array.isArray(testData.questions) || testData.questions.length === 0) {
					throw new Error('Formato test non valido generato dall\'AI');
				}

				const normalizeAnswers = (answers = []) => {
					const raw = Array.isArray(answers) ? answers.slice(0, 3) : [];
					const mapped = raw.map((ans, idx) => {
						if (typeof ans === 'string') {
							return { text: ans, isCorrect: idx === 0 };
						}
						if (ans && typeof ans.text === 'string') {
							return { text: ans.text, isCorrect: !!ans.isCorrect };
						}
						return null;
					}).filter(Boolean);

					// Garantisce sempre 3 risposte duplicando l'ultima valida
					while (mapped.length < 3 && mapped.length > 0) {
						mapped.push({ ...mapped[mapped.length - 1], isCorrect: false });
					}

					if (mapped.length > 0 && !mapped.some(ans => ans.isCorrect)) {
						mapped[0].isCorrect = true;
					}
					return mapped;
				};

				const docs = testData.questions
					.map(q => {
						const normalizedDifficulty = (q?.difficulty || '').toLowerCase();
						return {
							question: q?.question,
							answers: normalizeAnswers(q?.answers),
							thematicArea: testData.thematicArea,
							difficulty: ['facile', 'media', 'difficile'].includes(normalizedDifficulty)
								? normalizedDifficulty
								: 'media',
							createdBy: userId
						};
					})
					.filter(doc => doc.question && doc.answers.length === 3);

				if (docs.length === 0) {
					throw new Error('Nessuna domanda valida generata dall\'AI');
				}

				const created = await Flashcard.insertMany(docs);

				const responseMessage = `Test Generato: ${testData.thematicArea}\n\n${created.length} domande create con successo!\n\nIl test è disponibile nella Dashboard.`;

				res.write(`data: ${JSON.stringify({ content: responseMessage })}\n\n`);
				
				res.write(`data: ${JSON.stringify({ 
					testGenerated: true,
					testData: { thematicArea: testData.thematicArea, questionCount: created.length },
					tokens: { 
						input: completion.usage?.prompt_tokens || 0,
						output: completion.usage?.completion_tokens || 0,
						total: completion.usage?.total_tokens || 0
					}
				})}\n\n`);

				res.write('data: [DONE]\n\n');
				res.end();

			} catch (error) {
				console.error('❌ Errore generazione test:', error);
				res.write(`data: ${JSON.stringify({ error: error.message || 'Errore nella generazione del test. Prova a riformulare la richiesta.' })}\n\n`);
				res.write('data: [DONE]\n\n');
				res.end();
			}

		} else {
			// Chat normale con streaming
			try {
				const stream = await client.chat.completions.create({
					model: model === 'o1-preview' ? 'gpt-4o' : model,
					messages,
					temperature: 0.8,
					max_tokens: 2000,
					stream: true
				});

				let totalTokens = 0;
				let inputTokens = 0;
				let outputTokens = 0;

				for await (const chunk of stream) {
					const content = chunk.choices?.[0]?.delta?.content || '';
					
					if (content) {
						res.write(`data: ${JSON.stringify({ content })}\n\n`);
					}

					// Aggiorna token count
					if (chunk.usage) {
						inputTokens = chunk.usage.prompt_tokens || inputTokens;
						outputTokens = chunk.usage.completion_tokens || outputTokens;
						totalTokens = chunk.usage.total_tokens || totalTokens;
					}
				}

				// Invia token stats finali
				res.write(`data: ${JSON.stringify({ 
					tokens: { 
						input: inputTokens,
						output: outputTokens,
						total: totalTokens
					}
				})}\n\n`);

				res.write('data: [DONE]\n\n');
				res.end();

				console.log(`✓ Streaming completato - ${totalTokens} tokens`);

			} catch (error) {
				console.error('❌ Errore streaming:', error);
				res.write(`data: ${JSON.stringify({ error: error.message || 'Errore di connessione' })}\n\n`);
				res.write('data: [DONE]\n\n');
				res.end();
			}
		}

	} catch (err) {
		console.error('❌ Errore streamChatWithAI:', err);
		
		if (!res.headersSent) {
			res.status(500).json({ error: 'Errore nel servizio AI', details: err.message });
		} else {
			res.write(`data: ${JSON.stringify({ error: 'Errore interno del server' })}\n\n`);
			res.write('data: [DONE]\n\n');
			res.end();
		}
	}
};

module.exports = {
	generateTestWithAI,
	chatWithAI,
	streamChatWithAI
};
