# SmartDeck – Documentazione Frontend

Questa documentazione descrive l’architettura del frontend e come l’applicazione comunica con il backend.

## Panoramica architetturale

- Stack: React (CRA), React Router (HashRouter), fetch API per chiamate HTTP, CSS modularizzato per pagina/componente.
- Pattern: routing client-side con protezione delle rotte tramite guard (`RequireAuth`), stato locale per form e view, hook ausiliari per fetch e UI.
- Autenticazione: JWT in cookie HttpOnly gestito dal backend; il frontend effettua chiamate con `credentials: 'include'`.
- Configurazione host: `REACT_APP_API_HOST` (env) o auto-detection locale. In locale, default `http://localhost:3000`.

## Avvio e configurazione

- Entrypoint HTML: `frontend/public/index.html`
- Entrypoint JS: `frontend/src/index.js`
- App principale: `frontend/src/App.jsx`
- Variabile d’ambiente: `REACT_APP_API_HOST` (es. `http://localhost:3000`). Se assente: in localhost usa `http://localhost:3000`, altrimenti stringa vuota per same-origin.

Note su CORS/cookie:
- Il backend imposta i cookie con `SameSite=None` in produzione: richiede HTTPS per essere accettato dai browser.
- Per deployment su domini diversi tra FE e BE, garantire CORS lato BE e `credentials: 'include'` lato FE (già presente nel codice).

## Routing e protezione rotte

Il router è definito in `App.jsx` usando `HashRouter`:
- `/` → `LandingPage` (login/registrazione)
- `/login` → redirect a `/`
- `/dashboard` → `DashboardPage` (protetto)
- `/crea-test` → `CreateTestPage` (protetto)
- `/pretest/:area` → `PreTestPage` (protetto)
- `/test/:area/:num` → `TestPage` (protetto)
- `*` → redirect a `/`

Protezione: wrapper `RequireAuth` esegue `GET /auth/me` e consente l’accesso solo se `authenticated: true`.

## Comunicazione con il backend (API)

Host base: determinato da `src/utils/apiHost.js` (senza usare window):
- `const API_HOST = process.env.REACT_APP_API_HOST || (process.env.NODE_ENV !== 'production' ? 'http://localhost:3000' : '');`

Chiamate utilizzate nel FE (tutte con `credentials: 'include'` dove necessario):
- Autenticazione
	- `POST /auth/register` body `{ username, password }` → 201 con `{ message, userId, token }` e set-cookie `token`
	- `POST /auth/login` body `{ username, password }` → 200 con `{ token }` e set-cookie `token`
	- `GET /auth/me` → `{ authenticated: boolean, user: { id, username } | null }`
	- `POST /auth/logout` → invalida cookie (Max-Age=0)
- Flashcards
	- `GET /flash/areas/list` → `{ areas: string[] }` (eventualmente filtrate per `createdBy` se autenticati)
	- `GET /flash/thematic/:thematicArea` → `Flashcard[]` dell’area
	- `POST /flash` (protetta) accetta:
		- Array di flashcards, oppure
		- Oggetto `{ thematicArea, questions: { question, answers, difficulty? }[] }`
		Restituisce `{ createdCount, created }`

Formato Flashcard (dal BE e usato nel FE):
- `{
	question: string,
	answers: { text: string, isCorrect: boolean }[],
	thematicArea: string,
	difficulty: 'facile'|'media'|'difficile'|string,
	createdBy?: string
}`

Gestione errori lato FE:
- In `useFetch`, response non-OK genera `Error('HTTP <status>')` e popola `error`.
- In `LandingPage`, errori di login/registrazione vengono mostrati in UI.
- In `CreateTestPage`, su errore POST `/flash` si salva localmente il test (vedi nota più avanti).

## File del FE

### index.js
- Crea il root React (`ReactDOM.createRoot`) e renderizza `<App />` in `StrictMode`.
- Importa gli stili globali `index.css`.

