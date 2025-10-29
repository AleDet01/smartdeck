# Documentazione Backend - SmartDeck

## Panoramica Generale del Backend

Il backend di SmartDeck è un'**API RESTful** costruita con **Node.js** e **Express**, che utilizza **MongoDB** come database per gestire un sistema di flashcard educative con tracciamento delle performance degli utenti.

### Architettura e Tecnologie

L'applicazione segue il pattern **MVC (Model-View-Controller)** e utilizza:
- **Express 5.1** - Framework web per la gestione delle route HTTP
- **MongoDB + Mongoose 8.18** - Database NoSQL con ODM per la modellazione dei dati
- **JWT (JSON Web Tokens)** - Autenticazione stateless con token Bearer e cookie HttpOnly
- **bcrypt** - Hashing sicuro delle password con salt factor 10
- **dotenv** - Gestione variabili d'ambiente per configurazione sicura

### Funzionalità Principali

Il sistema si articola in **tre moduli funzionali principali**:

#### 1. **Gestione Autenticazione e Utenti** (`/auth`)
- **Registrazione utenti** con validazione username univoco e hashing password
- **Login** con generazione JWT (durata 2 ore) e cookie sicuri
- **Middleware di autenticazione** obbligatoria e opzionale per proteggere le route
- **Verifica sessione** (`/me`) per controllare lo stato di autenticazione
- **Logout** con invalidazione cookie
- **Lista utenti** per scopi amministrativi (endpoint `/_users`)

#### 2. **Gestione Flashcard** (`/flash`)
- **Creazione flashcard** multiple o singole con associazione all'utente creatore
- **Recupero flashcard** filtrate per utente (isolation dei dati per utente)
- **Filtraggio per area tematica** per organizzare lo studio
- **Lista aree tematiche** disponibili per l'utente corrente
- Supporto **autenticazione opzionale** per visualizzazione anche senza login
- Validazione schema: ogni flashcard ha **esattamente 3 risposte** con una corretta, difficoltà (facile/media/difficile) e area tematica

#### 3. **Tracciamento Risultati Test** (`/testresult`)
- **Salvataggio risultati** dei test con dettagli granulari (domande, risposte, tempi)
- **Statistiche per utente e area** con calcolo medie (tempo, punteggio, accuratezza)
- **Statistiche aggregate** per area (tutti gli utenti) con distribuzione percentuali
- **Risultati recenti** ordinati cronologicamente con limite configurabile
- **Recupero errori** de-duplicati per facilitare il ripasso mirato
- **Lista aree** con test disponibili per utente specifico o globale

### Sicurezza e Best Practices

- **Password hashing** con bcrypt (fattore 10)
- **JWT con scadenza** (2 ore) e secret key configurabile
- **Cookie HttpOnly** per prevenire XSS, con flag Secure in produzione
- **SameSite** configurato (None per prod, Lax per dev) per protezione CSRF
- **Trust proxy** abilitato per deployment dietro reverse proxy (Render, ecc.)
- **Validazione input** su tutti gli endpoint critici
- **Gestione errori** centralizzata con status code appropriati

### Database e Modelli

Il sistema utilizza **tre collezioni MongoDB**:
- **user** - Credenziali utenti con timestamp
- **datasmartdeckCollection** - Flashcard con riferimento al creatore
- **testResults** - Risultati test con indici ottimizzati per query frequenti (userId+area+createdAt, area+createdAt)

### Monitoraggio e Deployment

- **Health check** endpoint (`/health`) con stato connessione MongoDB e uptime
- **Root endpoint** (`/`) per verifica API attiva
- Configurazione **pronta per Render** (file `render.yaml` presente)
- **Logging console** per debugging connessioni DB e operazioni critiche
- **Gestione graceful** degli errori con exit su fallimento connessione DB

### Pattern Architetturali

- **Separazione responsabilità**: routes → controllers → models
- **DRY principle** con helper functions (es. `buildUserQuery`, `calculateStats`)
- **Middleware riutilizzabili** per autenticazione (obbligatoria/opzionale)
- **Query ottimizzate** con filtri dinamici basati su autenticazione
- **Data isolation** per utente tramite campo `createdBy`

---

## Analisi delle Classi

### Models

I **models** definiscono la struttura dei dati attraverso **Mongoose Schema** e rappresentano le collezioni MongoDB del sistema. Ogni model implementa validazioni, vincoli e indici per garantire l'integrità dei dati.

