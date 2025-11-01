# 📚 Documentazione Backend - SmartDeck

## 🎯 Panoramica Generale

SmartDeck è un'applicazione backend RESTful che gestisce un sistema di flashcard educative organizzate per aree tematiche. Il sistema supporta:

- **Autenticazione utente** con JWT e cookie HttpOnly
- **Gestione flashcard** per area tematica
- **Isolamento dati** per utente (data isolation)
- **Database MongoDB** per persistenza dati

### Caratteristiche Chiave

- ✅ Autenticazione stateless con JWT
- ✅ Cookie HttpOnly sicuri per produzione
- ✅ Isolamento dati per utente (ogni utente vede solo le proprie flashcard)
- ✅ Supporto autenticazione opzionale (dati pubblici + dati privati)
- ✅ Validazione dati con Mongoose

---

## 🏗️ Architettura

```
backend/
├── index.js                 # Entry point e configurazione Express
├── db.js                    # Connessione MongoDB
├── package.json            # Dipendenze e script
├── controllers/
│   ├── auth.js             # Logica autenticazione
│   └── flash.js            # Logica flashcard
├── routes/
│   ├── auth.js             # Route autenticazione
│   └── flash.js            # Route flashcard
└── models/
    ├── user.js             # Schema utente
    └── singleFlash.js      # Schema flashcard
```

### Pattern Architetturale

**MVC (Model-View-Controller)** modificato:
- **Models**: Definizione schemi MongoDB (Mongoose)
- **Controllers**: Business logic e interazione con database
- **Routes**: Definizione endpoint e middleware
- **No View**: API RESTful (frontend separato)

---

## 📦 Dipendenze

### `package.json`

```json
{
  "dependencies": {
    "bcrypt": "^6.0.0",         // Hashing password
    "dotenv": "^17.2.3",        // Variabili ambiente
    "express": "^5.1.0",        // Framework web
    "jsonwebtoken": "^9.0.2",   // Autenticazione JWT
    "mongoose": "^8.18.1"       // ODM MongoDB
  }
}
```

### Dettaglio Dipendenze

| Pacchetto | Versione | Utilizzo |
|-----------|----------|----------|
| **bcrypt** | 6.0.0 | Hash password con salt (10 rounds) per sicurezza |
| **dotenv** | 17.2.3 | Caricamento variabili ambiente da file `.env`   |
| **express** | 5.1.0 | Framework HTTP per routing e middleware         |
| **jsonwebtoken** | 9.0.2 | Generazione e verifica token JWT           |
| **mongoose** | 8.18.1 | ODM per MongoDB con validazione schemi        |

---

## ⚙️ Configurazione

### Variabili d'Ambiente (`.env`)

```bash
# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/database

# Autenticazione
JWT_SECRET=secret

# Server
PORT=3000

# CORS (opzionale - comma separated)
ALLOW_ORIGINS= localhost e render
```

### Configurazione CORS

**Sviluppo**:
- Origins di default: `http://localhost:3000`, `http://localhost:3001`
- Cookie: `SameSite=Lax`
- Secure: `false`

**Produzione**:
- Origins: configurabili + `https://smartdeck-frontend.onrender.com`
- Cookie: `SameSite=None; Secure`
- Secure: `true`

---

## 📄 File Principali

### 1. `index.js` - Entry Point

**Responsabilità**: Configurazione Express, middleware globali, avvio server

#### Configurazione Express

```javascript
const app = express();
const PORT = process.env.PORT || 3000;
```

- Porta configurabile da ambiente
- Default: 3000

#### CORS Setup

```javascript
const allowedOrigins = process.env.ALLOW_ORIGINS 
  ? process.env.ALLOW_ORIGINS.split(',').map(s => s.trim())
  : ['http://localhost:3001', 'http://localhost:3000'];

if (process.env.NODE_ENV === 'production') {
  allowedOrigins.push('https://smartdeck-frontend.onrender.com');
}
```

