# Diagramma UML dei Casi d'Uso - SmartDeck

## Attori

### Visitatore (Guest)
Utente non autenticato che accede all'applicazione per la prima volta o senza credenziali.

### Utente Autenticato
Utente registrato che ha effettuato l'accesso al sistema e può utilizzare tutte le funzionalità dell'applicazione.

**Relazione**: Utente Autenticato **generalizza** Visitatore (eredita le sue capacità dopo il login).

---

## Casi d'Uso

### UC1: Registrarsi
- **Attore Primario**: Visitatore
- **Precondizioni**: L'utente non ha un account
- **Postcondizioni**: L'utente è registrato e autenticato nel sistema
- **Flusso Principale**:
  1. L'utente inserisce username e password
  2. Il sistema valida l'unicità dello username
  3. Il sistema crea l'account con password hashata
  4. Il sistema autentica automaticamente l'utente
  5. Il sistema reindirizza alla dashboard
- **Flussi Alternativi**:
  - **1a**: Username già esistente → Errore "Username già in uso"
  - **1b**: Campi mancanti → Errore di validazione

---

### UC2: Effettuare Login
- **Attore Primario**: Visitatore
- **Precondizioni**: L'utente ha un account registrato
- **Postcondizioni**: L'utente è autenticato con sessione attiva
- **Flusso Principale**:
  1. L'utente inserisce username e password
  2. Il sistema verifica le credenziali
  3. Il sistema genera token JWT e cookie di sessione
  4. Il sistema reindirizza alla dashboard
- **Flussi Alternativi**:
  - **2a**: Credenziali errate → Errore "Credenziali non valide"

---

### UC3: Visualizzare Dashboard
- **Attore Primario**: Utente Autenticato
- **Precondizioni**: L'utente è autenticato
- **Postcondizioni**: Visualizzazione aree tematiche disponibili
- **Flusso Principale**:
  1. Il sistema carica le aree tematiche con flashcard disponibili
  2. Il sistema mostra card interattive per ogni area
  3. L'utente può selezionare un'area per iniziare un test

---

### UC4: Creare Test Personalizzato
- **Attore Primario**: Utente Autenticato
- **Precondizioni**: L'utente è autenticato
- **Postcondizioni**: Nuovo test salvato nel sistema
- **Flusso Principale**:
  1. L'utente inserisce il nome del test (area tematica)
  2. L'utente sceglie il numero di domande (1-20)
  3. Per ogni domanda, l'utente:
     - Inserisce il testo della domanda
     - Inserisce 3 risposte possibili
     - Marca la risposta corretta
  4. Il sistema valida il test
  5. Il sistema salva il test
- **Flussi Alternativi**:
  - **5a**: Errore API → Salvataggio in localStorage come fallback

---

### UC5: Eseguire Test
- **Attore Primario**: Utente Autenticato
- **Precondizioni**: Esistono flashcard per l'area selezionata
- **Postcondizioni**: Risultati del test salvati nel sistema
- **Flusso Principale**:
  1. L'utente seleziona un'area tematica
  2. L'utente sceglie il numero di domande
  3. Il sistema carica e randomizza le flashcard
  4. Per ogni domanda:
     - Il sistema avvia il timer
     - L'utente seleziona una risposta
     - Il sistema registra risposta e tempo
  5. Il sistema calcola il punteggio finale
  6. Il sistema salva i risultati
  7. Il sistema mostra statistiche e domande errate
- **Relazioni**: 
  - **Include**: Configurare Test, Rispondere a Domande, Visualizzare Risultati

---

### UC6: Consultare Statistiche
- **Attore Primario**: Utente Autenticato
- **Precondizioni**: L'utente ha completato almeno un test
- **Postcondizioni**: Visualizzazione analisi performance
- **Flusso Principale**:
  1. L'utente seleziona un'area dalla lista statistiche
  2. Il sistema carica:
     - Metriche aggregate (tentativi, punteggio medio, miglior punteggio)
     - Grafico andamento punteggi nel tempo
     - Lista ultime risposte sbagliate (max 50)
  3. L'utente visualizza e analizza i dati

---

### UC7: Effettuare Logout
- **Attore Primario**: Utente Autenticato
- **Precondizioni**: L'utente è autenticato
- **Postcondizioni**: L'utente è disconnesso
- **Flusso Principale**:
  1. L'utente clicca sul pulsante "Esci"
  2. Il sistema invalida la sessione (cookie)
  3. Il sistema rimuove i dati di autenticazione locali
  4. Il sistema reindirizza alla pagina di login

---

## Relazioni tra Casi d'Uso

### Generalizzazione
- **Utente Autenticato** generalizza **Visitatore**: dopo login/registrazione, il Visitatore acquisisce tutti i privilegi dell'Utente Autenticato

### Include
- **UC5 (Eseguire Test)** include:
  - Configurare parametri test (area, numero domande)
  - Rispondere alle domande
  - Visualizzare risultati

## Vincoli e Regole di Business

1. **Autenticazione**: Tutti i casi d'uso tranne UC1 e UC2 richiedono autenticazione
2. **Sessione JWT**: Durata 2 ore, rinnovabile
3. **Domande per test**: Minimo 1, massimo 20 (limitato dalle flashcard disponibili)
4. **Risposte per domanda**: Esattamente 3 opzioni, di cui 1 corretta
5. **Data Isolation**: Ogni utente vede solo i propri test e statistiche personalizzate

---

## Note Tecniche di Implementazione

### Sicurezza
- **Autenticazione**: JWT (JSON Web Token) con scadenza 2 ore
- **Storage**: Cookie HttpOnly per prevenire attacchi XSS
- **Password**: Hashing con bcrypt (salt factor 10)

### Persistenza Dati
- **Database primario**: MongoDB con Mongoose ODM
- **Fallback**: localStorage per test personalizzati in caso di errore API
- **Indici**: Ottimizzazione query su userId, area, createdAt

### Performance
- **Query parallele**: Caricamento simultaneo statistiche ed errori
- **Caching**: Memoization componenti React (useMemo, React.memo)
- **Indici DB**: Compound indexes per query frequenti su userId + area
