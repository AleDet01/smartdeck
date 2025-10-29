# Documentazione Frontend - SmartDeck

## Panoramica Generale

SmartDeck è un'applicazione web Single Page Application (SPA) sviluppata in **React 19.1.1** che permette agli utenti di creare, gestire ed eseguire test di apprendimento basati su flashcard. Il frontend offre un'interfaccia moderna e intuitiva per l'autenticazione, la creazione di test personalizzati, l'esecuzione di quiz interattivi e la visualizzazione dettagliata delle statistiche di performance.

## Tecnologie Utilizzate

### Stack Principale
- **React 19.1.1**: Framework JavaScript per la costruzione dell'interfaccia utente
- **React Router DOM 7.9.1**: Gestione del routing client-side e navigazione tra le pagine
- **React Scripts 5.0.1**: Toolchain per lo sviluppo, build e testing

### Librerie di Visualizzazione
- **Recharts 2.15.4**: Libreria per la creazione di grafici e visualizzazioni statistiche interattive

### Testing
- **@testing-library/react 16.3.0**: Testing dei componenti React
- **@testing-library/jest-dom 6.8.0**: Matchers personalizzati per Jest
- **@testing-library/user-event 13.5.0**: Simulazione delle interazioni utente

## Architettura dell'Applicazione

### Struttura delle Cartelle

```
frontend/src/
├── components/          # Componenti riutilizzabili
│   ├── AreaBox.jsx
│   ├── AreaChart.jsx
│   ├── LogoutButton.jsx
│   ├── PageBackground.jsx
│   ├── StatsBox.jsx
│   └── Topbar.jsx
├── pages/              # Pagine dell'applicazione
│   ├── AreaStatsPage.jsx
│   ├── CreateTestPage.jsx
│   ├── DashboardPage.jsx
│   ├── LandingPage.jsx
│   ├── PreTestPage.jsx
│   ├── StatsList.jsx
│   └── TestPage.jsx
├── utils/              # Utility e helper functions
│   ├── apiHost.js
│   ├── hooks.js
│   └── imageUtils.js
├── css/                # Fogli di stile
│   ├── CreateTestPage.css
│   ├── DashboardPage.css
│   ├── LandingPage.css
│   ├── LogoBadge.css
│   ├── LogoutButton.css
│   ├── PreTestPage.css
│   ├── StatsPage.css
│   └── TestPage.css
├── App.jsx             # Componente principale e routing
├── index.js            # Entry point dell'applicazione
└── index.css           # Stili globali
```

### Pattern Architetturali

1. **Component-Based Architecture**: L'applicazione è suddivisa in componenti riutilizzabili e modulari
2. **Route-Based Code Splitting**: Ogni pagina è un componente separato caricato tramite React Router
3. **Custom Hooks**: Logica condivisa incapsulata in hooks personalizzati (`useFetch`, `useCurrentUser`, `useAdaptiveFontSize`)
4. **Protected Routes**: Implementazione di un componente `RequireAuth` per proteggere le route autenticate

## Sistema di Routing

L'applicazione utilizza **HashRouter** per la gestione del routing, compatibile con deployment statici. Le route principali sono:

### Route Pubbliche
- **`/`**: Landing page con form di login/registrazione
- **`/login`**: Redirect alla landing page

### Route Protette (Richiedono Autenticazione)
- **`/dashboard`**: Dashboard principale con lista delle aree tematiche
- **`/stats`**: Lista delle aree con statistiche disponibili
- **`/stats/:area`**: Pagina dettagliata delle statistiche per area
- **`/crea-test`**: Form per creare nuovi test personalizzati
- **`/pretest/:area`**: Configurazione del test (scelta numero domande)
- **`/test/:area/:num`**: Pagina di esecuzione del test

### Gestione dell'Autenticazione

Il componente `RequireAuth` protegge le route verificando lo stato di autenticazione tramite chiamata API a `/auth/me`. Se l'utente non è autenticato, viene reindirizzato alla landing page.

## Funzionalità Principali

### 1. Autenticazione e Autorizzazione

**Landing Page** (`LandingPage.jsx`)
- Form dual-mode per login e registrazione
- Toggle tra modalità login/registrazione
- Gestione degli errori di autenticazione
- Utilizzo di cookie HttpOnly per la gestione della sessione
- Redirect automatico alla dashboard dopo login/registrazione riusciti

### 2. Dashboard e Gestione Aree

**Dashboard Page** (`DashboardPage.jsx`)
- Visualizzazione dinamica di tutte le aree tematiche disponibili
- Card interattive con immagini generate dinamicamente (via Unsplash API)
- Fallback a gradienti SVG in caso di errore caricamento immagini
- Pulsante play per avviare test per ogni area
- Sistema di font adattivo per titoli delle aree
- Caricamento dati da API backend (`/flash/areas/list`)

### 3. Creazione Test Personalizzati

**Create Test Page** (`CreateTestPage.jsx`)
- Form dinamico per creare test con numero variabile di domande (1-20)
- Gestione di:
  - Nome del test (area tematica)
  - Numero di domande configurabile
  - 3 risposte multiple per domanda
  - Selezione della risposta corretta tramite radio button
  - Upload immagine di copertina (opzionale)
- Quick picks per selezione rapida (5, 10, 15 domande)
- Validazione form (tutti i campi devono essere compilati)
- Salvataggio tramite API con fallback a localStorage

### 4. Esecuzione Test

**Pre-Test Page** (`PreTestPage.jsx`)
- Configurazione pre-test con selezione numero domande
- Quick picks intelligenti basati sul numero massimo di domande disponibili
- Validazione del numero di domande (min 1, max disponibili)
- Caricamento numero flashcard disponibili da API

**Test Page** (`TestPage.jsx`)
- Interfaccia di quiz interattiva
- Funzionalità chiave:
  - Visualizzazione domanda corrente con progresso (es. "Domanda 3/10")
  - 3 risposte multiple cliccabili
  - Timer automatico per ogni domanda
  - Navigazione avanti/indietro tra domande
  - Feedback visivo immediato alla selezione risposta
  - Calcolo automatico del punteggio finale
  - Tracciamento del tempo per domanda
- Gestione test custom da sessionStorage
- Shuffle automatico delle flashcard dal backend
- Salvataggio risultati via API (`/testresult`)
- Schermata risultati con:
  - Statistiche generali (totale domande, corrette, tempo totale, tempo medio, percentuale)
  - Lista dettagliata delle domande sbagliate
  - Comparazione risposta data vs risposta corretta
  - Pulsante per tornare alla dashboard

### 5. Statistiche e Analytics

**Stats List Page** (`StatsList.jsx`)
- Elenco di tutte le aree per cui l'utente ha completato test
- Card cliccabili per navigare alle statistiche dettagliate
- Caricamento dati da API (`/testresult/areas/list?userId=...`)
- Messaggio informativo se non ci sono test completati

**Area Stats Page** (`AreaStatsPage.jsx`)
- Dashboard statistiche completa per area specifica:
  - **Metriche aggregate**: Tentativi totali, punteggio medio, miglior punteggio
  - **Grafico andamento**: Visualizzazione cronologica dei punteggi (LineChart)
  - **Errori recenti**: Lista scrollabile delle ultime 50 risposte sbagliate
- Caricamento parallelo di dati statistici e errori
- Calcolo dinamico delle percentuali e medie
- Utilizzo della libreria Recharts per visualizzazione grafica

## Componenti Riutilizzabili - Documentazione Tecnica Dettagliata

### 1. AreaBox (`AreaBox.jsx`)

**Tipo**: Functional Component

**Descrizione**:  
Componente presentazionale semplificato che rappresenta una singola card per un'area tematica. Visualizza il nome dell'area e fornisce un pulsante per avviare l'interazione (navigazione verso il test).

**Props**:
```javascript
{
  area: string,      // Nome dell'area tematica da visualizzare
  onPlay: function   // Callback invocata al click sul pulsante Play
}
```

**Struttura DOM**:
```jsx
<div className="area-box">
  <h3>{area}</h3>
  <button onClick={onPlay}>Play</button>
</div>
```

**Funzionalità**:
- **Visualizzazione Area**: Mostra il nome dell'area in un heading `<h3>`
- **Interazione Click**: Il pulsante "Play" invoca la funzione `onPlay` passata come prop
- **Styling**: Utilizza la classe CSS `area-box` per la stilizzazione

**Utilizzo**:  
Questo componente viene utilizzato principalmente nella `DashboardPage` per creare una griglia di aree tematiche disponibili. Ogni AreaBox rappresenta un'area e permette all'utente di avviare un test cliccando sul pulsante Play.

**Esempio di implementazione**:
```jsx
<AreaBox 
  area="Matematica" 
  onPlay={() => navigate(`/pretest/Matematica`)} 
/>
```