**Logica**:
1. Legge origins da env (comma-separated)
2. Fallback su localhost in sviluppo
3. Aggiunge automaticamente Render frontend in produzione

**Funzione origin dinamica**:
```javascript
origin: (origin, callback) => {
  if (!origin) return callback(null, true);  // Postman, curl
  if (allowedOrigins.includes(origin)) return callback(null, true);
  console.warn(`⚠ CORS blocked origin: ${origin}`);
  callback(new Error('Not allowed by CORS'));
}
```

**Opzioni CORS**:
- `credentials: true` - Abilita invio cookie
- `methods`: GET, POST, PUT, DELETE, OPTIONS
- `allowedHeaders`: Content-Type, Authorization, Cookie
- `exposedHeaders`: Set-Cookie

#### Middleware Globali

```javascript
app.use(express.json());        // Parse JSON body
app.set('trust proxy', 1);      // Proxy Render/Heroku
```

`trust proxy`: Necessario per deployment dietro reverse proxy (Render, Heroku) per leggere correttamente IP client e protocollo.

#### Endpoint di Sistema

**`GET /`** - Root endpoint
```javascript
app.get('/', (req, res) => {
  res.json({ message: 'SmartDeck API', status: 'active' });
});
```

**`GET /health`** - Health check
```javascript
app.get('/health', (req, res) => {
  const mongoState = mongoose.connection.readyState;
  res.json({ 
    status: mongoState === 1 ? 'ok' : 'degraded', 
    database: mongoState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime() 
  });
});
```

**Stati MongoDB**:
- `0` - disconnected
- `1` - connected
- `2` - connecting
- `3` - disconnecting

#### Routing Modulare

```javascript
app.use('/auth', require('./routes/auth'));
app.use('/flash', require('./routes/flash'));
```

Monta router modulari su prefissi URL.

#### Bootstrap Applicazione

```javascript
connectDB()
  .then(() => {
    console.log('✓ MongoDB connesso');
    app.listen(PORT, () => {
      console.log(`✓ Server avviato su porta ${PORT}`);
    });
  })
  .catch(err => {
    console.error('✗ Errore connessione MongoDB:', err.message);
    process.exit(1);
  });
```

**Flusso**:
1. Connessione MongoDB
2. Se successo → avvia server Express
3. Se fallisce → log errore + exit(1)

---

### 2. `db.js` - Connessione MongoDB

**Responsabilità**: Gestione connessione MongoDB con Mongoose

```javascript
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI manca');
  process.exit(1);
}

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err?.message || err);
    throw err;
  }
};

module.exports = connectDB;
```

**Caratteristiche**:
- ✅ Validazione MONGODB_URI obbligatoria
- ✅ Gestione errori con throw (catturato in index.js)
- ✅ Mongoose 6+
- ✅ Connection pooling automatico

---

## 🗄️ Models (Mongoose)

### 1. `models/user.js` - Schema Utente

**Responsabilità**: Definizione struttura dati utente

```javascript
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}, {
  timestamps: true 
});

module.exports = mongoose.model('User', userSchema, 'user');
```

#### Campo `username`
- **Tipo**: String
- **Required**: Sì
- **Unique**: Sì (indice MongoDB)
- **Validazione**: Automatica da Mongoose

#### Campo `password`
- **Tipo**: String
- **Required**: Sì
- **Storage**: Hash bcrypt (10 rounds)
- **Sicurezza**: Mai restituito al client

#### Timestamps
```javascript
{ timestamps: true }
```
Aggiunge automaticamente:
- `createdAt`: Data creazione
- `updatedAt`: Data ultimo aggiornamento

#### Collection Name
```javascript
mongoose.model('User', userSchema, 'user')
```
- **Model name**: `User` (uso in codice)
- **Collection name**: `user` (nome in MongoDB)

---

### 2. `models/singleFlash.js` - Schema Flashcard

**Responsabilità**: Definizione struttura flashcard con validazione

#### Schema Answer (Nested)

```javascript
const answerSchema = new mongoose.Schema({
  text: { type: String, required: true },
  isCorrect: { type: Boolean, required: true }
});
```