---

#### 1. **user.js** - Model Utente

**Collezione MongoDB**: `user`

**Descrizione**: Gestisce le credenziali e le informazioni base degli utenti del sistema.

**Schema**:
```javascript
{
  username: String (required, unique),
  password: String (required),
  timestamps: true  // createdAt, updatedAt automatici
}
```

**Caratteristiche**:
- **username**: Campo univoco che identifica l'utente, utilizzato per il login
- **password**: Password hashata con bcrypt (hash mai esposto nelle risposte API)
- **timestamps**: Mongoose aggiunge automaticamente `createdAt` e `updatedAt` per tracciare la creazione e le modifiche

**Validazioni**:
- `username` deve essere presente e univoco nel database
- `password` deve essere presente (viene hashata prima del salvataggio dal controller)

**Indici**:
- Indice univoco automatico su `username` per garantire unicità e velocizzare le query di login

**Utilizzo**:
- Registrazione e autenticazione utenti
- Riferimento nelle flashcard (`createdBy`) e nei risultati test (`userId`)
- Non espone mai la password nelle query (uso di `.select('-password')`)

---

#### 2. **singleFlash.js** - Model Flashcard

**Collezione MongoDB**: `datasmartdeckCollection`

**Descrizione**: Rappresenta una singola flashcard educativa con domanda, risposte multiple e metadati didattici.

**Schema Principale**:
```javascript
{
  question: String (required),
  answers: [AnswerSchema] (required, lunghezza = 3),
  thematicArea: String (required),
  difficulty: String (required, enum: ['facile', 'media', 'difficile']),
  createdBy: ObjectId (ref: 'User')
}
```

**Schema Annidato - AnswerSchema**:
```javascript
{
  text: String (required),
  isCorrect: Boolean (required)
}
```

**Caratteristiche**:
- **question**: Testo della domanda da porre all'utente
- **answers**: Array di **esattamente 3 risposte** (vincolo validato a livello schema)
  - Ogni risposta ha un `text` e un flag `isCorrect`
  - **Una sola risposta** deve avere `isCorrect: true`
- **thematicArea**: Categoria/argomento della flashcard (es. "Matematica", "Storia")
- **difficulty**: Livello di difficoltà tra tre valori predefiniti
- **createdBy**: Riferimento all'utente che ha creato la flashcard (data isolation)

**Validazioni**:
- `answers` deve contenere **esattamente 3 elementi** (validatore custom)
- `difficulty` deve essere uno dei valori enum: `'facile'`, `'media'`, `'difficile'`
- Tutti i campi required devono essere presenti

**Data Isolation**:
- Il campo `createdBy` permette di filtrare le flashcard per utente
- Ogni utente vede solo le proprie flashcard (implementato nei controllers)
- Se `createdBy` è null/undefined, la flashcard è considerata "pubblica"

**Utilizzo**:
- Creazione di set di domande per lo studio
- Recupero flashcard per area tematica
- Generazione test con domande filtrate per area e/o difficoltà

---

#### 3. **testResult.js** - Model Risultato Test

**Collezione MongoDB**: `testResults`

**Descrizione**: Registra i risultati dei test completati dagli utenti, includendo dettagli granulari per ogni risposta e statistiche aggregate.

**Schema Principale**:
```javascript
{
  userId: ObjectId (required, ref: 'User'),
  area: String (required),
  numQuestions: Number (required),
  answers: [AnswerDetailSchema],
  correctCount: Number (required),
  totalTime: Number (required),
  createdAt: Date (default: Date.now)
}
```

**Schema Annidato - AnswerDetailSchema**:
```javascript
{
  question: String,
  userAnswer: String,
  correctAnswer: String,
  isCorrect: Boolean,
  time: Number  // tempo impiegato in millisecondi
}
```

**Caratteristiche**:
- **userId**: Riferimento all'utente che ha completato il test
- **area**: Area tematica del test (deve corrispondere a `thematicArea` delle flashcard)
- **numQuestions**: Numero totale di domande nel test
- **answers**: Array dettagliato con ogni singola risposta data dall'utente
  - `question`: Testo della domanda
  - `userAnswer`: Risposta selezionata dall'utente
  - `correctAnswer`: Risposta corretta
  - `isCorrect`: Boolean che indica se l'utente ha risposto correttamente
  - `time`: Tempo impiegato per rispondere (in ms)
