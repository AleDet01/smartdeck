# SECURITY RECOMMENDATIONS - Backend Implementation

## 🔒 HEADERS DI SICUREZZA DA IMPLEMENTARE (Backend Node.js/Express)

```javascript
// backend/index.js - Aggiungi questi middleware

const helmet = require('helmet'); // npm install helmet
const rateLimit = require('express-rate-limit'); // npm install express-rate-limit

// 1. Helmet per security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Solo se necessario per React
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:", "https://source.unsplash.com"],
      connectSrc: ["'self'", "https://api.openai.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
  frameguard: { action: 'deny' }
}));

// 2. Rate Limiting - Login/Register
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 5, // max 5 richieste
  message: 'Troppi tentativi di login. Riprova tra 15 minuti.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Troppi tentativi. Riprova tra 15 minuti.',
      retryAfter: 15 * 60
    });
  }
});

app.use('/auth/login', authLimiter);
app.use('/auth/register', authLimiter);

// 3. Rate Limiting - API Generale
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 60, // max 60 richieste/minuto
  message: 'Troppe richieste. Rallenta.',
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', apiLimiter);

// 4. CORS Configuration Sicuro
const cors = require('cors');
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'X-Client-Fingerprint', 'X-Requested-With']
}));

// 5. Cookie Sicuri per Sessioni
app.use(session({
  secret: process.env.SESSION_SECRET, // Strong random string
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,  // Previene XSS
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    sameSite: 'strict', // CSRF protection
    maxAge: 30 * 60 * 1000 // 30 minuti
  },
  name: 'sessionId', // Custom name (non default "connect.sid")
  rolling: true // Reset timer ad ogni richiesta
}));

// 6. Input Sanitization
const { body, validationResult } = require('express-validator');

app.post('/auth/register', [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .escape(),
  body('password')
    .isLength({ min: 8, max: 128 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // ... registration logic
});

// 7. Bcrypt per Password (già implementato, verificare parametri)
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12; // Incrementa da 10 a 12 per maggior sicurezza

const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

// 8. Monitoraggio Suspicious Activity
const loginAttempts = new Map(); // In production, usa Redis

function checkSuspiciousActivity(username, ip) {
  const key = `${username}:${ip}`;
  const attempts = loginAttempts.get(key) || [];
  
  // Rimuovi attempts più vecchi di 1 ora
  const recentAttempts = attempts.filter(
    t => Date.now() - t < 60 * 60 * 1000
  );
  
  if (recentAttempts.length >= 10) {
    // Block for 1 hour
    return { blocked: true, message: 'Account temporaneamente bloccato' };
  }
  
  recentAttempts.push(Date.now());
  loginAttempts.set(key, recentAttempts);
  
  return { blocked: false };
}

// 9. Fingerprint Validation (opzionale ma raccomandato)
app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const fingerprint = req.headers['x-client-fingerprint'];
  
  // ... authentication logic ...
  
  // Store fingerprint in session
  req.session.fingerprint = fingerprint;
  
  // On subsequent requests, verify:
  if (req.session.fingerprint !== req.headers['x-client-fingerprint']) {
    return res.status(401).json({ 
      error: 'Session hijacking detected' 
    });
  }
});

// 10. HTTPS Redirect (production)
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

## 📋 CHECKLIST SICUREZZA BACKEND

- [ ] **Helmet installato** e configurato con CSP strict
- [ ] **Rate Limiting** su /auth/* endpoints (5 req/15min)
- [ ] **Rate Limiting** su API generali (60 req/min)
- [ ] **CORS** configurato con origin whitelist
- [ ] **Cookie httpOnly, secure, sameSite** per sessioni
- [ ] **Bcrypt salt rounds >= 12** per password hashing
- [ ] **Input validation** con express-validator
- [ ] **SQL Injection protection** (parametrized queries)
- [ ] **XSS protection** (sanitize user input, escape HTML)
- [ ] **Session fingerprinting** per rilevare hijacking
- [ ] **HTTPS enforced** in production
- [ ] **Environment variables** per secrets (.env)
- [ ] **Dependency audit** (`npm audit fix`)
- [ ] **Logging** tentativi falliti per monitoring
- [ ] **Backup database** regolari e crittografati

## 🔐 DATABASE SECURITY

```javascript
// Mongoose (MongoDB) - Parametrized queries automatiche
const User = require('./models/user');
const user = await User.findOne({ username: req.body.username }); // SAFE

// PostgreSQL - Sempre usare parametrized queries
const result = await pool.query(
  'SELECT * FROM users WHERE username = $1',
  [username] // SAFE - no SQL injection
);

// NEVER:
// const result = await pool.query(
//   `SELECT * FROM users WHERE username = '${username}'` // VULNERABLE
// );
```

## 🚨 INCIDENT RESPONSE

1. **Monitoring**: Implementa Sentry o simili per error tracking
2. **Alerts**: Email/SMS per 10+ failed logins in 5 minuti
3. **Backup**: Daily automated backups con retention 30 giorni
4. **Recovery Plan**: Procedura documentata per data breach
5. **Update Policy**: Security patches applicati entro 48h

## ⚙️ ENVIRONMENT VARIABLES (.env)

```env
# PRODUCTION SETTINGS
NODE_ENV=production
SESSION_SECRET=<random-256-bit-hex>
DATABASE_URL=<connection-string>
OPENAI_API_KEY=<key>
FRONTEND_URL=https://smartdeck.app

# Security
BCRYPT_ROUNDS=12
SESSION_TIMEOUT=1800000
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=5
```

## 📊 MONITORING METRICS

Dashboard da monitorare:
- Failed login attempts per IP
- Successful logins per day
- API response times
- Session duration average
- Active users concurrent
- Database connection pool usage

Threshold alerts:
- 50+ failed logins/hour → Alert Admin
- Response time >2s → Performance issue
- 500+ error rate >1% → System issue
