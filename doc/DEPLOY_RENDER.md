Guida rapida: Deploy su Render

Prerequisiti
- Account Render
- Repo su GitHub/GitLab/Bitbucket collegato a Render
- Stringa MongoDB (Mongo Atlas o altro)
- (Opzionale) Valore JWT_SECRET

Passaggi

1) Preparazione codice (già applicato nel repo):
   - backend ora legge `MONGODB_URI` da env var.
   - backend espone `npm start` (start script in `backend/package.json`).
   - backend ha endpoint `/health` e CORS configurabile tramite env `ALLOW_ORIGINS`.
   - frontend build con `npm run build` produce `frontend/build`.

2) Creare il servizio Backend su Render
- New -> Web Service -> collega il repo e scegli il branch (es. main)
- Build Command: (puoi lasciare vuoto) oppure `cd backend && npm install`
- Start Command: `cd backend && npm start`
- Env Vars (Render UI) da impostare:
  - MONGODB_URI = mongodb+srv://user:pass@...  (la tua connection string)
  - JWT_SECRET = <stringa segreta>
  - ALLOW_ORIGINS = https://<orale-frontend>.onrender.com (o più origini comma-separated)
- Health Check Path: /health
- Deploy

3) Creare il sito Statico (Frontend) su Render
- New -> Static Site -> collega lo stesso repo e branch
- Build Command: `cd frontend && npm install && npm run build`
- Publish Directory: `frontend/build`
- Env Vars (Render UI):
  - REACT_APP_API_HOST = https://<orale-backend>.onrender.com
- Deploy

4) Test
- Apri il sito frontend fornito da Render e verifica che le chiamate API scritte usino `REACT_APP_API_HOST`.
- Se ricevi errori CORS, aggiungi il dominio frontend in `ALLOW_ORIGINS` nel backend.

Note di sicurezza
- Non committare credenziali nel repo.
- Usa segreti di Render per le env vars.

Aggiunte nel repo
 - `.env.example` creato alla root con le variabili richieste (MONGODB_URI, JWT_SECRET, ALLOW_ORIGINS, REACT_APP_API_HOST).
 - `.gitignore` aggiornato per ignorare `.env` e `node_modules`.

Se hai esposto la connection string in passato:
 - Rigenera la password/utente su Mongo Atlas.
 - Sostituisci la stringa nei segreti di Render.

render.yaml
- Hai già un `render.yaml` di esempio alla root; puoi modificarlo e utilizzare il deploy via pull request come documentato da Render.

Supporto
- Se vuoi, eseguo io le altre modifiche (es. aggiungere ALLOW_ORIGINS in .env.example) o preparo PR con valori placeholder.
