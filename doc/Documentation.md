# Documentazione backend 

Questa documentazione descrive riga per riga i file principali del backend presenti nella cartella `backend/`.
Copre i modelli Mongoose (`models`), i controller (`controllers`), le rotte (`routes`), la connessione al DB e l'entrypoint `index.js`.

---

## File: `backend/db.js`
```javascript
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://alexdetu01_db_user:oP5n5Pv2UjTqvgJj@smartdeckcluster.fckswzj.mongodb.net/datasmartdeck?retryWrites=true&w=majority&appName=smartdeckcluster';
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
```
- const mongoose = require('mongoose');
  - Importa la libreria `mongoose` per interagire con MongoDB.
# Documentazione del backend

Qui trovi una descrizione puntuale dei principali file del backend (`backend/`). Ho cercato di essere chiaro ma diretto: ogni file è spiegato con le parti importanti e qualche suggerimento pratico dove serve.

Se vuoi che la documentazione venga convertita in PDF o che venga aggiunta una sezione "come eseguire in locale", dimmelo e la aggiungo.

---

## `backend/db.js`

Contiene la funzione che stabilisce la connessione a MongoDB usando Mongoose.

```javascript
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://alexdetu01_db_user:oP5n5Pv2UjTqvgJj@smartdeckcluster.fckswzj.mongodb.net/datasmartdeck?retryWrites=true&w=majority&appName=smartdeckcluster';
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
```

Spiegazione linea per linea:
- `const mongoose = require('mongoose');` — importa Mongoose.
- `const MONGODB_URI = '...';` — stringa di connessione a MongoDB Atlas. Nota: meglio spostare questa in una variabile d'ambiente per sicurezza.
- `const connectDB = async () => { ... }` — funzione asincrona che prova a connettersi.
- `await mongoose.connect(MONGODB_URI, { ... })` — stabilisce la connessione con opzioni consigliate.
- `console.log('MongoDB connected');` — log in caso di successo.
- `console.error(...); process.exit(1);` — in caso di errore il processo termina dopo il log.
- `module.exports = connectDB;` — esporta la funzione per l'uso in `index.js`.

---

## `backend/models/user.js`

Schema semplice per gli utenti.

```javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

module.exports = mongoose.model('User', userSchema, 'user');
```