**Note Tecniche**:
- Componente stateless puro (no hooks, no side effects)
- Nessuna logica interna, delega completamente l'azione al componente padre
- Design pattern: Presentational Component

---

### 2. AreaChart (`AreaChart.jsx`)

**Tipo**: Memoized Functional Component

**Descrizione**:  
Wrapper ottimizzato per il componente `LineChart` della libreria Recharts. Fornisce un grafico a linee responsive per visualizzare l'andamento dei punteggi nel tempo.

**Props**:
```javascript
{
  data: Array<Object>,  // Array di oggetti con dati da visualizzare
                        // Formato: [{ label: string, [dataKey]: number }, ...]
                        // Default: []
  
  dataKey: string,      // Chiave dell'oggetto data da usare per i valori Y
                        // Default: 'score'
  
  height: number        // Altezza del grafico in pixel
                        // Default: 220
}
```

**Dipendenze**:
- `recharts`: LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
- `react`: memo (Higher-Order Component per ottimizzazione)

**Struttura Component Tree**:
```
ResponsiveContainer (width="100%", height={height})
└── LineChart (data, margin)
    ├── CartesianGrid (strokeDasharray="3 3")
    ├── XAxis (dataKey="label")
    ├── YAxis
    ├── Tooltip
    └── Line (type="monotone", dataKey={dataKey}, stroke="#8884d8", strokeWidth=2, dot)
```

**Funzionalità**:
- **Responsive**: Il grafico si adatta automaticamente alla larghezza del container padre
- **Configurazione Margin**: Margini predefiniti (top: 10, right: 20, left: 0, bottom: 0)
- **Griglia Cartesiana**: Linee tratteggiate (dasharray 3-3) per migliorare la leggibilità
- **Assi**: Asse X mostra le label, asse Y i valori numerici
- **Tooltip Interattivo**: Visualizza valori al passaggio del mouse
- **Linea Monotona**: Interpolazione smooth tra i punti con dots visibili

**Ottimizzazioni**:
- **React.memo**: Il componente è wrappato in `memo()` per prevenire re-render non necessari
- Confronto shallow delle props: il componente si ri-renderizza solo se data, dataKey o height cambiano

**Utilizzo**:  
Utilizzato principalmente in `AreaStatsPage` per visualizzare l'andamento cronologico dei punteggi dei test.

**Esempio di implementazione**:
```jsx
<AreaChart 
  data={[
    { label: '#1', score: 75 },
    { label: '#2', score: 82 },
    { label: '#3', score: 90 }
  ]} 
  dataKey="score" 
  height={260} 
/>
```

**Styling**:
- Stroke color: `#8884d8` (blu/viola)
- Stroke width: 2px
- Griglia: linee tratteggiate grigie

---

### 3. LogoutButton (`LogoutButton.jsx`)

**Tipo**: Functional Component con Hooks

**Descrizione**:  
Componente che fornisce un pulsante di logout persistente e context-aware. Si nasconde automaticamente nelle pagine pubbliche e gestisce il processo completo di logout con pulizia dello stato.

**Props**: Nessuna (componente autonomo)

**Hooks Utilizzati**:
- `useLocation()`: Ottiene l'oggetto location corrente per determinare il path attivo
- `useNavigate()`: Hook per navigazione programmatica post-logout

**Costanti**:
```javascript
const HIDDEN_PATHS = ['/', '/login'];  // Paths dove il pulsante non viene renderizzato
```

**Funzionalità**:

1. **Conditional Rendering**:
   ```javascript
   if (HIDDEN_PATHS.includes(location.pathname)) return null;
   ```
   Il componente ritorna `null` (non renderizza nulla) se il path corrente è '/' o '/login'

2. **handleLogout - Async Function**:
   ```javascript
   const handleLogout = async () => {
     try {
       // 1. Chiamata API di logout
       await fetch(`${API_HOST}/auth/logout`, {
         method: 'POST',
         credentials: 'include'  // Include cookie di sessione
       });
       
       // 2. Pulizia localStorage
       localStorage.removeItem('token');
     } catch (err) {
       // Silent fail - procede comunque al redirect
     }
     
     // 3. Redirect alla landing page
     navigate('/');
   };
   ```

**Struttura DOM**:
```jsx
<button
  type="button"
  className="logout-btn"
  title="Esci"           // Tooltip accessibilità
  onClick={handleLogout}
>
  Esci
</button>
```

**Flusso di Logout**:
1. Invocazione API `/auth/logout` (POST) con credentials
2. Rimozione token da localStorage (se presente)
3. Navigate programmatico verso `/`
4. Il backend invalida la sessione lato server

**Styling**:
- Importa `LogoutButton.css` per stili custom
- Classe principale: `logout-btn`

**Utilizzo**:  
Renderizzato globalmente in `App.jsx` fuori dal routing, visibile in tutte le pagine autenticate.

**Esempio integrazione in App.jsx**:
```jsx
<HashRouter>
  <Routes>
    {/* ... routes */}
  </Routes>
  <LogoutButton />  {/* Sempre renderizzato ma condizionatamente visibile */}
</HashRouter>
```

**Note Tecniche**:
- Gestione errori silenziosa: anche in caso di errore API, l'utente viene reindirizzato
- Strategia fail-safe: se il server non risponde, l'app procede comunque con la pulizia client-side
- Type button esplicito per prevenire submit accidentali in form

---

### 4. PageBackground (`PageBackground.jsx`)

**Tipo**: Functional Component (Presentational)

**Descrizione**:  
Componente wrapper minimale che fornisce un'immagine di sfondo consistente per tutte le pagine dell'applicazione. Implementa pattern accessibilità con `aria-hidden`.

**Props**: Nessuna

**Struttura DOM**:
```jsx
<div className="page-bg-wrapper" aria-hidden="true">
  <img 
    className="page-bg" 
    src={process.env.PUBLIC_URL + '/sfondo_pages.jpg'} 
    alt="" 
  />
</div>
```

**Funzionalità**:

1. **Caricamento Immagine Statica**:
   - Source: `public/sfondo_pages.jpg`
   - Utilizzo di `process.env.PUBLIC_URL` per compatibilità con diverse configurazioni di build
   - Path assoluto dalla cartella public

2. **Accessibilità**:
   - `aria-hidden="true"`: Indica agli screen reader di ignorare questo elemento (puramente decorativo)
   - `alt=""`: Alt tag vuoto (corretto per immagini decorative secondo WCAG)

3. **CSS Class Structure**:
   - `page-bg-wrapper`: Container wrapper (probabilmente con position: relative/absolute)
   - `page-bg`: Immagine vera e propria (probabilmente con object-fit: cover e z-index negativo)

**Pattern di Design**:
- Separazione dello sfondo dalla logica della pagina
- Riutilizzabile in tutte le pagine che necessitano dello stesso background
- Non interferisce con il DOM tree semantico (aria-hidden)

**Utilizzo**:  
Importato e renderizzato come primo elemento in quasi tutte le pagine protette:
```jsx
function SomePage() {
  return (
    <div className="some-page">
      <PageBackground />
      <Topbar />
      {/* ... contenuto pagina */}
    </div>
  );
}
```

**Styling CSS Tipico**:
```css
.page-bg-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1;
  overflow: hidden;
}

.page-bg {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

**Note Tecniche**:
- Componente stateless puro
- Zero props, zero state, zero logic
- Performance ottimale: rendering estremamente veloce
- Memoization non necessaria (già minimale)

---

### 5. StatsBox (`StatsBox.jsx`)

**Tipo**: Functional Component (Presentational)

**Descrizione**:  
Card component per la visualizzazione di una singola metrica statistica. Design minimale e riutilizzabile per dashboard analytics.

**Props**:
```javascript
{
  title: string,           // Titolo della metrica (es. "Tentativi")
  value: string | number,  // Valore principale della metrica (es. 15, "85%")
  description?: string     // Descrizione opzionale (es. "Numero totale di test")
}
```

**Struttura DOM**:
```jsx
<div className="stats-box">
  <div className="stats-box-title">{title}</div>
  <div className="stats-box-value">{value}</div>
  {description && <div className="stats-box-desc">{description}</div>}
</div>
```

**Funzionalità**:

1. **Visualizzazione Gerarchica**:
   - Title: Header della metrica
   - Value: Valore principale (styling prominente)
   - Description: Testo esplicativo opzionale (conditional rendering)

2. **Conditional Rendering**:
   ```javascript
   {description && <div className="stats-box-desc">{description}</div>}
   ```
   La descrizione viene renderizzata solo se passata come prop (truthy value)

3. **Flessibilità del Value**:
   - Accetta sia stringhe che numeri
   - Supporta formattazione custom (es. percentuali, decimali, unità di misura)

**CSS Class Structure**:
- `stats-box`: Container principale della card
- `stats-box-title`: Stile per il titolo (probabilmente font-size ridotto, color secondario)
- `stats-box-value`: Stile per il valore (font-size grande, bold, color primario)
- `stats-box-desc`: Stile per la descrizione (font-size piccolo, color terziario)

**Utilizzo**:  
Principalmente utilizzato in `AreaStatsPage` per visualizzare metriche aggregate in una griglia responsive:

```jsx
<div className="stats-row">
  <StatsBox 
    title="Tentativi" 
    value={summary.attempts} 
    description="Numero totale di test" 
  />
  <StatsBox 
    title="Punteggio medio" 
    value={`${summary.avg}%`} 
    description="Media sui test" 
  />
  <StatsBox 
    title="Miglior punteggio" 
    value={`${summary.best}%`} 
    description="Record personale" 
  />