- **correctCount**: Numero di risposte corrette (per calcoli rapidi)
- **totalTime**: Tempo totale del test in millisecondi
- **createdAt**: Timestamp automatico di creazione

**Indici Composti**:
```javascript
{ userId: 1, area: 1, createdAt: -1 }  // Query utente-specifiche ordinate
{ area: 1, createdAt: -1 }              // Query aggregate per area
```

**Ottimizzazioni**:
- Gli indici composti velocizzano le query più frequenti:
  - Statistiche per utente e area specifica
  - Recupero cronologico dei risultati
  - Statistiche aggregate per area (tutti gli utenti)
- Ordinamento decrescente su `createdAt` (-1) per ottenere i risultati più recenti

**Utilizzo**:
- Salvataggio completo dei risultati dopo ogni test
- Calcolo statistiche individuali (media punteggio, tempo medio per domanda)
- Analisi errori comuni per singolo utente
- Statistiche aggregate per confronto con altri utenti
- Identificazione domande problematiche per ripasso mirato

**Calcoli Derivati** (effettuati nei controllers):
- **avgScore**: `correctCount / numQuestions`
- **avgTime**: `totalTime / numQuestions`
- **Distribution bins**: Distribuzione percentuali in fasce 0-20%, 20-40%, 40-60%, 60-80%, 80-100%
- **Wrong answers deduplication**: Rimozione duplicati basata su `question + correctAnswer`

---

### Relazioni tra Models

```
User (1) ──────┐
               │ createdBy
               ├──────> Flashcard (N)
               │
               │ userId
               └──────> TestResult (N)
```

**Relazioni**:
- Un **User** può creare **molte Flashcard** (relazione 1:N via `createdBy`)
- Un **User** può avere **molti TestResult** (relazione 1:N via `userId`)
- Le **Flashcard** e i **TestResult** sono collegati indirettamente tramite il campo `thematicArea`/`area`

**Note sull'integrità referenziale**:
- I riferimenti usano `ObjectId` di MongoDB
- **Non ci sono cascade delete** implementate (gestione manuale se necessario)
- Le query usano `.populate()` quando serve espandere i riferimenti (non implementato al momento ma possibile)

---

### Controllers

I **controllers** contengono la logica di business dell'applicazione. Processano le richieste HTTP, interagiscono con i models, applicano validazioni e restituiscono risposte formattate.

---

#### 1. **auth.js** - Controller Autenticazione

**Responsabilità**: Gestione completa del ciclo di vita dell'autenticazione utente e middleware di sicurezza.

##### **Costanti e Configurazione**

```javascript
JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey'
TOKEN_EXPIRY = '2h'
MAX_AGE = 7200 secondi (2 ore)
```

##### **Funzioni Helper**

**`setAuthCookie(res, token)`**
- **Scopo**: Imposta cookie HttpOnly con il token JWT
- **Comportamento**:
  - In produzione: `SameSite=None; Secure` (per HTTPS cross-origin)
  - In development: `SameSite=Lax` (solo same-site)
  - `HttpOnly=true` per prevenire accesso JavaScript (XSS protection)
  - `Max-Age=7200` (2 ore di validità)

**`getTokenFromReq(req)`**
- **Scopo**: Estrae il token JWT dalla richiesta
- **Fonti supportate**:
  1. Header `Authorization: Bearer <token>`
  2. Cookie `token=<token>`
- **Ritorna**: Token string o `null`

##### **Endpoint Handlers**

**`register(req, res)` - POST /auth/register**
- **Input**: `{ username, password }`
- **Processo**:
  1. Validazione campi obbligatori
  2. Verifica username non già esistente (409 Conflict se duplicato)
  3. Hash password con bcrypt (salt rounds: 10)
  4. Creazione utente nel database
  5. Generazione JWT con payload `{ id, username }`
  6. Impostazione cookie di autenticazione
  7. Risposta con userId e token
- **Status Codes**:
  - `201`: Registrazione successo
  - `400`: Campi mancanti
  - `409`: Username già esistente
  - `500`: Errore server