Dettagli:
- `username`: campo obbligatorio e unico.
- `password`: campo obbligatorio (qui viene salvato l'hash, non la password in chiaro).
- il modello viene esportato come `User` sulla collection `user`.

---

## `backend/models/testResult.js`

Rappresenta un risultato di test salvato.

```javascript
const mongoose = require('mongoose');

const TestResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  area: { type: String, required: true },
  numQuestions: { type: Number, required: true },
  answers: [
    {
      question: String,
      userAnswer: String,
      correctAnswer: String,
      isCorrect: Boolean,
      time: Number
    }
  ],
  correctCount: { type: Number, required: true },
  totalTime: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TestResult', TestResultSchema, 'testResults');
```

Commenti utili:
- `userId` è un riferimento a `User` e attualmente è obbligatorio: se vuoi permettere risultati anonimi, bisogna togliere `required: true` o cambiare la logica.
- `answers` contiene i dettagli per ogni domanda: utile per ricostruire i report e le statistiche.

---

## `backend/models/singleFlash.js`

Schema delle flashcard usate per i test.

```javascript
const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  text: { type: String, required: true },
  isCorrect: { type: Boolean, required: true }
});

const flashcardSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answers: { type: [answerSchema], required: true, validate: [arr => arr.length === 3, 'Devi fornire esattamente 3 risposte'] },
  thematicArea: { type: String, required: true },
  difficulty: { type: String, required: true, enum: ['facile', 'media', 'difficile'] }
});

module.exports = mongoose.model('Flashcard', flashcardSchema, 'datasmartdeckCollection');
```

Note:
- `answers` è un array di tre elementi obbligatori (validazione esplicita).
- `difficulty` è vincolata ai tre valori indicati.

---

## `backend/controllers/auth.js`

Gestisce registrazione, login e middleware di autenticazione.

```javascript
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

async function register(req, res) {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username e password obbligatori' });
  try {
    const existing = await User.findOne({ username });
    if (existing) return res.status(409).json({ error: 'Utente già registrato' });
    const hash = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hash });
    const saved = await user.save();
    console.log('Nuovo utente salvato:', saved._id.toString(), saved.username);
    res.status(201).json({ message: 'Registrazione avvenuta con successo', userId: saved._id });
  } catch (err) {
    res.status(500).json({ error: 'Errore server', details: err.message });
  }
}

async function login(req, res) {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username e password obbligatori' });
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: 'Credenziali non valide' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Credenziali non valide' });
    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Errore server', details: err.message });
  }
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Token mancante' });
  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Token non valido' });
  }
}

module.exports = { register, login, authMiddleware };
```

Suggerimenti pratici:
- `JWT_SECRET` dovrebbe essere definito in produzione via variabile d'ambiente.
- Il middleware `authMiddleware` può essere usato per proteggere endpoint sensibili (es. salvare risultati utente).

---

## `backend/controllers/flash.js`

Funzioni che gestiscono le flashcard: recupero, filtraggio per area, creazione bulk e lista delle aree.

```javascript
const Flashcard = require('../models/singleFlash');

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
```

Breve spiegazione: le funzioni sono progettate per essere semplici e robuste; controllano il payload e restituiscono messaggi di errore chiari.

---

## `backend/controllers/testResult.js`

Si occupa del salvataggio dei risultati e del calcolo delle statistiche.

```javascript
const TestResult = require('../models/testResult');

exports.saveTestResult = async (req, res) => {
  try {
    const { userId, area, numQuestions, answers, correctCount, totalTime } = req.body;
    const testResult = new TestResult({ userId, area, numQuestions, answers, correctCount, totalTime });
    await testResult.save();
    res.status(201).json({ message: 'Test salvato', testResult });
  } catch (err) {
    res.status(500).json({ error: 'Errore salvataggio test', details: err.message });
  }
};

exports.getStatsByArea = async (req, res) => {
  try {
    const { userId, area } = req.params;
    const results = await TestResult.find({ userId, area });
    if (!results.length) return res.json({ stats: null });
    const totalTests = results.length;
    const totalQuestions = results.reduce((sum, r) => sum + r.numQuestions, 0);
    const totalCorrect = results.reduce((sum, r) => sum + r.correctCount, 0);
    const totalTime = results.reduce((sum, r) => sum + r.totalTime, 0);
    const avgTime = totalTime / totalQuestions;
    const avgScore = totalCorrect / totalQuestions;
    res.json({
      stats: { totalTests, totalQuestions, totalCorrect, totalTime, avgTime, avgScore },
      results
    });
  } catch (err) {
    res.status(500).json({ error: 'Errore recupero statistiche', details: err.message });
  }
};

exports.listAreas = async (req, res) => {
  try {
    const areas = await TestResult.distinct('area');
    console.log('[testResult.listAreas] found areas:', areas.length, areas);
    res.json({ areas });
  } catch (err) {
    res.status(500).json({ error: 'Errore recupero aree', details: err.message });
  }
};

exports.getAggregateByArea = async (req, res) => {
  try {
    const { area } = req.params;
    const results = await TestResult.find({ area });
    if (!results.length) return res.json({ stats: null });
    const totalTests = results.length;
    const totalQuestions = results.reduce((sum, r) => sum + r.numQuestions, 0);
    const totalCorrect = results.reduce((sum, r) => sum + r.correctCount, 0);
    const totalTime = results.reduce((sum, r) => sum + r.totalTime, 0);
    const avgTime = totalTime / totalQuestions;
    const avgScore = totalCorrect / totalQuestions;
    const scores = results.map(r => Math.round((r.correctCount / r.numQuestions) * 100));
    const bins = [0,20,40,60,80,100].map((_,i)=>0);
    scores.forEach(s => {
      const idx = Math.min(Math.floor(s/20),4);
      bins[idx]++;
    });
    res.json({ stats: { totalTests, totalQuestions, totalCorrect, totalTime, avgTime, avgScore, bins }, results });
  } catch (err) {
    res.status(500).json({ error: 'Errore recupero aggregate', details: err.message });
  }
};

exports.getRecentByArea = async (req, res) => {
  try {
    const { area } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const results = await TestResult.find({ area }).sort({ createdAt: -1 }).limit(limit);
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: 'Errore recupero recenti', details: err.message });
  }
};
```

Osservazioni pratiche:
- `saveTestResult` salva il documento come arriva dal client. È buona pratica validare i campi prima di salvare (ad es. assicurarsi che `answers` sia un array della lunghezza attesa).
- `getAggregateByArea` costruisce anche un'istogramma `bins` basato sulle percentuali di successo: comodo per visualizzazioni sulla dashboard.

---

## `backend/routes` (breve panoramica)

- `auth.js` — espone `POST /auth/register` e `POST /auth/login`. In sviluppo ha anche `GET /auth/_users` per elencare gli utenti senza password.
- `flash.js` — rotte per lavorare con le flashcard: `GET /flash`, `GET /flash/thematic/:thematicArea`, `POST /flash` (bulk), `GET /flash/areas/list`.
- `testResult.js` — rotte per test result: `POST /testresult`, `GET /testresult/areas/list`, `GET /testresult/aggregate/:area`, `GET /testresult/recent/:area`, `GET /testresult/:userId/:area`.

---

## `backend/index.js`

Entrypoint dell'applicazione, monta middleware, connessione DB e rotte.

```javascript
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.use('/auth', authRoutes);

connectDB();

app.get('/', (req, res) => {
  res.send('Backend attivo e connesso a MongoDB!');
});

const flashRoutes = require('./routes/flash');
app.use('/flash', flashRoutes);

const testResultRoutes = require('./routes/testResult');
app.use('/testresult', testResultRoutes);

app.listen(PORT, () => {
  console.log(`Server avviato sulla porta ${PORT}`);
});
```

Punti importanti:
- CORS è configurato in modo restrittivo per permettere richieste solo dalle origini elencate.
- `connectDB()` stabilisce la connessione al database all'avvio.

---

## Raccomandazioni rapide
- Non lasciare credenziali hard-coded nel codice (`db.js`): usa variabili d'ambiente.
- Proteggi le rotte sensibili con `authMiddleware`, in particolare il salvataggio dei risultati se non vuoi dati anonimi.
- Considera di aggiungere validazione server-side per i payload importanti (es. con `Joi` o `express-validator`).

Se vuoi, posso:
- cambiare `db.js` per leggere `MONGODB_URI` da `process.env` e lasciare un esempio in `.env.example`;
- applicare `authMiddleware` a `POST /testresult` e rendere il salvataggio disponibile solo per utenti autenticati.