</div>
```

**Styling Tipico**:
```css
.stats-box {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.stats-box-value {
  font-size: 32px;
  font-weight: bold;
  color: #2563eb;
}
```

**Note Tecniche**:
- Componente stateless puro
- Nessuna logica di business
- Perfetto per composizione in griglie di statistiche
- Design pattern: Atomic Design (Molecule level)

---

### 6. Topbar (`Topbar.jsx`)

**Tipo**: Functional Component con Hooks

**Descrizione**:  
Barra di navigazione principale dell'applicazione. Fornisce navigazione tra le sezioni principali con evidenziazione visiva della pagina attiva.

**Props**: Nessuna (utilizza routing context)

**Hooks Utilizzati**:
- `useNavigate()`: Hook per navigazione programmatica al click dei pulsanti
- `useLocation()`: Hook per ottenere il path corrente e determinare la pagina attiva

**Funzionalità**:

1. **Helper Function - isActive**:
   ```javascript
   const isActive = (path) => 
     location.pathname === path || location.pathname.startsWith(path);
   ```
   
   **Logica**:
   - Match esatto: `location.pathname === path`
   - Match prefisso: `location.pathname.startsWith(path)`
   - Esempio: `/stats/Matematica` è considerato attivo per path `/stats`

2. **Navigazione**:
   Tre pulsanti principali che navigano verso:
   - `/dashboard` - Sezione Test (visualizzazione aree)
   - `/stats` - Sezione Statistiche (lista aree con stats)
   - `/crea-test` - Form creazione nuovo test

3. **Active State Styling**:
   ```javascript
   className={`topbar-btn${isActive('/dashboard') ? ' active' : ''}`}
   ```
   Aggiunge dinamicamente la classe `active` al pulsante della sezione corrente

**Struttura DOM**:
```jsx
<div className="dashboard-topbar">
  <button 
    className={`topbar-btn${isActive('/dashboard') ? ' active' : ''}`} 
    onClick={() => navigate('/dashboard')}
  >
    Test
  </button>
  <button 
    className={`topbar-btn${isActive('/stats') ? ' active' : ''}`} 
    onClick={() => navigate('/stats')}
  >
    Stats
  </button>
  <button 
    className={`topbar-btn${isActive('/crea-test') ? ' active' : ''}`} 
    onClick={() => navigate('/crea-test')}
  >
    Crea un nuovo test
  </button>
</div>
```

**CSS Dependencies**:
- Importa `DashboardPage.css` (stili condivisi)
- Classi utilizzate: `dashboard-topbar`, `topbar-btn`, `active`

**Pattern di Navigazione**:
- **Client-Side Navigation**: Utilizza `navigate()` invece di `<Link>` component
- **Programmatic**: Navigazione attivata da onClick invece di href
- **No Page Reload**: SPA navigation (React Router)

**Utilizzo**:  
Renderizzato come secondo elemento in quasi tutte le pagine protette (dopo PageBackground):

```jsx
function DashboardPage() {
  return (
    <div className="dashboard-page">
      <PageBackground />
      <Topbar />
      {/* ... contenuto pagina */}
    </div>
  );
}
```

**Active State Behavior**:
| Path Corrente | Test Active | Stats Active | Crea Test Active |
|--------------|-------------|--------------|------------------|
| /dashboard | ✓ | ✗ | ✗ |
| /stats | ✗ | ✓ | ✗ |
| /stats/Matematica | ✗ | ✓ | ✗ |
| /crea-test | ✗ | ✗ | ✓ |
| /pretest/Storia | ✗ | ✗ | ✗ |

**Styling Tipico**:
```css
.dashboard-topbar {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: rgba(255,255,255,0.95);
}

.topbar-btn {
  padding: 10px 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.3s;
}

.topbar-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
}
```

**Note Tecniche**:
- Il componente si ri-renderizza automaticamente ad ogni cambio route (useLocation dependency)
- Performance: Re-render minimale grazie a logica semplice
- Accessibilità: Uso di `<button>` semantici invece di div cliccabili
- UX: Feedback visivo immediato sulla sezione corrente

---

## Pages

### 1. LandingPage (`LandingPage.jsx`)

**Tipo**: Functional Component con State Management

**Descrizione**:  
Pagina di accesso all'applicazione. Fornisce un form dual-mode per login e registrazione utenti con gestione completa degli stati, errori e loading.

**Route**: `/` (pubblica)

**State Management**:
```javascript
const [mode, setMode] = useState('login');        // 'login' | 'register'
const [username, setUsername] = useState('');     // Input username
const [password, setPassword] = useState('');     // Input password
const [error, setError] = useState('');           // Messaggio errore
const [loading, setLoading] = useState(false);    // Stato caricamento
```

**Hooks Utilizzati**:
- `useState`: Gestione locale dello stato del form
- `useCallback`: Memoizzazione delle funzioni handler

**Funzioni Principali**:

1. **toggleMode - useCallback**:
   ```javascript
   const toggleMode = useCallback(() => {
     setMode(prev => (prev === 'login' ? 'register' : 'login'));
     setError('');  // Reset errore al cambio modalità
   }, []);
   ```
   
   **Funzionalità**:
   - Toggle tra modalità 'login' e 'register'
   - Reset del messaggio di errore
   - Memoizzato (dependencies: []) - stabile tra re-render

2. **handleSubmit - useCallback Async**:
   ```javascript
   const handleSubmit = useCallback(async (e) => {
     e.preventDefault();           // Previene reload pagina
     setError('');                 // Reset errore
     setLoading(true);            // Attiva loading state
     
     try {
       const body = { 
         username: username.trim(),  // Rimuove spazi bianchi
         password 
       };
       
       const res = await fetch(`${API_HOST}/auth/${mode}`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         credentials: 'include',     // Include cookie di sessione
         body: JSON.stringify(body)
       });
       
       const data = await res.json().catch(() => ({}));  // Fallback a oggetto vuoto
       
       if (!res.ok) {
         throw new Error(data?.error || 'Errore di autenticazione');
       }
       
       // Successo: redirect alla dashboard
       window.location.href = '/#/dashboard';
       
     } catch (err) {
       setError(err.message || 'Errore');
     } finally {
       setLoading(false);  // Disattiva loading in ogni caso
     }
   }, [mode, username, password]);  // Re-crea se cambiano le dependencies
   ```

**Flusso di Autenticazione**:
1. User compila form e submit
2. preventDefault() blocca reload
3. Trim username e costruzione payload
4. POST request a `/auth/login` o `/auth/register`
5. Backend valida credenziali e setta cookie HttpOnly
6. Se ok: redirect a `/#/dashboard`
7. Se errore: visualizza messaggio in UI

**Struttura DOM**:
```jsx
<div className="landing-container">
  <div className="landing-box">
    <div className="form-section">
      <h2 className="section-title" style={{ userSelect: 'none' }}>Benvenuto</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        {/* Input Username */}
        <input
          className="modern-input"
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
        />
        
        {/* Input Password */}
        <input
          className="modern-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          required
        />
        
        {/* Messaggio Errore */}
        {error ? <div className="error">{error}</div> : null}
        
        {/* Submit Button */}
        <button className="modern-btn" type="submit" disabled={loading}>
          {loading ? 'Attendere…' : (mode === 'login' ? 'Entra' : 'Registrati')}
        </button>
      </form>
      
      {/* Toggle Mode Button */}
      <button className="link-btn" type="button" onClick={toggleMode}>
        {mode === 'login' 
          ? 'Non hai un account? Registrati' 
          : 'Hai già un account? Accedi'}
      </button>
    </div>
  </div>
</div>
```

**Caratteristiche UX**:
- **Testo dinamico del pulsante**: Cambia tra "Entra"/"Registrati" e "Attendere…"
- **Disabled durante loading**: Previene submit multipli
- **AutoComplete intelligente**: current-password vs new-password
- **HTML5 Validation**: Attributo `required` sui campi
- **Error Display**: Conditional rendering del messaggio errore
- **userSelect: 'none'**: Titolo non selezionabile

**API Endpoints**:
- `POST /auth/login` - Autenticazione esistente
- `POST /auth/register` - Creazione nuovo utente

