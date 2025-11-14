const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');
const logger = require('../utils/logger');

// Setup Redis per rate limiting distribuito (opzionale, fallback a memory)
let redisClient = null;
let store = undefined;

if (process.env.REDIS_URL) {
  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      enableOfflineQueue: false,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          logger.warn('Redis connection failed, usando memory store per rate limiting');
          return null;
        }
        return Math.min(times * 100, 3000);
      },
    });

    store = new RedisStore({
      client: redisClient,
      prefix: 'rl:',
    });

    logger.info('✓ Redis rate limiting attivo');
  } catch (err) {
    logger.warn('⚠️ Redis non disponibile, usando memory store:', err.message);
  }
}

// Rate limiters per diversi endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 5, // 5 richieste per IP
  message: { error: 'Troppi tentativi di login. Riprova tra 15 minuti.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  store, // Redis se disponibile, altrimenti memory
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', { 
      type: 'auth', 
      ip: req.ip,
      endpoint: req.originalUrl 
    });
    res.status(429).json({ 
      error: 'Troppi tentativi di login. Riprova tra 15 minuti.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 ora
  max: 3, // 3 registrazioni per IP
  message: { error: 'Troppi tentativi di registrazione. Riprova tra 1 ora.' },
  standardHeaders: true,
  legacyHeaders: false,
  store,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', { 
      type: 'register', 
      ip: req.ip 
    });
    res.status(429).json({ 
      error: 'Troppi tentativi di registrazione. Riprova tra 1 ora.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 200, // Aumentato a 200 per traffico massivo
  message: { error: 'Troppi richieste. Riprova più tardi.' },
  standardHeaders: true,
  legacyHeaders: false,
  store,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', { 
      type: 'api', 
      ip: req.ip,
      endpoint: req.originalUrl 
    });
    res.status(429).json({ 
      error: 'Troppi richieste. Riprova più tardi.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 ora
  max: 20, // 20 richieste AI per IP (costoso)
  message: { error: 'Limite richieste AI raggiunto. Riprova tra 1 ora.' },
  standardHeaders: true,
  legacyHeaders: false,
  store,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', { 
      type: 'ai', 
      ip: req.ip,
      userId: req.user?.id 
    });
    res.status(429).json({ 
      error: 'Limite richieste AI raggiunto. Riprova tra 1 ora.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Cleanup Redis on shutdown
process.on('SIGTERM', () => {
  if (redisClient) {
    redisClient.quit();
  }
});

module.exports = {
  authLimiter,
  registerLimiter,
  apiLimiter,
  aiLimiter,
  redisClient
};