**Campi**:
- `text`: Testo risposta
- `isCorrect`: Flag risposta corretta (una sola true per flashcard)

#### Schema Flashcard

```javascript
const flashcardSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answers: { 
    type: [answerSchema], 
    required: true, 
    validate: [arr => arr.length === 3, 'Devi fornire esattamente 3 risposte'] 
  },
  thematicArea: { type: String, required: true },
  difficulty: { 
    type: String, 
    required: true, 
    enum: ['facile', 'media', 'difficile'] 
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});
```

#### Campo `question`
- **Tipo**: String
- **Required**: Sì
- **Descrizione**: Testo della domanda

#### Campo `answers`
- **Tipo**: Array di answerSchema
- **Required**: Sì
- **Validazione Custom**: Esattamente 3 risposte
- **Struttura**: `[{ text, isCorrect }, ...]`

**Validazione**:
```javascript
validate: [arr => arr.length === 3, 'Devi fornire esattamente 3 risposte']
```

#### Campo `thematicArea`
- **Tipo**: String
- **Required**: Sì
- **Descrizione**: Area tematica (es. "Matematica", "Storia")
- **Uso**: Raggruppamento e filtraggio flashcard

#### Campo `difficulty`
- **Tipo**: String (enum)
- **Required**: Sì
- **Valori ammessi**: `'facile'`, `'media'`, `'difficile'`

#### Campo `createdBy`
- **Tipo**: ObjectId
- **Ref**: 'User'
- **Required**: No (può essere null per dati pubblici)
- **Uso**: Data isolation - filtraggio per utente

**Note**: 
- Se `null` → flashcard pubblica (visibile a tutti)
- Se valorizzato → flashcard privata (solo creatore)

#### Collection Name
```javascript
mongoose.model('Flashcard', flashcardSchema, 'datasmartdeckCollection')
```
- **Model name**: `Flashcard`
- **Collection name**: `datasmartdeckCollection`

---

## 🎮 Controllers

### 1. `controllers/auth.js` - Controller Autenticazione

**Responsabilità**: Logica autenticazione, JWT, cookie management

#### Costanti e Configurazione

```javascript
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const TOKEN_EXPIRY = '2h';
const MAX_AGE = 7200; // 2h in secondi
const isProd = () => process.env.NODE_ENV === 'production';
```

#### Helper: `setAuthCookie`

```javascript
const setAuthCookie = (res, token, maxAge = MAX_AGE) => {
  const options = [
    `token=${token}`, 
    'HttpOnly', 
    'Path=/', 
    `Max-Age=${maxAge}`, 
    `SameSite=${isProd() ? 'None' : 'Lax'}`, 
    isProd() && 'Secure'
  ].filter(Boolean).join('; ');
  res.setHeader('Set-Cookie', options);
};
```

**Attributi Cookie**:
- `HttpOnly`: Previene accesso JavaScript (XSS protection)
- `Path=/`: Cookie valido per tutto il sito
- `Max-Age`: Durata in secondi
- `SameSite=None` (prod) / `Lax` (dev): CSRF protection
- `Secure`: Solo HTTPS in produzione

#### Helper: `getTokenFromReq`

```javascript
const getTokenFromReq = (req) => {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) return auth.substring(7);
  return req.headers.cookie?.split(';')
    .find(c => c.trim().startsWith('token='))
    ?.trim().substring(6) || null;
};
```

**Supporto Doppio**:
- ✅ Bearer token (Postman, app mobile)
- ✅ Cookie (browser web)

##### Approfondimento: come funziona e perché serve

`getTokenFromReq(req)` unifica l’estrazione del token in un solo punto, evitando di duplicare logica nei middleware o nei controller.

Passi operativi:
1. Controlla l’header `Authorization` e, se inizia con `Bearer `, restituisce tutto ciò che segue (lo standard per API clients come Postman/app mobile).
2. In assenza di header Bearer, analizza l’header `Cookie` inviato dal browser, lo spezza su `;`, normalizza gli spazi con `trim()` e cerca la chiave `token=`. Se trovata, restituisce il valore a destra di `=`.
3. Se non trova nulla, restituisce `null` (nessun token fornito).

