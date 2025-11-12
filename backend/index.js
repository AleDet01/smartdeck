require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = process.env.ALLOW_ORIGINS 
  ? process.env.ALLOW_ORIGINS.split(',').map(s => s.trim())
  : ['http://localhost:3001', 'http://localhost:3000'];

if (process.env.NODE_ENV === 'production') {
  allowedOrigins.push('https://smartdeck-frontend.onrender.com');
}

console.log('✓ CORS allowedOrigins:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    console.warn(`⚠ CORS blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Cookie', 
    'X-Client-Fingerprint', 
    'Cache-Control',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Set-Cookie']
}));

app.use(express.json());
app.set('trust proxy', 1);

app.get('/', (req, res) => {
  res.json({ message: 'SmartDeck API', status: 'active' });
});

app.get('/health', (req, res) => {
  const mongoState = mongoose.connection.readyState;
  res.json({ 
    status: mongoState === 1 ? 'ok' : 'degraded', 
    database: mongoState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime() 
  });
});

app.use('/auth', require('./routes/auth'));
app.use('/flash', require('./routes/flash'));
app.use('/statistics', require('./routes/statistics'));
app.use('/ai-assistant', require('./routes/aiAssistant'));

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