### App.jsx
- Router principale con `HashRouter` e `Routes` elencati sopra.
- `RequireAuth` (componente interno):
	- Stato `{ loading, ok }`.
	- `useEffect` esegue `GET /auth/me` con `credentials: 'include'`.
	- Se `authenticated` → render dei figli; altrimenti `<Navigate to="/" />`.
- Render globale di `<LogoutButton />` al di fuori delle rotte (è visibile tranne che su `/` e `/login`).

### utils/apiHost.js
- Risolve l’host dell’API come descritto sopra, per evitare hardcoding in ogni chiamata.

### utils/hooks.js
- `useFetch(url, options?)`:
	- Effettua fetch con `AbortController` e `credentials: 'include'` di default.
	- Restituisce `{ data, loading, error }`.
	- Auto-parsing JSON, gestione errori non-OK.
- `useCurrentUser()`:
	- Usa `useFetch` su `/auth/me`; ritorna `{ user, authenticated, loading }`.
- `useAdaptiveFontSize(selector, deps)`:
	- Ridimensiona dinamicamente il font degli elementi che matchano `selector` per evitare overflow orizzontale.

### utils/imageUtils.js
- `makeConceptImageUrl(name, idx)`:
	- Genera una URL Unsplash tematica (immagini decorative per le aree).
- `makeGradientDataUrl(idx)`:
	- Genera un gradiente SVG base64-like come fallback.

### components/Topbar.jsx
- Barra superiore flottante con due pulsanti:
	- “Test” → `/dashboard`
	- “Crea un nuovo test” → `/crea-test`
- Evidenziazione attiva basata su `location.pathname` (React Router).

### components/LogoutButton.jsx
- Pulsante di logout fisso in basso a destra (nascosto in `/` e `/login`).
- Al click: `POST /auth/logout` con `credentials: 'include'`, pulizia di `localStorage.token` e redirect a `/`.

### components/AreaBox.jsx
- Semplice box con titolo area e pulsante Play (attualmente minimal; la dashboard usa una propria card più completa).

### components/PageBackground.jsx
- Wrapper che rende un’immagine di background `sfondo_pages.jpg` (in `public`).
- Spesso viene nascosto via CSS specifico di pagina.

### pages/LandingPage.jsx
- Schermata di login/registrazione con toggle `mode` (`login` | `register`).
- Form controllato per `username` e `password`.
- Submit:
	- `POST /auth/{mode}` con JSON body; `credentials: 'include'`.
	- Se OK → redirect a `/#/dashboard`.
	- Se errore → mostra messaggio.
- UI e stili moderni con `LandingPage.css`.

### pages/DashboardPage.jsx
- Carica le aree disponibili con `useFetch(`${API_HOST}/flash/areas/list`)`.
- Mappa il risultato in card “area” con immagine (Unsplash) e fallback gradiente.
- Adatta il font dei titoli `.area-title` con `useAdaptiveFontSize`.
- Pulsante Play di ogni card → naviga a `/pretest/:area`.

### pages/CreateTestPage.jsx
- Form per creare un test custom con:
	- Nome test (`thematicArea`)
	- Numero domande
	- Elenco domande con 3 risposte ciascuna e selezione della corretta
	- File immagine opzionale (solo nome mostrato; non viene caricato al BE)
- Submit:
	- Prepara payload `{ thematicArea, questions: [{ question, answers: [{ text, isCorrect }], difficulty: 'media' }] }`.
	- Esegue `POST /flash` (protetta) con `credentials: 'include'`.
	- Su successo → redirect a Dashboard. Su errore → mostra messaggio e resta in pagina (nessun fallback offline).

### pages/PreTestPage.jsx
- Parametro URL: `:area`.
- Carica le flashcard dell’area con `GET /flash/thematic/:area`.
- Consente di scegliere il numero di domande (quick pick + input numerico, vincolato a max = numero domande disponibili).
- CTA “Inizia il test” → naviga a `/test/:area/:num`.