Perché è così fatto nel sito:
- Il frontend web usa un cookie HttpOnly per il token (settato da `setAuthCookie`). Poiché JavaScript non può leggere un HttpOnly, il token non viene passato nei body o localStorage dal client, ma viene incluso automaticamente dal browser nelle richieste (con `credentials: 'include'`).
- Gli strumenti di test (Postman) o altri client possono preferire l’header `Authorization: Bearer <token>`: mantenerlo supportato facilita debug, integrazioni e migrazioni.
- In caso di presenza di entrambe le fonti, l’header Bearer ha priorità: questo consente l’override esplicito durante i test senza dover cancellare cookie.

Edge case gestiti:
- Header/cookie mancanti → `null` (i middleware decidono il comportamento).
- Cookie multipli e spazi → il `trim()` e lo split su `;` evitano falsi negativi.
- Cookie/token scaduto o corrotto → l’estrazione avviene comunque; sarà la verifica JWT a fallire (vedi middleware).

#### Funzione: `register`

**Endpoint**: `POST /auth/register`

**Request Body**:
```json
{
  "username": "user123",
  "password": "securePass456"
}
```

**Step**:
1. Validazione input (username e password obbligatori)
2. Check utente esistente (409 Conflict se esiste)
3. Hash password con bcrypt (10 salt rounds)
4. Creazione utente in DB
5. Generazione JWT token
6. Set cookie HttpOnly
7. Response con userId e token

**Response Success** (201):
```json
{
  "message": "Registrazione avvenuta con successo",
  "userId": "507f1f77bcf86cd799439011",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Funzione: `login`

**Endpoint**: `POST /auth/login`

**Request Body**:
```json
{
  "username": "user123",
  "password": "securePass456"
}
```

**Step**:
1. Validazione input
2. Ricerca utente per username
3. Verifica password con bcrypt.compare
4. Generazione JWT token
5. Set cookie HttpOnly
6. Response con token

**Response Success** (200):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Middleware: `authMiddleware`

**Uso**: Protezione route che richiedono autenticazione

```javascript
const authMiddleware = (req, res, next) => {
  const token = getTokenFromReq(req);
  if (!token) return res.status(401).json({ error: 'Token mancante' });
  
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token non valido' });
  }
};
```

**`req.user` contiene**:
```javascript
{
  id: "507f1f77bcf86cd799439011",
  username: "user123",
  iat: 1635724800,  // issued at
  exp: 1635732000   // expiration
}
```

#### Middleware: `optionalAuthMiddleware`

**Uso**: Route che supportano sia autenticati che non

```javascript
const optionalAuthMiddleware = (req, res, next) => {
  const token = getTokenFromReq(req);
  try {
    req.user = token ? jwt.verify(token, JWT_SECRET) : null;
  } catch {
    req.user = null;
  }
  next();
};
```

**Comportamento**:
- Token valido → `req.user` valorizzato
- Token invalido/assente → `req.user = null`
- **Non blocca mai** (always next())

##### Approfondimento: scopo e motivazioni progettuali

`authMiddleware`
- Contratto: la rotta è accessibile solo a utenti autenticati. Se il token manca o non è verificabile, risponde 401 e ferma la catena.
- Perché così: centralizza la verifica JWT e popola `req.user` in modo consistente, mantenendo i controller puliti. La verifica è stateless (nessuna sessione server) quindi scalabile.

`optionalAuthMiddleware`
- Contratto: la rotta funziona sia con utente autenticato che anonimo. Prova a verificare il token; se non c’è o non è valido, continua comunque con `req.user = null`.
- Perché così: consente endpoint “ibridi” (es. elenco aree, fetch flashcard) che filtrano i dati se l’utente è loggato (data isolation tramite `createdBy`), oppure restituiscono dati pubblici se non loggato.
- Vantaggi UX: un cookie scaduto non rompe la navigazione (si degrada ad utente anonimo invece di mostrare 401).

Design complessivo
- Un unico punto di estrazione del token (`getTokenFromReq`) + due livelli di enforcement (obbligatorio/facoltativo) permettono di comporre facilmente policy per endpoint diversi mantenendo i controller agnostici.
- La combinazione è adatta a SPA con cookie HttpOnly (browser) e anche a client esterni (Bearer), senza duplicare codice.

#### Funzione: `me`

**Endpoint**: `GET /auth/me`

**Response autenticato**:
```json
{
  "authenticated": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "user123"
  }
}
```

**Response non autenticato**:
```json
{
  "authenticated": false,
  "user": null
}
```

#### Funzione: `logout`

**Endpoint**: `POST /auth/logout`

```javascript
const logout = (req, res) => {
  setAuthCookie(res, '', 0);
  res.json({ message: 'Logout effettuato' });
};
```

**Response** (200):
```json
{
  "message": "Logout effettuato"
}
```

---

### 2. `controllers/flash.js` - Controller Flashcard

**Responsabilità**: CRUD flashcard con data isolation

#### Helper: `getUserId`

```javascript
const getUserId = (req) => req.user?.id || null;
```

Estrae ID utente da `req.user` (popolato da middleware)

#### Helper: `buildUserQuery`

```javascript
const buildUserQuery = (userId, additionalFields = {}) => 
  userId ? { ...additionalFields, createdBy: userId } : additionalFields;