**Note Tecniche**:
- Utilizza `window.location.href` per hard redirect (refresh completo)
- Cookie HttpOnly gestiti interamente dal backend
- Fallback `.catch(() => ({}))` per gestire response non-JSON
- Dependencies di useCallback: ottimizzazione re-render

---

### 2. DashboardPage (`DashboardPage.jsx`)

**Tipo**: Functional Component con Custom Hooks

**Descrizione**:  
Dashboard principale dell'applicazione. Visualizza tutte le aree tematiche disponibili come card interattive con immagini dinamiche e permette di avviare test.

**Route**: `/dashboard` (protetta)

**Hooks Utilizzati**:
- `useNavigate()`: Navigazione programmatica verso pre-test
- `useFetch()`: Custom hook per caricamento aree da API
- `useMemo()`: Memoizzazione elaborazione dati aree
- `useAdaptiveFontSize()`: Custom hook per font responsivo

**State e Data Fetching**:
```javascript
const navigate = useNavigate();
const { data, loading } = useFetch(`${API_HOST}/flash/areas/list`);
```

**Elaborazione Dati - useMemo**:
```javascript
const areas = useMemo(() => {
  if (!data) return null;
  
  const list = Array.isArray(data.areas) ? data.areas : [];
  
  return list.map((name, idx) => {
    const safeName = String(name || '').trim() || `area-${idx}`;
    return { 
      name: safeName, 
      img: makeConceptImageUrl(safeName, idx),      // URL Unsplash
      fallback: makeGradientDataUrl(idx)            // SVG gradient fallback
    };
  });
}, [data]);  // Ricalcola solo quando data cambia
```

**Funzionalità**:

1. **Caricamento Aree**:
   - Fetch da `/flash/areas/list`
   - Trasformazione array di stringhe in oggetti con metadata
   - Generazione URL immagini dinamiche
   - Creazione fallback SVG per errori

2. **Font Adattivo**:
   ```javascript
   useAdaptiveFontSize('.area-title', [areas]);
   ```
   - Ridimensiona automaticamente i titoli delle aree
   - Previene overflow del testo
   - Triggered quando `areas` cambia

3. **Image Fallback**:
   ```javascript
   onError={(e) => { 
     e.currentTarget.onerror = null;        // Previene loop infinito
     e.currentTarget.src = area.fallback;   // Switch a gradient SVG
   }}
   ```

**Rendering Condizionale**:

1. **Loading State**:
   ```jsx
   if (loading || areas === null) {
     return (
       <div className="dashboard-page">
         <PageBackground />
         <Topbar />
         <div className="areas-grid" id="tests">
           <div>Caricamento aree...</div>
         </div>
       </div>
     );
   }
   ```

2. **Empty State**:
   ```jsx
   {areas.length === 0 && <div>Nessuna area disponibile con flashcards.</div>}
   ```

3. **Grid di Aree**:
   ```jsx
   {areas.map(area => (
     <div key={area.name} className="area-box">
       <img 
         className="area-bg" 
         src={area.img} 
         alt={area.name} 
         onError={/* fallback handler */} 
       />
       <div className="area-title">{area.name}</div>
       <div className="area-content">
         <button 
           className="area-play-btn-icon" 
           onClick={() => navigate(`/pretest/${area.name}`)} 
           aria-label={`Play ${area.name}`}
         >
           {/* SVG Play Icon con Gradient */}
         </button>
       </div>
     </div>
   ))}
   ```

**SVG Play Button**:
```svg
<svg width="28" height="28" viewBox="0 0 28 28" fill="none">
  <defs>
    <linearGradient id="playGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#ffe066"/>
      <stop offset="100%" stopColor="#ffd60a"/>
    </linearGradient>
  </defs>
  <circle cx="14" cy="14" r="14" fill="url(#playGrad)"/>
  <polygon points="11,9 20,14 11,19" fill="#23272f"/>
</svg>
```

**Flusso Utente**:
1. Componente monta e fa fetch delle aree
2. Mostra "Caricamento aree..." durante fetch
3. Elabora dati e genera metadata immagini
4. Applica font adattivo ai titoli
5. Renderizza grid di card
6. User clicca Play → navigate a `/pretest/{area}`

**Utility Functions Utilizzate**:
- `makeConceptImageUrl(name, idx)`: URL Unsplash basato su topic
- `makeGradientDataUrl(idx)`: SVG gradient come Data URL

**CSS Classes**:
- `dashboard-page`: Container principale
- `areas-grid`: Grid layout per le card
- `area-box`: Singola card area
- `area-bg`: Immagine di sfondo
- `area-title`: Titolo area (font adattivo)
- `area-content`: Container pulsante play
- `area-play-btn-icon`: Pulsante play SVG

**Performance**:
- useMemo previene ricalcolo areas ad ogni render
- useFetch con AbortController previene memory leak
- Font adattivo ottimizzato con requestAnimationFrame

**Accessibilità**:
- `aria-label` su pulsante play per screen readers
- Alt text sulle immagini
- Semantic HTML (button, non div cliccabili)

---

### 3. PreTestPage (`PreTestPage.jsx`)

**Tipo**: Functional Component con State e URL Params

**Descrizione**:  
Pagina di configurazione pre-test. Permette all'utente di selezionare il numero di domande per il test di un'area specifica prima di iniziare.

**Route**: `/pretest/:area` (protetta)

**URL Parameters**:
```javascript
const { area } = useParams();  // Nome area dalla route
```

**State Management**:
```javascript
const [numQuestions, setNumQuestions] = useState(10);  // Numero domande selezionate
```

**Data Fetching**:
```javascript
const { data } = useFetch(`${API_HOST}/flash/thematic/${area}`);
const maxQuestions = data?.length || 20;  // Numero massimo disponibile
```

**Calcolo Quick Picks - useMemo**:
```javascript
const quickPicks = useMemo(() => {
  const base = [5, 10, 15, 20];                       // Opzioni base
  const list = base.filter(n => n <= maxQuestions);   // Filtra per max disponibili
  
  // Fallback se nessuna opzione è valida
  return list.length === 0 ? [Math.min(5, maxQuestions)] : list;
}, [maxQuestions]);
```

**Funzioni**:

1. **handleNumChange - Clamping**:
   ```javascript
   const handleNumChange = (val) => {
     const clamped = Math.max(1, Math.min(val, maxQuestions));
     setNumQuestions(clamped);
   };
   ```
   
   **Logica**:
   - Assicura valore minimo: 1
   - Assicura valore massimo: maxQuestions
   - Previene valori invalidi da input manuale

**Struttura UI**:
```jsx
<div className="pretest-page">
  <PageBackground />
  <Topbar />
  <div className="pretest-card">
    <h2>Configura il test: <span className="accent">{area}</span></h2>
    
    {/* Quick Picks Chips */}
    <div className="quick-picks" aria-label="Selezione rapida numero domande">
      {quickPicks.map(n => (
        <button
          key={n}
          className={n === numQuestions ? 'chip active' : 'chip'}
          onClick={() => setNumQuestions(n)}
          type="button"
        >
          {n}
        </button>
      ))}
    </div>
    
    {/* Input Manuale */}
    <label>
      Numero domande (max {maxQuestions}):
      <input
        type="number"
        min={1}
        max={maxQuestions}
        value={numQuestions}
        onChange={e => handleNumChange(Number(e.target.value) || 0)}
        className="modern-input"
      />
    </label>
    
    {/* Pulsante Avvio Test */}
    <button
      className="modern-btn cta"
      onClick={() => navigate(`/test/${encodeURIComponent(area)}/${numQuestions}`)}
      disabled={!maxQuestions || numQuestions < 1}
      type="button"
    >
      Inizia il test
    </button>
  </div>
</div>
```

**Quick Picks Behavior**:
| maxQuestions | quickPicks Generati |
|-------------|---------------------|
| 3 | [5] → [3] (clamped) |
| 7 | [5] |
| 12 | [5, 10] |
| 18 | [5, 10, 15] |
| 25+ | [5, 10, 15, 20] |

**Validazione**:
1. **HTML5 Constraints**: `min={1}` `max={maxQuestions}`
2. **JS Clamping**: handleNumChange forza range valido
3. **Button Disabled**: `!maxQuestions || numQuestions < 1`

**Flusso Utente**:
1. Utente arriva da dashboard cliccando su area
2. Componente fetch numero flashcard disponibili per l'area
3. Calcola quick picks basati su maxQuestions
4. Mostra default 10 domande (o meno se < 10 disponibili)
5. User seleziona via chips o input manuale
6. Click "Inizia il test" → navigate a `/test/{area}/{num}`

**URL Encoding**:
```javascript
navigate(`/test/${encodeURIComponent(area)}/${numQuestions}`)
```
- Encode area name per gestire caratteri speciali
- numQuestions è già number, sicuro in URL

**Accessibility**:
- `aria-label` su quick-picks container
- Label associato a input number
- Type button esplicito su chips (previene submit accidentale)