**`login(req, res)` - POST /auth/login**
- **Input**: `{ username, password }`
- **Processo**:
  1. Validazione campi obbligatori
  2. Ricerca utente per username
  3. Confronto password con bcrypt.compare()
  4. Generazione nuovo JWT
  5. Impostazione cookie
  6. Risposta con token
- **Status Codes**:
  - `200`: Login successo
  - `400`: Campi mancanti
  - `401`: Credenziali invalide
  - `500`: Errore server
- **Sicurezza**: Messaggio generico "Credenziali non valide" per prevenire user enumeration

**`me(req, res)` - GET /auth/me**
- **Scopo**: Verifica stato autenticazione corrente
- **Processo**:
  1. Estrae token dalla richiesta
  2. Verifica e decodifica JWT
  3. Ritorna info utente se valido
- **Risposta**:
  - Autenticato: `{ authenticated: true, user: { id, username } }`
  - Non autenticato: `{ authenticated: false, user: null }`
- **Note**: Non ritorna errori, solo stato (utile per UI)

**`logout(req, res)` - POST /auth/logout**
- **Processo**:
  1. Imposta cookie con `Max-Age=0` (elimina cookie)
  2. Mantiene flag HttpOnly e SameSite per compatibilità
- **Risposta**: `{ message: 'Logout effettuato' }`
- **Note**: Non invalida il JWT lato server (stateless), ma rimuove il cookie dal browser

**`getAllUsers(req, res)` - GET /auth/_users**
- **Scopo**: Recupero lista utenti (amministrazione/debug)
- **Processo**: Query tutti gli utenti escludendo password
- **Risposta**: `{ users: [...] }`
- **Sicurezza**: ⚠️ Endpoint non protetto, considerare aggiungere auth admin

##### **Middleware**

**`authMiddleware(req, res, next)`**
- **Scopo**: Protezione route che richiedono autenticazione obbligatoria
- **Processo**:
  1. Estrae token
  2. Verifica validità con `jwt.verify()`
  3. Decodifica e inserisce payload in `req.user`
  4. Chiama `next()` se valido
- **Errori**:
  - `401`: Token mancante o non valido
- **Utilizzo**: Applicato alle route `/flash (POST)` e `/testresult (POST)`

**`optionalAuthMiddleware(req, res, next)`**
- **Scopo**: Autenticazione opzionale per route con comportamento ibrido
- **Processo**:
  1. Tenta estrazione e verifica token
  2. Se valido: `req.user = { id, username }`
  3. Se invalido/mancante: `req.user = null`
  4. Continua sempre con `next()` (non blocca)
- **Utilizzo**: Route `/flash (GET)` per filtrare flashcard dell'utente se loggato, o mostrare pubbliche se non loggato

---

#### 2. **flash.js** - Controller Flashcard

**Responsabilità**: Gestione CRUD delle flashcard con data isolation per utente.

##### **Funzioni Helper**

**`getUserId(req)`**
- **Scopo**: Estrae userId da `req.user` (popolato dai middleware auth)
- **Ritorna**: `userId` string o `null`

**`buildUserQuery(userId, additionalFields = {})`**
- **Scopo**: Costruisce query MongoDB con filtro utente dinamico
- **Logica**:
  - Se `userId` presente: aggiunge `createdBy: userId` ai filtri
  - Se `userId` null: ritorna solo `additionalFields` (query pubbliche)
- **Esempio**: `buildUserQuery('123', { thematicArea: 'Math' })` → `{ thematicArea: 'Math', createdBy: '123' }`

##### **Endpoint Handlers**

**`getFlash(req, res)` - GET /flash**
- **Autenticazione**: Opzionale (usa `optionalAuthMiddleware`)
- **Processo**:
  1. Estrae userId (può essere null)
  2. Query flashcard con filtro utente
  3. Log numero flashcard trovate
  4. Ritorna array flashcard
- **Risposta**: `[{ question, answers, thematicArea, difficulty, createdBy }, ...]`
- **Data Isolation**: Utente loggato vede solo le sue, utente non loggato vede tutte quelle senza `createdBy`

**`getFlashByThematicArea(req, res)` - GET /flash/thematic/:thematicArea**
- **Parametri**: `thematicArea` da URL
- **Autenticazione**: Opzionale
- **Processo**: Come `getFlash` ma con filtro aggiuntivo su `thematicArea`
- **Risposta**: Array flashcard filtrate per area e utente

