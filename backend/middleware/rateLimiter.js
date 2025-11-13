const rateLimit = require('express-rate-limit');

// Rate limiters per diversi endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 5, // 5 richieste per IP
  message: { error: 'Troppi tentativi di login. Riprova tra 15 minuti.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    console.warn(`⚠️ Rate limit exceeded for IP: ${req.ip}`);
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
  handler: (req, res) => {
    console.warn(`⚠️ Register rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({ 
      error: 'Troppi tentativi di registrazione. Riprova tra 1 ora.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 100, // 100 richieste per IP
  message: { error: 'Troppi richieste. Riprova più tardi.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`⚠️ API rate limit exceeded for IP: ${req.ip}`);
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
  handler: (req, res) => {
    console.warn(`⚠️ AI rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({ 
      error: 'Limite richieste AI raggiunto. Riprova tra 1 ora.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

module.exports = {
  authLimiter,
  registerLimiter,
  apiLimiter,
  aiLimiter
};