**Note Tecniche**:
- useMemo ottimizza calcolo quick picks
- Fallback intelligente per edge cases (poche flashcard)
- Active state sui chips per feedback visivo

---

### 4. TestPage (`TestPage.jsx`)

**Tipo**: Complex Functional Component con Multiple States

**Descrizione**:  
Pagina core dell'applicazione. Gestisce l'esecuzione completa del test: caricamento domande, navigazione, timer, selezione risposte, calcolo punteggio e visualizzazione risultati.

**Route**: `/test/:area/:num` (protetta)

**URL Parameters**:
```javascript
const { area, num } = useParams();  // Area tematica e numero domande
```

**State Management Complesso**:
```javascript
// Dati Test
const [questions, setQuestions] = useState([]);           // Array domande
const [userId, setUserId] = useState(null);               // ID utente autenticato

// Navigazione e Progresso
const [current, setCurrent] = useState(0);                // Indice domanda corrente

// Risposte
const [allAnswers, setAllAnswers] = useState([]);         // Array risposte utente
const [selectedAnswer, setSelectedAnswer] = useState(null); // Risposta selezionata (temp)

// Timer
const [times, setTimes] = useState([]);                   // Array tempi per domanda
const timerRef = useRef(Date.now());                      // Timestamp inizio domanda

// Risultati
const [showStats, setShowStats] = useState(false);        // Modalità visualizzazione risultati
const [result, setResult] = useState(null);               // Dati risultato finale
```

**Funzioni Helper**:

1. **resetStateForTest**:
   ```javascript
   const resetStateForTest = qs => {
     setQuestions(qs);
     setTimes(Array(qs.length).fill(0));
     setAllAnswers(Array(qs.length).fill(null));
     setSelectedAnswer(null);
     setShowStats(false);
     setResult(null);
     timerRef.current = Date.now();
   };
   ```
   - Reset completo dello stato per nuovo test
   - Inizializza array con lunghezza corretta
   - Reset timer

**useEffect - Initialization** (Complesso):
```javascript
useEffect(() => {
  // 1. Fetch User ID
  (async () => {
    try {
      const me = await fetch(`${API_HOST}/auth/me`, { credentials: 'include' });
      if (me.ok) {
        const data = await me.json();
        setUserId(data?.user?.id || data?.user?._id || null);
      }
    } catch (e) {
      setUserId(null);
    }
  })();

  const controller = new AbortController();

  // 2. Check SessionStorage per test custom
  try {
    const active = JSON.parse(sessionStorage.getItem('activeCustomTest') || 'null');
    if (active && active.name === area) {
      resetStateForTest(active.questions.slice(0, parseInt(num)));
      sessionStorage.removeItem('activeCustomTest');
      return;  // Early return se test custom
    }
  } catch (err) { }

  // 3. Fetch Flashcards da API
  (async () => {
    try {
      const res = await fetch(
        `${API_HOST}/flash/thematic/${area}`, 
        { signal: controller.signal, credentials: 'include' }
      );
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const data = await res.json();
      const shuffled = data.sort(() => 0.5 - Math.random());  // Shuffle
      const selected = shuffled.slice(0, parseInt(num));      // Prendi num domande
      
      resetStateForTest(selected);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Failed to load flashcards for test:', err.message);
      setQuestions([]);
    }
  })();

  return () => controller.abort();  // Cleanup
}, [area, num]);
```

**Flow Caricamento**:
1. Fetch user ID in parallelo (async IIFE)
2. Check sessionStorage per test custom
3. Se custom: carica da storage e rimuovi
4. Altrimenti: fetch da API
5. Shuffle randomico delle flashcard
6. Slice per numero richiesto
7. Reset state con domande caricate

**handleAnswer - Core Logic**:
```javascript
const handleAnswer = (i) => {
  const now = Date.now();

  // Previeni click multipli
  if (selectedAnswer !== null) return;
  
  // Calcola tempo trascorso
  const elapsed = now - timerRef.current;
  
  // Salva tempo per domanda corrente
  setTimes(prev => {
    const copy = [...prev];
    copy[current] = elapsed;
    return copy;
  });

  // Marca risposta selezionata (feedback visivo)
  setSelectedAnswer(i);
  
  // Salva risposta nell'array globale
  setAllAnswers(prev => {
    const copy = [...prev];
    copy[current] = i;
    return copy;
  });

  // Blur active element (migliora UX su mobile)
  try {
    const active = document.activeElement;
    if (active && typeof active.blur === 'function') active.blur();
  } catch (err) { }

  // Timeout 300ms per feedback visivo, poi avanza
  setTimeout(() => {
    setSelectedAnswer(null);
    
    if (current < questions.length - 1) {
      // Avanza alla prossima domanda
      setCurrent(prev => prev + 1);
      timerRef.current = Date.now();  // Reset timer
      return;
    }
    
    // Ultima domanda: prepara dati finali e salva
    const finalAnswers = allAnswers.slice(0);
    finalAnswers[current] = i;
    
    const finalTimes = times.slice(0);
    finalTimes[current] = elapsed;
    
    computeAndSave(finalAnswers, finalTimes);
  }, 300);
};
```

**computeAndSave - Result Processing**:
```javascript
const computeAndSave = (answersArr, timesArr) => {
  if (!questions.length) return;
  
  // 1. Costruisci array dati risposte
  const answersData = questions.map((qq, idx) => {
    const userIdx = answersArr[idx];
    const selected = typeof userIdx === 'number' ? qq.answers[userIdx] : null;
    const correct = qq.answers.find(a => a.isCorrect);
    
    return {
      question: qq.question,
      userAnswer: selected ? selected.text : '',
      correctAnswer: correct ? correct.text : '',
      isCorrect: !!(selected && selected.isCorrect) || 
                 (selected && correct && selected.text === correct.text),
      time: timesArr[idx] || 0
    };
  });
  
  // 2. Calcola metriche aggregate
  const correctCount = answersData.filter(a => a.isCorrect).length;
  const totalTime = timesArr.reduce((a, b) => a + b, 0);
  
  // 3. Costruisci payload
  const payload = { 
    userId: userId || null, 
    area, 
    numQuestions: questions.length, 
    answers: answersData, 
    correctCount, 
    totalTime, 
    createdAt: new Date().toISOString() 
  };

  setShowStats(true);
  setResult(null);  // Prima null per mostrare loading

  // 4. POST risultato al backend
  fetch(`${API_HOST}/testresult`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload)
  })
    .then(async r => {
      if (!r.ok) {
        const text = await r.text();
        throw new Error(text || `HTTP ${r.status}`);
      }
      return r.json();
    })
    .then(data => setResult({ ...payload, ...data }))  // Merge con response
    .catch(err => {
      console.error('Failed saving test result:', err.message);
      setResult({ ...payload, _error: err.message });  // Fallback con errore
    });
};
```

**Rendering Condizionale (3 Stati)**:

1. **Loading Questions**:
   ```jsx
   if (!questions.length) return (
     <div className="test-page">
       <PageBackground />
       <Topbar />
       <div style={{ padding: 24 }}>Caricamento domande...</div>
     </div>
   );
   ```

2. **Computing Results**:
   ```jsx
   if (showStats && !result) return (
     <div className="test-page">
       <PageBackground />
       <Topbar />
       <h2>Calcolo risultati...</h2>
     </div>
   );
   ```

3. **Results Display**:
   ```jsx
   if (showStats && result) {
     const { answers, correctCount, totalTime } = result;
     const avgTime = (totalTime / answers.length / 1000).toFixed(2);
     const percent = Math.round((correctCount / answers.length) * 100);
     
     return (
       <div className="test-page">
         {/* Header con area e pulsante ritorno */}
         <div className="header">
           <h2>Risultato Test: <span className="header-accent">{area}</span></h2>
           <button onClick={() => {
             navigate('/dashboard');
             setTimeout(() => {
               const el = document.getElementById('tests');
               if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
             }, 160);
           }}>Vai alla sezione test</button>
         </div>
         
         {/* Box statistiche aggregate */}
         <div className="test-stats-box">
           <div><b>Domande totali:</b> {answers.length}</div>
           <div><b>Corrette:</b> {correctCount}</div>
           <div><b>Tempo totale:</b> {(totalTime / 1000).toFixed(2)}s</div>
           <div><b>Tempo medio per domanda:</b> {avgTime}s</div>
           <div><b>Percentuale superamento:</b> {percent}%</div>
         </div>
         
         {/* Lista domande sbagliate */}
         <div className="results-grid">
           <b>Domande sbagliate:</b>
           {answers.filter(a => !a.isCorrect).map((a, i) => (
             <div key={i} className="question-box">
               <div className="q-title">{i + 1}. {a.question}</div>
               <div className="answer-given">
                 Risposta data: <span className="wrong">{a.userAnswer}</span>
               </div>
               <div className="answer-correct">
                 Risposta corretta: <span className="correct">{a.correctAnswer}</span>
               </div>
             </div>
           ))}
           {answers.filter(a => !a.isCorrect).length === 0 && (
             <div className="all-correct">Tutte corrette!</div>
           )}
         </div>
       </div>
     );
   }
   ```

