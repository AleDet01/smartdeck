const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const logger = require('../utils/logger');

// Helmet configuration per sicurezza headers
const helmetConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // unsafe-inline necessario per React
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.openai.com"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  
  // Cross-Origin policies - Permissive per CORS
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false, // Disabilitato per permettere CORS
  crossOriginOpenerPolicy: false,
  
  // DNS Prefetch Control
  dnsPrefetchControl: { allow: false },
  
  // Expect-CT (deprecated ma compatibile)
  expectCt: { maxAge: 86400 },
  
  // Frame options
  frameguard: { action: 'deny' },
  
  // Hide Powered-By header
  hidePoweredBy: true,
  
  // HSTS (HTTP Strict Transport Security)
  hsts: {
    maxAge: 31536000, // 1 anno
    includeSubDomains: true,
    preload: true
  },
  
  // IE No Open
  ieNoOpen: true,
  
  // No Sniff
  noSniff: true,
  
  // Origin Agent Cluster
  originAgentCluster: true,
  
  // Permitted Cross-Domain Policies
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
  
  // Referrer Policy
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  
  // X-XSS-Protection (legacy ma utile)
  xssFilter: true,
});

/**
 * MongoDB NoSQL Injection Protection
 * Rimuove caratteri $ e . dalle richieste
 */
const mongoSanitizeConfig = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    logger.warn(`MongoDB injection attempt detected`, {
      ip: req.ip,
      key: key,
      path: req.path,
    });
  },
});

/**
 * HTTP Parameter Pollution Protection
 * Previene attacchi con parametri duplicati
 */
const hppConfig = hpp({
  whitelist: ['sort', 'fields', 'page', 'limit', 'thematicArea'], // Parametri permessi multipli
});

/**
 * Middleware Account Lockout
 * Blocca account dopo troppi tentativi di login falliti
 */
const accountLockout = async (req, res, next) => {
  if (req.path !== '/api/auth/login' || req.method !== 'POST') {
    return next();
  }

  try {
    const { username } = req.body;
    if (!username) return next();

    const User = require('../models/user');
    const user = await User.findOne({ username });

    if (!user) return next(); // User non esiste, procedi (fallirà dopo)

    // Controlla se account è bloccato
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      logger.warn(`Login attempt on locked account`, {
        username,
        ip: req.ip,
        minutesLeft,
      });
      return res.status(423).json({
        error: 'Account temporaneamente bloccato',
        message: `Troppi tentativi falliti. Riprova tra ${minutesLeft} minuti.`,
        lockUntil: user.lockUntil,
      });
    }

    next();
  } catch (error) {
    logger.error('Error in accountLockout middleware:', error);
    next(); // In caso di errore, lascia passare (fail-open)
  }
};

/**
 * Middleware per incrementare failed login attempts
 * Da chiamare DOPO la verifica password fallita
 */
const incrementFailedAttempts = async (username) => {
  const User = require('../models/user');
  const MAX_ATTEMPTS = 10;
  const LOCK_TIME = 30 * 60 * 1000; // 30 minuti

  try {
    const user = await User.findOne({ username });
    if (!user) return;

    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

    if (user.failedLoginAttempts >= MAX_ATTEMPTS) {
      user.lockUntil = Date.now() + LOCK_TIME;
      logger.warn(`Account locked due to failed attempts`, {
        username,
        attempts: user.failedLoginAttempts,
      });
    }

    await user.save();
  } catch (error) {
    logger.error('Error incrementing failed attempts:', error);
  }
};

/**
 * Middleware per resettare failed attempts dopo login riuscito
 */
const resetFailedAttempts = async (username) => {
  const User = require('../models/user');
  
  try {
    await User.findOneAndUpdate(
      { username },
      { 
        $set: { 
          failedLoginAttempts: 0, 
          lockUntil: null,
          lastLogin: new Date(),
        } 
      }
    );
  } catch (error) {
    logger.error('Error resetting failed attempts:', error);
  }
};

/**
 * Middleware per rilevare attività sospette
 * Traccia IP, user agents strani, richieste fuori orario
 */
const suspiciousActivityDetection = (req, res, next) => {
  const suspiciousPatterns = [
    /\.\.\//,  // Path traversal
    /<script/i, // XSS attempt
    /union.*select/i, // SQL injection
    /javascript:/i, // JS injection
  ];

  const checkString = `${req.url} ${JSON.stringify(req.body)} ${JSON.stringify(req.query)}`;
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(checkString)) {
      logger.error(`Suspicious activity detected`, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        path: req.path,
        method: req.method,
        pattern: pattern.toString(),
      });
      
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Richiesta non valida',
      });
    }
  }

  next();
};

/**
 * Middleware per forzare HTTPS in produzione
 */
const forceHTTPS = (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure && req.get('x-forwarded-proto') !== 'https') {
    return res.redirect(301, `https://${req.get('host')}${req.url}`);
  }
  next();
};

/**
 * Middleware per cookies sicuri
 */
const secureCookies = (req, res, next) => {
  const originalCookie = res.cookie.bind(res);
  
  res.cookie = (name, value, options = {}) => {
    const secureOptions = {
      ...options,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: options.maxAge || 24 * 60 * 60 * 1000, // 24h default
    };
    
    return originalCookie(name, value, secureOptions);
  };
  
  next();
};

module.exports = {
  helmetConfig,
  mongoSanitizeConfig,
  hppConfig,
  accountLockout,
  incrementFailedAttempts,
  resetFailedAttempts,
  suspiciousActivityDetection,
  forceHTTPS,
  secureCookies,
};