### pages/TestPage.jsx
- Parametri URL: `:area`, `:num`.
- Sorgente dati domande: `GET /flash/thematic/:area`, shuffle client-side e slice alle prime `num` domande.
- Interazione:
	- Click risposta: evidenzia selezione, salva in `allAnswers[current]`, e avanza (auto) fino a report.
	- “Indietro” consente il back step-by-step.
- Report finale: calcolo corrette, percentuale, elenco domande sbagliate con risposta data vs corretta.

### Stili (src/css)

- `index.css`: reset e font smoothing globali.
- `LandingPage.css`: layout e stile della pagina di login/registrazione (gradienti, card, input `.modern-input`, pulsanti `.modern-btn`).
- `DashboardPage.css`: topbar fissa, griglia aree responsive, card con immagine/fallback e bottone play; nasconde `PageBackground` in questa view.
- `CreateTestPage.css`: layout del form di creazione test, pillole per “Corretta”, quick picks, pulsanti gold/gradient.
- `PreTestPage.css`: card di configurazione test, chip numeriche, CTA gialla.
- `TestPage.css`: layout domanda/risposte, stile pulsanti `.modern-btn` ridefiniti per mantenere look neutro rispetto al globale, pannello risultati.
- `LogoutButton.css`: stile del bottone “Esci” (posizionato in basso a destra).
- `LogoBadge.css`: stile per un eventuale badge/logo flottante (non referenziato nel codice attuale, disponibile per uso futuro).

## Dati e validazioni

- Flashcard
	- Campi necessari lato FE: `question: string`, `answers: [{ text, isCorrect }]` (almeno una `isCorrect: true`).
	- Campi opzionali: `difficulty` (default ‘media’), `thematicArea` (stringa non vuota al create), `createdBy` (dal BE).
- Create test payload (FE → BE):
	- `{ thematicArea: string, questions: Array<{ question: string, answers: Array<{ text: string, isCorrect: boolean }>, difficulty?: string }> }`
- Risposte BE principali:
	- Login/Register: set-cookie `token`, JSON `{ token }` o `{ message, userId, token }`.
	- `/auth/me`: `{ authenticated, user }`.
	- `/flash/areas/list`: `{ areas: string[] }`.
	- `/flash/thematic/:area`: `Flashcard[]`.
	- POST `/flash`: `{ createdCount: number, created: Flashcard[] }`.

Error modes osservati:
- 401/403 su rotte protette senza cookie valido → `RequireAuth` reindirizza alla landing.
- Non-OK in `useFetch` → `error` e UI di caricamento/fallback.
- Errore POST `/flash` in `CreateTestPage` → salvataggio locale e redirect (comportamento “best-effort”).

## Flussi utente principali

1) Login/Registrazione
	 - Utente compila form → `POST /auth/login|register` → cookie impostato → redirect a Dashboard.

2) Selezione area e avvio test
	 - Dashboard carica aree → utente clicca Play su un’area → `PreTestPage` → sceglie numero domande → `TestPage` carica domande e inizia.

3) Creazione test
	 - Utente compila il form → submit → `POST /flash` (se online/autenticato) oppure salvataggio locale (se errore) → redirect a Dashboard.

4) Logout
	 - Clic su “Esci” → `POST /auth/logout` → redirect a Landing.

## Note tecniche e limitazioni

- Hash routing: gli URL pubblici sono in forma `/#/...` (compatibile con static hosting; nessuna configurazione server-side aggiuntiva richiesta).
- Cookie auth: in produzione richiede HTTPS e CORS correttamente configurato.
- Test custom offline: non supportato. In caso di errore di rete/BE durante la creazione, viene mostrato un messaggio e non si effettua salvataggio locale.
- Immagini area: link a Unsplash (endpoint pubblico) con fallback SVG per robustezza; nessuna dipendenza esterna usata.

