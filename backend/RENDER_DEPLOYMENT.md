# Render Deployment Guide - SmartDeck Backend

## 🚀 Environment Variables da configurare su Render

### Obbligatorie

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://your_connection_string
JWT_SECRET=your_64_char_secret_here
OPENAI_API_KEY=sk-your_openai_key
```

### CORS Configuration (CRITICO)

```env
ALLOW_ORIGINS=https://smartdeck-frontend.onrender.com
```

**⚠️ IMPORTANTE**: Se non impostato, il backend usa automaticamente:
- `http://localhost:3001`
- `http://localhost:3000`
- `https://smartdeck-frontend.onrender.com` (sempre incluso in production)

### Opzionali

```env
# Rate limiting personalizzato
AUTH_RATE_LIMIT=5
API_RATE_LIMIT=100

# Logging
LOG_LEVEL=info
```

## 📋 Checklist Deployment

### 1. Configurazione Render Backend

- [ ] Vai su [Render Dashboard](https://dashboard.render.com)
- [ ] Seleziona il servizio `smartdeck` (backend)
- [ ] Vai su **Environment**
- [ ] Verifica/Aggiungi le variabili d'ambiente:
  - ✅ `NODE_ENV=production`
  - ✅ `MONGODB_URI` (dal tuo MongoDB Atlas)
  - ✅ `JWT_SECRET` (generato con crypto)
  - ✅ `OPENAI_API_KEY` (dalla console OpenAI)
  - ✅ `ALLOW_ORIGINS=https://smartdeck-frontend.onrender.com`
- [ ] **Save Changes**
- [ ] Il servizio si riavvierà automaticamente

### 2. Verifica CORS

Dopo il deployment, testa i CORS:

```bash
# Test preflight OPTIONS
curl -X OPTIONS https://smartdeck.onrender.com/auth/login \
  -H "Origin: https://smartdeck-frontend.onrender.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

Dovresti vedere negli headers della risposta:
```
< Access-Control-Allow-Origin: https://smartdeck-frontend.onrender.com
< Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
< Access-Control-Allow-Credentials: true
```

### 3. Verifica Health Check

```bash
curl https://smartdeck.onrender.com/health
```

Risposta attesa:
```json
{
  "status": "ok",
  "timestamp": "2025-11-13T...",
  "uptime": 123.45,
  "database": {
    "state": "connected",
    "connected": true
  },
  "memory": {
    "used": "45 MB",
    "total": "128 MB"
  }
}
```

### 4. Verifica Logs

Su Render Dashboard:
- [ ] Vai su **Logs**
- [ ] Cerca il messaggio: `✓ CORS allowedOrigins: [ ... ]`
- [ ] Verifica che `https://smartdeck-frontend.onrender.com` sia nella lista
- [ ] Cerca eventuali warning CORS: `⚠️ CORS blocked origin:`

### 5. Test dal Frontend

Dal browser su `https://smartdeck-frontend.onrender.com`:
- [ ] Apri DevTools (F12) → Network
- [ ] Fai login/register
- [ ] Verifica che le request a `smartdeck.onrender.com` abbiano:
  - Status 200/201 (non 403/404)
  - Response headers con `Access-Control-Allow-Origin`
  - NO errori CORS nella console

## 🔧 Troubleshooting

### Problema: "No 'Access-Control-Allow-Origin' header"

**Soluzione 1**: Verifica Environment Variables
```bash
# Su Render Dashboard → Environment
ALLOW_ORIGINS=https://smartdeck-frontend.onrender.com
```

**Soluzione 2**: Verifica logs backend
```bash
# Nei logs cerca:
✓ CORS allowedOrigins: [ 'https://smartdeck-frontend.onrender.com' ]
```

**Soluzione 3**: Force redeploy
- Render Dashboard → Manual Deploy → Deploy latest commit

### Problema: "Response to preflight request doesn't pass"

Il backend ora gestisce esplicitamente le OPTIONS:
```javascript
app.options('*', cors());
```

Verifica che il deployment sia andato a buon fine.

### Problema: CORS funziona in dev ma non in production

Controlla:
1. `NODE_ENV=production` su Render
2. `ALLOW_ORIGINS` include l'URL frontend completo (con https://)
3. Nessun trailing slash nell'URL: ❌ `https://...com/` ✅ `https://...com`

### Problema: 502 Bad Gateway

Il backend non si è avviato:
- Controlla logs per errori MongoDB
- Verifica che `MONGODB_URI` sia valido
- Controlla che tutte le dependencies siano installate

## 🎯 Quick Fix Commands

### Rigenera JWT_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copia l'output e aggiornalo su Render Environment.

### Testa CORS localmente

```bash
# Avvia backend locale
cd backend
npm run dev

# In un altro terminale
curl -X POST http://localhost:3000/auth/login \
  -H "Origin: https://smartdeck-frontend.onrender.com" \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' \
  -v
```

Dovresti vedere `Access-Control-Allow-Origin` negli headers.

## 📊 Monitoring Post-Deployment

Dopo 5 minuti dal deployment:

- [ ] Check `/health` endpoint (status 200)
- [ ] Test login dal frontend
- [ ] Test AI assistant
- [ ] Check Render logs per errors
- [ ] Verifica rate limiting (prova 6+ login in 15min)

## 🔐 Security Checklist

- [ ] `NODE_ENV=production` attivo
- [ ] JWT_SECRET diverso da development
- [ ] MONGODB_URI con autenticazione
- [ ] OPENAI_API_KEY valido
- [ ] CORS limitato al solo frontend
- [ ] Helmet headers attivi (check con F12 → Network)
- [ ] Rate limiting attivo (check logs)

## 📝 Note

- Il backend si riavvia automaticamente dopo ogni push su main
- Free tier Render: sleep dopo 15min inattività (primo request lento)
- MongoDB Atlas: whitelist IP 0.0.0.0/0 per Render
- Logs retention: 7 giorni su free tier
