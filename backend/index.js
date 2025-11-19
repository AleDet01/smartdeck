require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const compression = require('compression');
const hpp = require('hpp');
const morgan = require('morgan');
const connectDB = require('./db');
const { 
  helmetConfig, 
  hppConfig, 
  accountLockout, 
  suspiciousActivityDetection, 
  forceHTTPS, 
  secureCookies 
} = require('./middleware/security');
const { apiLimiter } = require('./middleware/rateLimiter');
const { initSentry, sentryErrorHandler } = require('./middleware/sentry');
const { initCache } = require('./middleware/cache');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Sentry (deve essere PRIMA di tutto)
initSentry(app);

// Initialize Cache (Redis o Memory)
initCache();

// Trust proxy for rate limiting behind reverse proxy (Render)
app.set('trust proxy', 1);

// ULTRA LOGGING - Log EVERY request before anything else
app.use((req, res, next) => {
  console.log('');
  console.log('='.repeat(80));
  console.log(`🌐 [INCOMING REQUEST] ${new Date().toISOString()}`);
  console.log(`   Method: ${req.method}`);
  console.log(`   Path: ${req.path}`);
  console.log(`   URL: ${req.url}`);
  console.log(`   IP: ${req.ip}`);
  console.log(`   Origin: ${req.headers.origin || 'No origin'}`);
  console.log(`   Content-Type: ${req.headers['content-type'] || 'No content-type'}`);
  console.log(`   User-Agent: ${req.headers['user-agent']?.substring(0, 50) || 'No user-agent'}`);
  console.log('='.repeat(80));
  console.log('');
  next();
});

// Logging middleware con Winston
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: logger.stream,
    skip: (req, res) => res.statusCode < 400
  }));
}

// Configure allowed origins with custom domain support
const allowedOrigins = process.env.ALLOW_ORIGINS 
  ? process.env.ALLOW_ORIGINS.split(',').map(s => s.trim())
  : [
      // Development
      'http://localhost:3001', 
      'http://localhost:3000',
      // Production (Render default)
      'https://smartdeck-frontend.onrender.com',
      // Custom domain (configure in Render environment variables)
      ...(process.env.CUSTOM_DOMAIN ? [
        `https://${process.env.CUSTOM_DOMAIN}`,
        `https://www.${process.env.CUSTOM_DOMAIN}`
      ] : [])
    ];

console.log('✓ CORS allowedOrigins:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    console.log(`🔍 [CORS] Checking origin: ${origin || 'No origin'}`);
    console.log(`🔍 [CORS] Allowed origins: ${allowedOrigins.join(', ')}`);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log(`✓ [CORS] Allowing request with no origin`);
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      console.log(`✓ [CORS] Origin ALLOWED: ${origin}`);
      return callback(null, true);
    }
    
    console.warn(`❌ [CORS] Origin BLOCKED: ${origin}`);
    console.warn(`   Expected one of: ${allowedOrigins.join(', ')}`);
    // Return false instead of error to properly handle CORS rejection
    callback(null, false);
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
  exposedHeaders: ['Set-Cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Security middleware (DOPO CORS per evitare conflitti)
app.use(forceHTTPS); // Forza HTTPS in produzione
app.use(helmetConfig); // Security headers
app.use(secureCookies); // Cookies sicuri con httpOnly e secure
app.use(suspiciousActivityDetection); // Rileva pattern di attacco

// Compression middleware per gzip
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6 // Bilanciamento tra velocità e compressione
}));

// Body parser con limite dimensione
app.use((req, res, next) => {
  console.log(`🔍 [REQUEST] ${req.method} ${req.path} from ${req.ip}`);
  console.log(`🔍 [REQUEST] Content-Type: ${req.headers['content-type']}`);
  console.log(`🔍 [REQUEST] Origin: ${req.headers.origin}`);
  next();
});

app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      console.error(`❌ [BODY_PARSER] Invalid JSON from ${req.ip}: ${e.message}`);
      throw new Error('Invalid JSON');
    }
  }
}));

app.use((req, res, next) => {
  console.log(`✓ [BODY_PARSER] JSON parsed successfully`);
  console.log(`🔍 [BODY_PARSER] Body:`, JSON.stringify(req.body));
  next();
});

app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB NoSQL Injection Protection - MANUAL (express-mongo-sanitize not compatible with Express 5)
app.use((req, res, next) => {
  // Sanitize req.body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  // Note: req.query and req.params are read-only in Express 5, sanitized by express-validator
  next();
});

// HTTP Parameter Pollution Protection
app.use(hppConfig);

// Helper function for MongoDB sanitization
function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    // Remove keys starting with $ or containing .
    if (key.startsWith('$') || key.includes('.')) {
      console.warn(`⚠️ [SANITIZE] Blocked MongoDB injection attempt: ${key}`);
      continue;
    }
    sanitized[key] = sanitizeObject(value);
  }
  return sanitized;
}

// Log OPTIONS requests (handled automatically by CORS middleware)
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    console.log(`🔍 [OPTIONS] Preflight request for ${req.path}`);
    console.log(`   Origin: ${req.headers.origin}`);
    console.log(`   Access-Control-Request-Method: ${req.headers['access-control-request-method']}`);
    console.log(`   Access-Control-Request-Headers: ${req.headers['access-control-request-headers']}`);
  }
  next();
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'SmartDeck API', 
    status: 'active',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint to check database and collections
