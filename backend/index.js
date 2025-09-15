
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS PRIMA DI TUTTO (origini configurabili via env var ALLOW_ORIGINS, comma-separated)
const allowedOrigins = (process.env.ALLOW_ORIGINS || 'http://localhost:5173,http://localhost:3001').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
    return callback(new Error('CORS policy: Origin not allowed'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json());

// Rotte autenticazione
app.use('/auth', authRoutes);

// Connessione a MongoDB e avvio server dopo connessione
const mongoose = require('mongoose');

const startServer = async () => {
  try {
    await connectDB();

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
  } catch (err) {
    console.error('Failed to start server due to DB error:', err && err.message ? err.message : err);
    process.exit(1);
  }
};

startServer();
const flashRoutes = require('./routes/flash');
app.use('/flash', flashRoutes);

// Rotte test result (statistiche test)
const testResultRoutes = require('./routes/testResult');
app.use('/testresult', testResultRoutes);

app.listen(PORT, () => {
  console.log(`Server avviato sulla porta ${PORT}`);
});