**`listThematicAreas(req, res)` - GET /flash/areas/list**
- **Scopo**: Recupero aree tematiche disponibili
- **Autenticazione**: Opzionale
- **Processo**:
  1. Usa `Flashcard.distinct('thematicArea', query)` per valori univoci
  2. Applica filtro utente se loggato
- **Risposta**: `{ areas: ['Math', 'History', ...] }`
- **Note**: `distinct()` è efficiente e evita duplicati lato DB

**`createFlashcards(req, res)` - POST /flash**
- **Autenticazione**: Obbligatoria (usa `authMiddleware`)
- **Input supportati**:
  1. **Array di flashcard complete**:
     ```javascript
     [{ question, answers, thematicArea, difficulty }, ...]
     ```
  2. **Oggetto con questions array**:
     ```javascript
     {
       thematicArea: 'Math',
       questions: [
         { question, answers, difficulty },
         ...
       ]
     }
     ```
- **Processo**:
  1. Determina formato payload
  2. Normalizza in array di documenti
  3. Aggiunge `createdBy: userId` a ogni documento
  4. Inserimento batch con `insertMany()`
- **Risposta**: `{ createdCount: N, created: [...] }`
- **Status Codes**:
  - `201`: Creazione successo
  - `400`: Payload invalido
  - `500`: Errore DB (es. validazione schema)

---

#### 3. **testResult.js** - Controller Risultati Test

**Responsabilità**: Salvataggio risultati, calcolo statistiche e analisi performance utenti.

##### **Funzioni Helper**

**`calculateStats(results)`**
- **Input**: Array di TestResult documents
- **Output**: Oggetto con statistiche aggregate
- **Calcoli**:
  ```javascript
  {
    totalTests: results.length,
    totalQuestions: Σ numQuestions,
    totalCorrect: Σ correctCount,
    totalTime: Σ totalTime (ms),
    avgTime: totalTime / totalQuestions,
    avgScore: totalCorrect / totalQuestions
  }
  ```
- **Utilizzo**: Riutilizzata in `getStatsByArea` e `getAggregateByArea`

##### **Endpoint Handlers**

**`saveTestResult(req, res)` - POST /testresult**
- **Autenticazione**: Obbligatoria
- **Input**:
  ```javascript
  {
    area: String,
    numQuestions: Number,
    answers: [{ question, userAnswer, correctAnswer, isCorrect, time }],
    correctCount: Number,
    totalTime: Number
  }
  ```
- **Processo**:
  1. Estrae userId da `req.user` (fallback a `req.body.userId`)
  2. Validazione presenza userId
  3. Creazione documento TestResult
  4. Salvataggio in DB
- **Risposta**: `{ message: 'Test salvato', testResult: {...} }`
- **Status Codes**:
  - `201`: Salvataggio successo
  - `401`: Utente non autenticato
  - `500`: Errore DB

**`getStatsByArea(req, res)` - GET /testresult/:userId/:area**
- **Parametri**: `userId`, `area` da URL
- **Processo**:
  1. Query tutti i test per userId e area
  2. Se nessun risultato: `{ stats: null }`
  3. Altrimenti: calcola stats con `calculateStats()`
- **Risposta**: `{ stats: {...}, results: [...] }`
- **Uso**: Dashboard personale utente per area specifica

**`listAreas(req, res)` - GET /testresult/areas/list**
- **Query params**: `userId` (opzionale)
- **Processo**:
  1. Se userId presente: filtra per utente
  2. Altrimenti: tutte le aree globali
  3. Usa `distinct('area', query)` per valori univoci
- **Risposta**: `{ areas: [...] }`
- **Log**: Registra numero aree trovate e userId

**`getAggregateByArea(req, res)` - GET /testresult/aggregate/:area**
- **Parametri**: `area` da URL
- **Scopo**: Statistiche globali per area (tutti gli utenti)
- **Processo**:
  1. Query tutti i test dell'area
  2. Calcola statistiche aggregate
  3. Costruisce distribuzione punteggi in 5 bins (0-20%, 20-40%, ecc.)
- **Distribuzione bins**:
  ```javascript
  scores = results.map(r => (r.correctCount / r.numQuestions) * 100)
  bins[0] = count(0-19%)
  bins[1] = count(20-39%)
  bins[2] = count(40-59%)
  bins[3] = count(60-79%)
  bins[4] = count(80-100%)
  ```