4. **Test in Corso (Default)**:
   ```jsx
   const q = questions[current];
   
   return (
     <div className="test-page">
       <PageBackground />
       <Topbar />
       <div className="test-content">
         <h2 className="question-count">
           Domanda {current + 1} / {questions.length}
         </h2>
         
         <div className="flashcard">
           <div className="question">{q.question}</div>
           <div className="answers">
             {q.answers.map((a, i) => (
               <button
                 key={i}
                 className={selectedAnswer === i ? 'modern-btn selected' : 'modern-btn'}
                 onClick={() => !showStats && handleAnswer(i)}
                 disabled={showStats}
               >
                 {a.text}
               </button>
             ))}
           </div>
         </div>
         
         <div className="test-nav">
           <button 
             className="modern-btn" 
             onClick={() => setCurrent(c => Math.max(0, c - 1))} 
             disabled={current === 0}
           >
             Indietro
           </button>
         </div>
       </div>
     </div>
   );
   ```

**Timer Mechanism**:
- `timerRef.current`: Timestamp start domanda corrente
- `Date.now() - timerRef.current`: Elapsed time in millisecondi
- Reset ad ogni avanzamento domanda
- Salvato in array `times` per ogni risposta

**Navigation Features**:
- Avanti automatico dopo risposta (300ms delay)
- Pulsante "Indietro" manuale (disabled su prima domanda)
- Previene navigazione dopo ultima risposta (va a risultati)

**Scroll Behavior nei Risultati**:
```javascript
setTimeout(() => {
  const el = document.getElementById('tests');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}, 160);
```
- Delay 160ms per permettere rendering dashboard
- Smooth scroll all'elemento con id="tests"

**Edge Cases Gestiti**:
- Test custom da sessionStorage
- Errori fetch (fallback a array vuoto)
- User non autenticato (userId: null)
- Errori salvataggio risultato (mostra comunque risultati con _error flag)
- Response non-JSON
- AbortController cleanup

**Performance**:
- AbortController previene memory leak
- useRef per timer (no re-render)
- Immutable state updates (spread operator)
- Conditional rendering ottimizzato

---

### 5. StatsList (`StatsList.jsx`)

**Tipo**: Functional Component con Custom Hooks

**Descrizione**:  
Pagina indice delle statistiche. Visualizza lista di aree tematiche per cui l'utente ha completato almeno un test, permettendo navigazione alle statistiche dettagliate.

**Route**: `/stats` (protetta)

**Hooks Utilizzati**:
- `useNavigate()`: Navigazione verso statistiche area specifica
- `useCurrentUser()`: Custom hook per dati utente autenticato
- `useFetch()`: Custom hook per caricamento lista aree

**Data Flow**:
```javascript
const navigate = useNavigate();
const { user } = useCurrentUser();  // { user, authenticated, loading }

// Fetch condizionale: solo se user.id disponibile
const { data, loading } = useFetch(
  user?.id 
    ? `${API_HOST}/testresult/areas/list?userId=${encodeURIComponent(user.id)}` 
    : null
);

const areas = data?.areas || [];  // Fallback a array vuoto
```

**Conditional Fetching**:
- Se `user?.id` è falsy → URL è `null` → useFetch non fa request
- Previene errori API con userId undefined
- Pattern safe per fetch dipendenti da auth

**Struttura UI**:
```jsx
<div className="stats-page">
  <PageBackground />
  <Topbar />
  <div className="stats-container">
    {/* Header */}
    <div className="stats-header">
      <h2 className="stats-title">Statistiche</h2>
      <p className="stats-subtitle">
        Scegli un'area per vedere i tuoi risultati e l'andamento nel tempo.
      </p>
    </div>
    
    {/* Loading State */}
    {loading && <div className="stats-empty">Caricamento…</div>}
    
    {/* Empty State */}
    {!loading && areas.length === 0 && (
      <div className="stats-empty">
        Nessuna area con test effettuati. Completa un test dalla dashboard per iniziare.
      </div>
    )}
    
    {/* Grid Aree */}
    <div className="stats-areas-grid">
      {areas.map(a => (
        <button
          key={a}
          className="stat-chip"
          onClick={() => navigate(`/stats/${encodeURIComponent(a)}`)}
        >
          <span className="chip-label">{a}</span>
          <span className="chip-arrow" aria-hidden>›</span>
        </button>
      ))}
    </div>
  </div>
</div>
```

**Chip Design**:
- `chip-label`: Nome area
- `chip-arrow`: Freccia destra (›) decorativa
- `aria-hidden` su arrow (screen reader ignora)
- `encodeURIComponent` per gestire nomi con caratteri speciali

**Stati Visualizzati**:
1. **Loading**: Mostra "Caricamento…"
2. **Empty**: Messaggio informativo con CTA
3. **Populated**: Grid di chip cliccabili

**Flusso Utente**:
1. User naviga a `/stats` da Topbar
2. useCurrentUser fetch user ID
3. useFetch carica lista aree con test completati
4. Rendering grid di chip
5. Click su chip → navigate a `/stats/{area}`

**API Endpoint**:
- `GET /testresult/areas/list?userId={id}`: Lista aree uniche con test

**Note Tecniche**:
- Optional chaining (`user?.id`) previene errori
- Nullish coalescing (`data?.areas || []`) per fallback
- URL encoding per sicurezza
- Componente leggero e performante

---

### 6. AreaStatsPage (`AreaStatsPage.jsx`)

**Tipo**: Functional Component con Parallel Data Fetching

**Descrizione**:  
Dashboard statistiche completa per area specifica. Visualizza metriche aggregate, grafico andamento punteggi e lista errori recenti con doppio fetch parallelo.

**Route**: `/stats/:area` (protetta)

**URL Parameters**:
```javascript
const { area } = useParams();  // Nome area dalla route
```

**Hooks e Data Fetching Parallelo**:
```javascript
const { user } = useCurrentUser();

// URL costruiti condizionalmente
const statsUrl = user?.id 
  ? `${API_HOST}/testresult/${encodeURIComponent(user.id)}/${encodeURIComponent(area)}` 
  : null;
  
const wrongUrl = user?.id 
  ? `${API_HOST}/testresult/wrong/${encodeURIComponent(user.id)}/${encodeURIComponent(area)}?limit=50` 
  : null;

// Fetch paralleli
const { data: statsData, loading: loadingStats } = useFetch(statsUrl);
const { data: wrongData } = useFetch(wrongUrl);
```

**Pattern Parallel Fetch**:
- Due chiamate API indipendenti in parallelo
- statsData: metriche e storico punteggi
- wrongData: ultime 50 risposte sbagliate
- Migliora performance vs sequential fetch

**Data Processing - useMemo**:
```javascript
const { summary, chartData } = useMemo(() => {
  const results = statsData?.results || [];
  const stats = statsData?.stats || {};
  
  return {
    // Metriche aggregate
    summary: {
      attempts: stats.totalTests || 0,
      avg: Math.round((stats.avgScore || 0) * 100),
      best: results.length 
        ? Math.max(...results.map(r => 
            Math.round((r.correctCount / r.numQuestions) * 100)
          )) 
        : 0
    },
    
    // Dati per grafico
    chartData: results
      .map((r, idx) => ({ 
        label: `#${results.length - idx}`,  // Numerazione inversa
        score: Math.round((r.correctCount / r.numQuestions) * 100) 
      }))
      .reverse()  // Ordine cronologico (vecchio → nuovo)
  };
}, [statsData]);  // Ricalcola solo quando statsData cambia