app.get('/debug/db', async (req, res) => {
  try {
    const mongoState = mongoose.connection.readyState;
    if (mongoState !== 1) {
      return res.json({ error: 'MongoDB not connected', readyState: mongoState });
    }
    
    const dbName = mongoose.connection.name;
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    const stats = {};
    for (const coll of collections) {
      const count = await mongoose.connection.db.collection(coll.name).countDocuments();
      stats[coll.name] = count;
    }
    
    // Get users count
    const User = require('./models/user');
    const users = await User.find().select('username createdAt').lean().limit(10);
    
    // Get flashcards count by user
    const Flashcard = require('./models/singleFlash');
    const flashcardsByUser = await Flashcard.aggregate([
      { $group: { _id: '$createdBy', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    res.json({
      database: dbName,
      host: mongoose.connection.host,
      collections: stats,
      sampleUsers: users,
      flashcardsByUser
    });
  } catch (err) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// Health check endpoint (SEMPRE 200 per evitare timeout su Render)
app.get('/health', async (req, res) => {
  const mongoState = mongoose.connection.readyState;
  const mongoStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  const memUsage = process.memoryUsage();
  
  const health = {
    status: mongoState === 1 ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    version: require('./package.json').version || '1.0.0',
    database: {
      state: mongoStateMap[mongoState] || 'unknown',
      connected: mongoState === 1,
      ...(mongoState === 1 && {
        name: mongoose.connection.name,
        host: mongoose.connection.host
      })
    },
    memory: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
      rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
      external: Math.round(memUsage.external / 1024 / 1024) + ' MB'
    },
    cpu: {
      user: Math.round(process.cpuUsage().user / 1000),
      system: Math.round(process.cpuUsage().system / 1000)
    }
  };
  
  // Aggiungi metriche DB se connesso
  if (mongoState === 1) {
    try {
      const collections = await mongoose.connection.db.listCollections().toArray();
      health.database.collections = collections.length;
    } catch (err) {
      logger.warn('Health check: impossibile leggere collections', { error: err.message });
    }
  }
  
  // SEMPRE 200 OK anche se DB non connesso - Render needs this!
  res.status(200).json(health);
});

// Apply general API rate limiting
app.use('/api', apiLimiter);

// Routes with logging
console.log('✓ Mounting routes...');

app.use('/auth', (req, res, next) => {
  console.log(`🔍 [ROUTE] Entering /auth route: ${req.method} ${req.path}`);
  next();
}, accountLockout, require('./routes/auth'));

app.use('/flash', require('./routes/flash'));
app.use('/statistics', require('./routes/statistics'));
app.use('/ai-assistant', require('./routes/aiAssistant'));

console.log('✓ Routes mounted successfully');

// Sentry error handler (PRIMA del nostro error handler)
app.use(sentryErrorHandler());

// 404 handler
app.use((req, res) => {
  logger.warn('404 Not Found', {
    path: req.path,
    method: req.method,
    ip: req.ip
  });
  res.status(404).json({ 
    error: 'Endpoint non trovato',
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌❌❌ [GLOBAL_ERROR_HANDLER] ❌❌❌');
  console.error('Error:', err);
  console.error('Error stack:', err.stack);
  console.error('Error name:', err.name);
  console.error('Error message:', err.message);
  console.error('Error code:', err.code);
  console.error('Request:', req.method, req.path);
  console.error('Request body:', JSON.stringify(req.body));
  console.error('Request IP:', req.ip);
  console.error('❌❌❌ [END GLOBAL_ERROR_HANDLER] ❌❌❌');
  
  // Log error con Winston
  try {
    logger.logError(err, req);
  } catch (logErr) {
    console.error('Failed to log error:', logErr.message);
  }
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      error: 'Dati non validi',
      details: Object.values(err.errors).map(e => e.message)
    });
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({ 
      error: `${field} già esistente`
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Token non valido' });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token scaduto' });
  }
  
  // Invalid JSON
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON non valido' });
  }
  
  // Default error
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Errore interno del server' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  server.close(() => {
    console.log('✓ HTTP server closed');
    
    mongoose.connection.close(false, () => {
      console.log('✓ MongoDB connection closed');
      process.exit(0);
    });
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Unhandled rejection handler
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  if (process.env.NODE_ENV === 'production') {
    gracefulShutdown('UNHANDLED_REJECTION');
  }
});

// Uncaught exception handler
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Start server IMMEDIATAMENTE (non aspettare MongoDB)
let server;

// Avvia server prima di MongoDB per rispondere subito ad health checks
server = app.listen(PORT, () => {
  logger.info(`Server avviato su porta ${PORT}`, {
    environment: process.env.NODE_ENV || 'development',
    corsOrigins: allowedOrigins,
    nodeVersion: process.version,
    pid: process.pid
  });
  console.log(`✓ Server avviato su porta ${PORT}`);
  console.log(`✓ Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✓ CORS origins: ${allowedOrigins.join(', ')}`);
  console.log('⏳ Connessione MongoDB in corso...');
});

// Connetti MongoDB in background (non blocca startup)
connectDB()
  .then(() => {
    logger.info('MongoDB connesso con successo');
    console.log('✓ MongoDB connesso con successo');
  })
  .catch(err => {
    logger.error('Errore connessione MongoDB', { error: err.message });
    console.error('❌ Errore connessione MongoDB:', err.message);
    console.error('⚠️ Server attivo ma database non disponibile');
    // process.exit(1); // Temporarily disabled to allow debugging
  });