```

**Scopo**: Costruisce query MongoDB con data isolation

**Esempi**:
```javascript
// Utente autenticato
buildUserQuery('123', { thematicArea: 'Math' })
// → { thematicArea: 'Math', createdBy: '123' }

// Utente non autenticato
buildUserQuery(null, { thematicArea: 'Math' })
// → { thematicArea: 'Math' }
```

#### Funzione: `getFlash`

**Endpoint**: `GET /flash`  
**Middleware**: `optionalAuthMiddleware`

**Comportamento**:
- Utente autenticato → solo sue flashcard
- Utente non autenticato → tutte flashcard pubbliche

**Response** (200):
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "question": "Quanto fa 2+2?",
    "answers": [
      { "text": "3", "isCorrect": false },
      { "text": "4", "isCorrect": true },
      { "text": "5", "isCorrect": false }
    ],
    "thematicArea": "Matematica",
    "difficulty": "facile",
    "createdBy": "507f1f77bcf86cd799439012"
  }
]
```

#### Funzione: `getFlashByThematicArea`

**Endpoint**: `GET /flash/thematic/:thematicArea`  
**Middleware**: `optionalAuthMiddleware`

**Esempio**:
```
GET /flash/thematic/Matematica
```

Response: Array flashcard filtrate per area + utente

#### Funzione: `createFlashcards`

**Endpoint**: `POST /flash`  
**Middleware**: `authMiddleware` (richiede autenticazione)

**Request Formato 1** (array):
```json
[
  {
    "question": "Capitale Francia?",
    "answers": [
      { "text": "Londra", "isCorrect": false },
      { "text": "Parigi", "isCorrect": true },
      { "text": "Berlino", "isCorrect": false }
    ],
    "thematicArea": "Geografia",
    "difficulty": "facile"
  }
]
```

**Request Formato 2** (oggetto):
```json
{
  "thematicArea": "Geografia",
  "questions": [
    {
      "question": "Capitale Francia?",
      "answers": [...],
      "difficulty": "facile"
    }
  ]
}
```

**Response** (201):
```json
{
  "createdCount": 1,
  "created": [...]
}
```

#### Funzione: `listThematicAreas`

**Endpoint**: `GET /flash/areas/list`  
**Middleware**: `optionalAuthMiddleware`

**Response** (200):
```json
{
  "areas": ["Matematica", "Storia", "Geografia"]
}
```

---

## 🛣️ Routes

### 1. `routes/auth.js` - Route Autenticazione