- **Risposta**: `{ stats: { ...stats, bins: [n0, n1, n2, n3, n4] }, results: [...] }`
- **Uso**: Confronto performance utente con media globale

**`getRecentByArea(req, res)` - GET /testresult/recent/:area**
- **Parametri**: `area` da URL
- **Query params**: `limit` (default: 20)
- **Processo**:
  1. Query test per area
  2. Ordinamento per `createdAt` decrescente
  3. Limit sui risultati
- **Risposta**: `{ results: [...] }`
- **Uso**: Timeline recenti test per area

**`getWrongAnswersByUserArea(req, res)` - GET /testresult/wrong/:userId/:area**
- **Parametri**: `userId`, `area` da URL
- **Query params**: `limit` (default: 50, max: 200)
- **Processo**:
  1. Query ultimi 150 test dell'utente per area (ordinati per data)
  2. Estrae risposte sbagliate (`isCorrect: false`)
  3. **De-duplicazione** basata su `question + correctAnswer` (case-insensitive)
  4. Mantiene solo prima occorrenza di ogni errore
  5. Limita risultati al valore richiesto
- **Risposta**:
  ```javascript
  {
    wrong: [
      {
        question: String,
        userAnswer: String,
        correctAnswer: String,
        createdAt: Date
      },
      ...
    ]
  }
  ```
- **Ottimizzazione**: Usa `Set` per tracking duplicati in O(1)
- **Uso**: Ripasso mirato su domande problematiche per l'utente

---

### Routes

Le **routes** definiscono gli endpoint HTTP e collegano i percorsi URL ai rispettivi controller. Applicano middleware di autenticazione dove necessario.

---

#### 1. **auth.js** - Routes Autenticazione

```javascript
POST   /auth/register      → register         (pubblico)
POST   /auth/login         → login            (pubblico)
GET    /auth/me            → me               (pubblico)
POST   /auth/logout        → logout           (pubblico)
GET    /auth/_users        → getAllUsers      (pubblico ⚠️)
```

**Note**:
- Tutti gli endpoint sono pubblici
- `/_users` dovrebbe essere protetto in produzione
- `/me` è pubblico ma legge il token se presente

---

#### 2. **flash.js** - Routes Flashcard

```javascript
GET    /flash                          → getFlash                  (auth opzionale)
GET    /flash/areas/list               → listThematicAreas         (auth opzionale)
GET    /flash/thematic/:thematicArea   → getFlashByThematicArea    (auth opzionale)
POST   /flash                          → createFlashcards          (auth obbligatoria)
```

**Middleware**:
- `optionalAuthMiddleware`: GET endpoints (comportamento ibrido)
- `authMiddleware`: POST endpoint (solo utenti autenticati)

**Ordine routes**:
- ⚠️ Routes specifiche (`/areas/list`) prima di parametriche (`/:thematicArea`) per evitare matching errato

---

#### 3. **testResult.js** - Routes Risultati Test

```javascript
POST   /testresult                    → saveTestResult           (auth obbligatoria)
GET    /testresult/areas/list         → listAreas                (pubblico)
GET    /testresult/aggregate/:area    → getAggregateByArea       (pubblico)
GET    /testresult/recent/:area       → getRecentByArea          (pubblico)
GET    /testresult/wrong/:userId/:area → getWrongAnswersByUserArea (pubblico)
GET    /testresult/:userId/:area      → getStatsByArea           (pubblico)
```

**Middleware**:
- Solo POST richiede autenticazione
- GET endpoints pubblici (per dashboard e statistiche pubbliche)

**Ordine routes**:
- Routes specifiche (`/areas/list`, `/aggregate/:area`, ecc.) **prima** di `/:userId/:area`
- Altrimenti `/areas` sarebbe interpretato come userId

---

### Flow Completo Richiesta

```
Client Request
     ↓
express.json() (body parser)
     ↓
Route Matching (/auth, /flash, /testresult)
     ↓
Auth Middleware (se richiesto)
     ↓
Controller Function
     ↓
Database Query (Mongoose)
     ↓
Response Formatting
     ↓
Client Response
```

**Gestione Errori**:
- Try-catch in ogni controller
- Status code appropriati (400, 401, 409, 500)
- Messaggi descrittivi in `{ error: '...', details: '...' }`
- Log su console per errori critici