const wrongAnswers = wrongData?.wrong || [];
```

**Calcoli Statistici**:

1. **Attempts**: Totale test effettuati (da backend)
2. **Average**: Media punteggi in percentuale
3. **Best**: Massimo punteggio tra tutti i test
4. **Chart Data**:
   - Label: Numerazione test (#1, #2, #3...)
   - Score: Percentuale corrette per ogni test
   - Reverse: Ordine cronologico per visualizzazione

**Struttura UI**:
```jsx
<div className="dashboard-page">
  <PageBackground />
  <Topbar />
  <div className="area-stats-wrapper">
    <h2 style={{ margin: '18px 24px' }}>Statistiche: {area}</h2>
    
    {loadingStats ? (
      <div style={{ padding: 24 }}>Caricamento...</div>
    ) : (
      <>
        {/* Row Metriche */}
        <div className="stats-row">
          <StatsBox 
            title="Tentativi" 
            value={summary.attempts} 
            description="Numero totale di test" 
          />
          <StatsBox 
            title="Punteggio medio" 
            value={`${summary.avg}%`} 
            description="Media sui test" 
          />
          <StatsBox 
            title="Miglior punteggio" 
            value={`${summary.best}%`} 
            description="Record personale" 
          />
        </div>

        {/* Grafico Andamento */}
        <div className="chart-card" style={{ margin: 24 }}>
          <h3 style={{ margin: '8px 0' }}>Andamento punteggi</h3>
          <AreaChart data={chartData} dataKey="score" height={260} />
        </div>

        {/* Lista Errori Recenti */}
        <div className="chart-card" style={{ margin: 24, maxHeight: 260, overflowY: 'auto' }}>
          <h3 style={{ margin: '8px 0' }}>Risposte sbagliate recenti</h3>
          {wrongAnswers.length === 0 ? (
            <div style={{ color: '#64748b' }}>
              Nessun errore registrato per questa area.
            </div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {wrongAnswers.map((w, i) => (
                <li key={i} style={{ 
                  padding: '8px 0', 
                  borderBottom: '1px solid #e2e8f0' 
                }}>
                  <div style={{ fontWeight: 600 }}>{w.question}</div>
                  <div style={{ fontSize: 13, color: '#ef4444' }}>
                    Tua risposta: {w.userAnswer}
                  </div>
                  <div style={{ fontSize: 13, color: '#16a34a' }}>
                    Corretta: {w.correctAnswer}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </>
    )}
  </div>
</div>
```

**Componenti Utilizzati**:
- `StatsBox`: Card metrica singola (×3)
- `AreaChart`: Grafico lineare con Recharts

**Inline Styles vs CSS**:
- Margin e padding: inline per override rapido
- Colors: inline per semantica (red=error, green=correct)
- Resto: CSS classes

**Scrollable List**:
```css
maxHeight: 260
overflowY: 'auto'
```
- Lista errori scrollabile se > 260px
- Previene layout breaking con molti errori

**Color Coding**:
- `#ef4444`: Red per risposta sbagliata
- `#16a34a`: Green per risposta corretta
- `#64748b`: Slate gray per messaggio empty state

**API Endpoints**:
- `GET /testresult/{userId}/{area}`: Stats e storico
- `GET /testresult/wrong/{userId}/{area}?limit=50`: Ultimi 50 errori

**Performance**:
- useMemo evita ricalcoli ad ogni render
- Parallel fetch riduce tempo caricamento
- Chart memoized (React.memo in AreaChart)

**Empty States**:
- Nessun errore: Messaggio positivo
- Loading: Spinner/testo caricamento

---

### 7. CreateTestPage (`CreateTestPage.jsx`)

**Tipo**: Complex Form Component con Dynamic State

**Descrizione**:  
Form complesso per creazione test personalizzati. Gestisce numero variabile di domande (1-20), ciascuna con 3 risposte e selezione della corretta. Include validazione, quick picks e gestione upload immagine.

**Route**: `/crea-test` (protetta)

**State Management Complesso**:
```javascript
const [testName, setTestName] = useState('');  // Nome area/test
const [numQuestions, setNumQuestions] = useState(1);  // Numero domande
const [questions, setQuestions] = useState([
  { question: '', answers: ['', '', ''] }  // Struttura domanda
]);
const [correctIndexes, setCorrectIndexes] = useState([0]);  // Indici risposte corrette
const [fileName, setFileName] = useState('');  // Nome file immagine
```

**Funzioni Handler**:

1. **handleNumQuestions - Dynamic Array Resizing**:
   ```javascript
   const handleNumQuestions = (n) => {
     setNumQuestions(n);
     
     // Resize questions array
     setQuestions(qs => {
       const arr = [...qs];
       while (arr.length < n) arr.push({ question: '', answers: ['', '', ''] });
       return arr.slice(0, n);  // Tronca se n < lunghezza
     });
     
     // Resize correctIndexes array
     setCorrectIndexes(ci => {
       const arr = [...ci];
       while (arr.length < n) arr.push(0);  // Default: prima risposta
       return arr.slice(0, n);
     });
   };
   ```
   
   **Logica**:
   - Aggiungi domande vuote se n > lunghezza corrente
   - Tronca array se n < lunghezza corrente
   - Mantieni sincronizzati questions e correctIndexes

2. **handleQuestionChange - Immutable Update**:
   ```javascript
   const handleQuestionChange = (i, value) => 
     setQuestions(qs => qs.map((q, idx) => 
       idx === i ? { ...q, question: value } : q
     ));
   ```
   - Map con conditional spread
   - Aggiorna solo domanda all'indice i

3. **handleAnswerChange - Nested Immutable Update**:
   ```javascript
   const handleAnswerChange = (qi, ai, value) => 
     setQuestions(qs => qs.map((q, idx) => 
       idx === qi 
         ? { ...q, answers: q.answers.map((a, j) => j === ai ? value : a) } 
         : q
     ));
   ```
   - qi: Question Index
   - ai: Answer Index
   - Nested map per struttura a due livelli

4. **handleMarkCorrect**:
   ```javascript
   const handleMarkCorrect = (qi, ai) => 
     setCorrectIndexes(ci => { 
       const arr = [...ci]; 
       arr[qi] = ai; 
       return arr; 
     });
   ```
   - Aggiorna indice risposta corretta per domanda qi

**Validazione - useMemo**:
```javascript
const allFilled = useMemo(() => 
  testName && questions.every(q => 
    q.question && q.answers.every(a => a)
  ),
  [testName, questions]
);
```

**Logica Validazione**:
- testName non vuoto
- Tutte le domande hanno testo
- Tutte le risposte hanno testo
- Submit button disabled se !allFilled

**Image Handler**:
```javascript
const handleImage = e => setFileName(e.target.files?.[0]?.name || '');
```
- Optional chaining per sicurezza
- Salva solo nome file (preview purpose)
- File reale non utilizzato (placeholder per future features)

**handleSubmit - Dual Save Strategy**:
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // 1. Costruisci payload
  const payload = {
    thematicArea: testName,
    questions: questions.map((q, qi) => ({
      question: q.question,
      answers: q.answers.map((txt, idx) => ({ 
        text: txt, 
        isCorrect: correctIndexes[qi] === idx  // Boolean flag
      })),
      difficulty: 'media'  // Hardcoded default
    }))
  };

  try {
    // 2. Tentativo salvataggio API
    await fetch(`${API_HOST}/flash`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    
    window.location.href = '/#/dashboard';  // Successo
    
  } catch {
    // 3. Fallback localStorage
    try {
      const stored = JSON.parse(localStorage.getItem('customTests') || '[]');
      const newTest = { 
        id: `custom-${Date.now()}`, 
        name: testName, 
        questions 
      };
      stored.unshift(newTest);  // Aggiungi in testa
      localStorage.setItem('customTests', JSON.stringify(stored));
      window.location.href = '/#/dashboard';
      
    } catch {
      alert('Errore salvataggio test');
    }
  }
};
```

**Save Strategy**:
1. **Primary**: POST a `/flash` endpoint
2. **Fallback**: Save in localStorage
3. **Ultimate Fallback**: Alert errore

**Struttura Form Dinamica**:
```jsx
<form onSubmit={handleSubmit}>
  {/* Nome Test */}
  <input 
    type="text" 
    placeholder="Nome del test (es. Algebra 1)" 
    value={testName} 
    onChange={e => setTestName(e.target.value)} 
    className="modern-input" 
  />

  {/* Numero Domande Row */}
  <div className="ct-row">
    <input 
      type="number" 
      min={1} 
      max={20} 
      value={numQuestions} 
      onChange={e => handleNumQuestions(Number(e.target.value))} 
      className="modern-input" 
      placeholder="Numero domande" 
    />
    
    {/* Quick Picks */}
    <div className="ct-quick">
      {[5, 10, 15].map(n => (
        <button 
          key={n} 
          type="button" 
          className="chip-gold" 
          onClick={() => handleNumQuestions(n)}
        >
          {n}
        </button>
      ))}
    </div>
  </div>

  {/* Upload Immagine */}
  <div className="ct-file">
    <input 
      id="cover-image" 
      type="file" 
      accept="image/*" 
      onChange={handleImage} 
    />
    <label htmlFor="cover-image" className="file-btn">
      Scegli immagine (opzionale)
    </label>
    <span className="file-name">{fileName || 'Nessun file'}</span>
  </div>

  {/* Lista Domande Dinamica */}
  <div className="question-list">
    {questions.map((q, i) => (
      <div key={i} className="question-item">
        {/* Input Domanda */}
        <input 
          type="text" 
          placeholder={`Domanda ${i+1}`} 
          value={q.question} 
          onChange={e => handleQuestionChange(i, e.target.value)} 
          className="modern-input" 
        />
        
        {/* 3 Risposte */}
        {q.answers.map((a, j) => (
          <div key={j} className="answer-row">
            <input 
              type="text" 
              placeholder={`Risposta ${j+1}`} 
              value={a} 
              onChange={e => handleAnswerChange(i, j, e.target.value)} 
              className="modern-input" 
            />
            
            {/* Radio Risposta Corretta */}
            <label className="correct-pill">
              <input 
                type="radio" 
                name={`correct-${i}`}  // Gruppo per domanda i
                checked={correctIndexes[i] === j} 
                onChange={() => handleMarkCorrect(i, j)} 
              />
              <span>Corretta</span>
            </label>
          </div>
        ))}
      </div>
    ))}
  </div>
  
  {/* Submit */}
  <button className="modern-btn" type="submit" disabled={!allFilled}>
    Conferma
  </button>
</form>
```

**Radio Button Grouping**:
```javascript
name={`correct-${i}`}
```
- Nome gruppo unico per domanda
- Garantisce una sola risposta corretta per domanda
- HTML5 native behavior

**Quick Picks**:
- Pulsanti [5, 10, 15] per selezione rapida
- Classe `chip-gold` per styling distintivo
- Type button per prevenire submit

**File Input Pattern**:
- Input nascosto (CSS)
- Label styled come pulsante
- htmlFor collega label a input
- Span mostra nome file selezionato

**Payload Structure**:
```json
{
  "thematicArea": "Matematica",
  "questions": [
    {
      "question": "Quanto fa 2+2?",
      "answers": [
        { "text": "3", "isCorrect": false },
        { "text": "4", "isCorrect": true },
        { "text": "5", "isCorrect": false }
      ],
      "difficulty": "media"
    }
  ]
}
```

**localStorage Structure**:
```json
{
  "customTests": [
    {
      "id": "custom-1698765432100",
      "name": "Test Custom",
      "questions": [/* ... */]
    }
  ]
}
```

**Performance Considerations**:
- useMemo per allFilled previene validazioni eccessive
- Immutable updates con spread/map (React optimization)
- Controlled inputs per state consistency

**UX Features**:
- Placeholder dinamici (`Domanda ${i+1}`)
- Visual feedback (disabled button)
- Quick picks per velocità
- Clear labeling

**Edge Cases**:
- Min/max constraints su number input (1-20)
- Fallback chain per errori salvataggio
- Optional chaining su file selection
- Default difficulty "media"

**Note Tecniche**:
- 3 risposte hardcoded (no variabile)
- Immagine non implementata (placeholder)
- Hard redirect con window.location
- Silent catch sul fallback localStorage

## Utility e Helper Functions

### API Communication (`apiHost.js`)
- Configurazione dinamica dell'host API
- Supporto variabile ambiente `REACT_APP_API_HOST`
- Fallback automatico a localhost:3000 in sviluppo
- Stringa vuota per deployment production (stesso dominio)

### Custom Hooks (`hooks.js`)

1. **`useFetch(url, options)`**
   - Hook per fetch con gestione automatica di loading, data ed error
   - AbortController integrato per cleanup
   - Credentials: 'include' di default (cookie-based auth)

2. **`useCurrentUser()`**
   - Hook per ottenere i dati dell'utente corrente
   - Wrapper di useFetch su `/auth/me`
   - Ritorna: user, authenticated, loading

3. **`useAdaptiveFontSize(selector, deps)`**
   - Hook per ridimensionamento automatico font
   - Previene overflow del testo in container fissi
   - Riduce il font fino a MIN_PX (12px) per adattamento
   - Gestione resize window
   - Utilizzato per titoli delle aree nella dashboard

### Image Utilities (`imageUtils.js`)

1. **`makeConceptImageUrl(name, idx)`**
   - Genera URL Unsplash per immagini tematiche
   - Rotazione tra 15 topic (abstract, geometry, minimal, landscape, etc.)
   - Deterministica basata su nome e indice

2. **`makeGradientDataUrl(idx)`**
   - Genera gradienti SVG come Data URL
   - 7 palette predefinite (blue, slate, yellow, purple, teal, red, green)
   - Utilizzato come fallback per immagini

## Gestione dello Stato

### State Management
L'applicazione utilizza principalmente:
- **React useState**: Per stato locale dei componenti
- **React useEffect**: Per side effects e fetch dati
- **URL Parameters**: Per stato condiviso tra route (area, num domande)
- **sessionStorage**: Per test custom temporanei
- **localStorage**: Per fallback salvataggio test offline

### Flusso Dati
1. **API-First**: Dati primari caricati da backend via fetch
2. **Loading States**: Ogni pagina gestisce stati di caricamento
3. **Error Handling**: Try-catch con fallback e messaggi utente
4. **Credentials**: Tutte le chiamate API includono `credentials: 'include'` per cookie

## Sistema di Styling

### Approccio CSS
- **CSS Modules impliciti**: Un file CSS per ogni pagina/componente principale
- **Naming Convention**: Classi BEM-like (es. `dashboard-topbar`, `modern-btn`, `stats-box`)
- **Responsive Design**: Layout flessibili con flexbox e grid
- **Utility Classes**: Classi riutilizzabili (modern-input, modern-btn, chip, etc.)

### Temi Visivi
- Palette moderna con toni di blu, slate e accenti gialli/oro
- Gradienti per elementi interattivi
- Ombre sottili per profondità
- Animazioni e transizioni fluide

## Performance e Ottimizzazioni

1. **Memo Components**: AreaChart wrappato in React.memo
2. **AbortController**: Cancellazione fetch su unmount componenti
3. **useMemo**: Calcoli pesanti memoizzati (es. statistiche, shuffle)
4. **Lazy Loading Immagini**: Fallback a gradienti leggeri
5. **Code Splitting**: Routing-based splitting automatico con React Router

## Gestione Errori

### Strategie
1. **Network Errors**: Try-catch con messaggi utente-friendly
2. **API Errors**: Parsing response.json() con fallback
3. **Image Loading**: onError handler con fallback images
4. **Form Validation**: Validazione client-side prima submit
5. **Protected Routes**: Redirect automatico se non autenticati

### User Feedback
- Messaggi di errore contestuali nei form
- Stati di loading con testi descrittivi
- Messaggi "Nessun dato" quando appropriato
- Disabilitazione pulsanti durante operazioni asincrone

## Build e Deployment

### Scripts Disponibili
```json
{
  "start": "react-scripts start",      // Dev server su localhost:3000
  "build": "react-scripts build",      // Build production
  "test": "react-scripts test",        // Test runner
  "eject": "react-scripts eject"       // Eject da CRA (irreversibile)
}
```

### Configurazione Build
- **Output**: Cartella `build/` con static assets ottimizzati
- **Bundling**: Webpack via react-scripts
- **Optimization**: Minification, tree-shaking, code splitting
- **Browser Support**: Modern browsers (vedi browserslist in package.json)

## Flusso Utente Completo

1. **Accesso**: Utente arriva su landing page, effettua login/registrazione
2. **Dashboard**: Visualizza aree tematiche disponibili
3. **Configurazione Test**: Seleziona area, sceglie numero domande
4. **Esecuzione Test**: Risponde alle domande con timer
5. **Risultati**: Visualizza punteggio, errori e statistiche
6. **Analytics**: Consulta statistiche storiche e andamento performance
7. **Creazione Custom**: Crea nuovi test personalizzati

## Integrazione con Backend

### Endpoints Utilizzati

**Auth**
- `POST /auth/login`: Login utente
- `POST /auth/register`: Registrazione nuovo utente
- `GET /auth/me`: Verifica sessione corrente
- `POST /auth/logout`: Logout

**Flashcards**
- `GET /flash/areas/list`: Lista aree tematiche
- `GET /flash/thematic/:area`: Flashcard per area specifica
- `POST /flash`: Creazione nuovo test/flashcards

**Test Results**
- `POST /testresult`: Salvataggio risultato test
- `GET /testresult/areas/list?userId=:id`: Aree con test completati
- `GET /testresult/:userId/:area`: Statistiche per area
- `GET /testresult/wrong/:userId/:area?limit=50`: Risposte sbagliate

### Autenticazione
- **Metodo**: Cookie-based (HttpOnly cookies)
- **Credentials**: Sempre incluse con `credentials: 'include'`
- **Session Management**: Gestita interamente dal backend

## Accessibilità e UX

### Limitazioni Attuali
- Immagini Unsplash potrebbero fallire (fallback implementato)
- 3 risposte fisse per domanda (no customizzazione)
- Nessuna persistenza offline completa
- Grafici base (possibilità di espansione)

### Possibili Miglioramenti Futuri
- Progressive Web App (PWA) con service workers
- Sistema di login basato su Blockchain (Web3 Auth / wallet-based authentication)
- Offline-first con IndexedDB
- Dark mode
- Internazionalizzazione (i18n)
- Animazioni più sofisticate
- Esportazione dati statistiche (PDF, CSV)
- Filtri avanzati nelle statistiche
- Gamification (badge, achievement)
- Modalità studio collaborative

---