| Method | Path | Controller | Descrizione |
|--------|------|------------|-------------|
| POST | `/auth/register` | register | Registrazione utente |
| POST | `/auth/login` | login | Login utente |
| GET | `/auth/me` | me | Check stato auth |
| POST | `/auth/logout` | logout | Logout utente |

---

### 2. `routes/flash.js` - Route Flashcard

| Method | Path | Middleware | Controller | Descrizione |
|--------|------|------------|------------|-------------|
| GET | `/flash` | optional | getFlash | Tutte flashcard |
| GET | `/flash/areas/list` | optional | listThematicAreas | Lista aree |
| GET | `/flash/thematic/:area` | optional | getFlashByThematicArea | Flashcard per area |
| POST | `/flash` | **required** | createFlashcards | Crea flashcard |

---

## 🔒 Sicurezza

### 1. Password Hashing

**bcrypt con 10 salt rounds**:
```javascript
await bcrypt.hash(password, 10)
```

**Storage**:
```
$2b$10$N9qo8uLOickgx2ZMRZoMye5YJJa6A0bI7TRdnxPuJ8O/dGp7YeOky
│  │  │                      │
│  │  │                      └─ Hash (31 char)
│  │  └─ Salt (22 char)
│  └─ Cost (10 = 2^10 rounds)
└─ Algorithm (2b = bcrypt)
```

### 2. JWT (JSON Web Tokens)

**Algoritmo**: HS256 (HMAC SHA256)

**Payload**:
```json
{
  "id": "507f1f77bcf86cd799439011",
  "username": "john",
  "iat": 1635724800,
  "exp": 1635732000
}
```

**Durata**: 2 ore (7200 secondi)

### 3. Cookie HttpOnly

**Attributi**:
```
token=eyJ...; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=7200
```

**Protezioni**:
- `HttpOnly` → No accesso JavaScript (XSS)
- `Secure` → Solo HTTPS in prod
- `SameSite=None` → CSRF mitigation

### 4. CORS

**Origin Whitelist**:
- Sviluppo: localhost:3000, localhost:3001
- Produzione: smartdeck-frontend.onrender.com

### 5. Data Isolation

**Principio**: Ogni utente vede solo i propri dati

```javascript
const buildUserQuery = (userId, additionalFields = {}) => 
  userId ? { ...additionalFields, createdBy: userId } : additionalFields;
```

---

## ⚠️ Gestione Errori

### Status Code HTTP

| Code | Descrizione | Uso |
|------|-------------|-----|
| 200 | OK | Success GET |
| 201 | Created | Success POST |
| 400 | Bad Request | Input invalido |
| 401 | Unauthorized | Auth mancante/invalida |
| 409 | Conflict | Username già esistente |
| 500 | Server Error | Errore interno |

### Response Error Format

```json
{
  "error": "Messaggio user-friendly",
  "details": "Technical details"
}
```

---

## 🚀 Deployment

### Variabili d'Ambiente Required

```bash
MONGODB_URI=mongodb+srv://...        # REQUIRED
JWT_SECRET=your_secret_here          # REQUIRED
NODE_ENV=production                  # REQUIRED
PORT=3000                            # OPTIONAL
ALLOW_ORIGINS=https://domain.com     # OPTIONAL
```

### Health Check

```
GET /health
```

Response:
```json
{
  "status": "ok",
  "database": "connected",
  "uptime": 3600.5
}
```

---

## 📊 Database Schema

### Collection: `user`

```javascript
{
  _id: ObjectId,
  username: String (unique, required),
  password: String (bcrypt hash, required),
  createdAt: Date,
  updatedAt: Date
}
```

### Collection: `datasmartdeckCollection`

```javascript
{
  _id: ObjectId,
  question: String (required),
  answers: [{
    text: String (required),
    isCorrect: Boolean (required)
  }] (length = 3),
  thematicArea: String (required),
  difficulty: String (enum, required),
  createdBy: ObjectId (ref User, nullable)
}
```

--- 
**Repository**: github.com/AleDet01/smartdeck
