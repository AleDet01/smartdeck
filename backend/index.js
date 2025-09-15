
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS PRIMA DI TUTTO (origini configurabili via env var ALLOW_ORIGINS, comma-separated)
// Default: remove localhost:5173, keep localhost:3001 and add production domain
const allowedOrigins = (process.env.ALLOW_ORIGINS || 'https://smartdeck.onrender.com,http://localhost:3001').split(',').map(s => s.trim()).filter(Boolean);


function originAllowed(origin) {
  if (!origin) return true; // allow non-browser requests (curl, Postman)
  for (const pattern of allowedOrigins) {
    if (!pattern) continue;
    if (pattern === '*') return true;
    if (pattern.startsWith('*.')) {
      const suffix = pattern.slice(1); // .onrender.com
      if (origin.endsWith(suffix)) return true;
    }
    if (pattern.startsWith('.')) {
      if (origin.endsWith(pattern)) return true;
    }
    if (origin === pattern) return true; // exact match
  }
  return false;
}

// Custom CORS middleware: set CORS headers for allowed origins and handle preflight
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (originAllowed(origin)) {
    // reflect the requested origin (required when credentials=true)
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    return next();
  }

  // Not allowed origin: log for debugging and let request continue (no CORS headers)
  console.warn('CORS blocked origin:', origin, 'allowed list:', allowedOrigins);
  if (req.method === 'OPTIONS') {
    // preflight from disallowed origin - respond without CORS headers
    return res.sendStatus(204);
  }
  return next();
});

// Body parser
app.use(express.json());

// Rotte autenticazione
app.use('/auth', authRoutes);

// Connessione a MongoDB e avvio server dopo connessione
const mongoose = require('mongoose');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const startServer = async () => {
  const maxAttempts = parseInt(process.env.DB_CONNECT_ATTEMPTS || '6', 10); // total attempts
  let attempt = 0;
  let lastErr = null;

  while (attempt < maxAttempts) {
    try {
      attempt++;
      console.log(`Attempting to connect to MongoDB (attempt ${attempt}/${maxAttempts})`);
      await connectDB();
      console.log('MongoDB connection established');
      lastErr = null;
      break;
    } catch (err) {
      lastErr = err;
      const backoff = Math.min(30000, 1000 * Math.pow(2, attempt - 1));
      console.error(`MongoDB connection attempt ${attempt} failed:`, err && err.message ? err.message : err);
      if (attempt >= maxAttempts) break;
      console.log(`Waiting ${backoff}ms before next attempt...`);
      // wait before retry
      // eslint-disable-next-line no-await-in-loop
      await sleep(backoff);
    }
  }

  if (lastErr) {
    console.error('Failed to start server due to DB error after retries:', lastErr && lastErr.message ? lastErr.message : lastErr);
    process.exit(1);
  }

  // Mount routes and start server only after successful DB connection
  // Rotta di test
  app.get('/', (req, res) => {
    res.send('Backend attivo e connesso a MongoDB!');
  });

  // Health endpoint per Render (include stato connessione DB)
  app.get('/health', (req, res) => {
    const mongoState = mongoose.connection.readyState; // 0 = disconnected, 1 = connected
    res.json({ status: mongoState === 1 ? 'ok' : 'degraded', mongoState, uptime: process.uptime() });
  });

  // Rotte flashcard
  const flashRoutes = require('./routes/flash');
  app.use('/flash', flashRoutes);

  // Rotte test result (statistiche test)
  const testResultRoutes = require('./routes/testResult');
  app.use('/testresult', testResultRoutes);

  app.listen(PORT, () => {
    console.log(`Server avviato sulla porta ${PORT}`);
  });
};

startServer();
