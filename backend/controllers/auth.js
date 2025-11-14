const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { incrementFailedAttempts, resetFailedAttempts } = require('../middleware/security');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const TOKEN_EXPIRY = '2h';
const MAX_AGE = 7200; // 2h in secondi

const isProd = () => process.env.NODE_ENV === 'production';

const setAuthCookie = (res, token, maxAge = MAX_AGE) => {
  const options = [`token=${token}`, 'HttpOnly', 'Path=/', `Max-Age=${maxAge}`, `SameSite=${isProd() ? 'None' : 'Lax'}`, isProd() && 'Secure'].filter(Boolean).join('; ');
  res.setHeader('Set-Cookie', options);
};

const getTokenFromReq = (req) => {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) return auth.substring(7);
  return req.headers.cookie?.split(';').find(c => c.trim().startsWith('token='))?.trim().substring(6) || null;
};

const register = async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // Check if MongoDB is connected
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ MongoDB not connected, cannot process registration');
      return res.status(503).json({ 
        error: 'Database non disponibile. Il server si sta avviando, riprova tra qualche secondo.' 
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ username }).lean();
    if (existingUser) {
      return res.status(409).json({ error: 'Utente già registrato' });
    }
    
    // Hash password with 12 rounds (sicurezza ottimale)
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const user = await User.create({ 
      username: username.toLowerCase(), // Normalizza username
      password: hashedPassword 
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username }, 
      JWT_SECRET, 
      { expiresIn: TOKEN_EXPIRY }
    );
    
    setAuthCookie(res, token);
    
    console.log(`✓ New user registered: ${username} from IP: ${req.ip}`);
    
    res.status(201).json({ 
      message: 'Registrazione avvenuta con successo', 
      userId: user._id, 
      token 
    });
  } catch (err) {
    console.error('❌ Registration error:', err);
    res.status(500).json({ error: 'Errore durante la registrazione' });
  }
};

const login = async (req, res) => {
  const { username, password } = req.body;
  
  try {
    console.log(`🔍 Login attempt - Username: ${username}, IP: ${req.ip}`);
    
    // Validazione input
    if (!username || !password) {
      console.warn(`⚠️ Missing credentials from IP: ${req.ip}`);
      return res.status(400).json({ error: 'Username e password richiesti' });
    }
    
    // Check if MongoDB is connected
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ MongoDB not connected, cannot process login');
      return res.status(503).json({ 
        error: 'Database non disponibile. Il server si sta avviando, riprova tra qualche secondo.' 
      });
    }
    
    // Find user (case insensitive) - username è già normalizzato lowercase nel DB
    const user = await User.findOne({ 
      username: username.toLowerCase() 
    }).select('+password');
    
    if (!user) {
      // Generic error per security (non rivelare se utente esiste)
      console.warn(`⚠️ Login attempt for non-existent user: ${username} from IP: ${req.ip}`);
      return res.status(401).json({ error: 'Credenziali non valide' });
    }
    
    console.log(`🔍 User found: ${user.username}, checking password...`);
    
    // Compare password (timing-safe)
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.warn(`⚠️ Failed login for user: ${username} from IP: ${req.ip}`);
      
      // Incrementa failed attempts e blocca account se necessario
      await incrementFailedAttempts(username);
      
      logger.logAuth('login_failed', username, false, {
        reason: 'invalid_password',
        ip: req.ip
      });
      
      return res.status(401).json({ error: 'Credenziali non valide' });
    }
    
    // Password corretta - resetta failed attempts
    await resetFailedAttempts(username);
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username }, 
      JWT_SECRET, 
      { expiresIn: TOKEN_EXPIRY }
    );
    
    setAuthCookie(res, token);
    
    console.log(`✓ User logged in: ${username} from IP: ${req.ip}`);
    
    logger.logAuth('login_success', username, true, {
      userId: user._id,
      ip: req.ip
    });
    
    res.json({ token });
  } catch (err) {
    console.error('❌ Login error:', err);
    console.error('Error stack:', err.stack);
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    
    // Log più dettagliato per debugging
    try {
      logger.logError(err, req);
    } catch (logErr) {
      console.error('Failed to log error:', logErr);
    }
    
    res.status(500).json({ 
      error: 'Errore interno del server',
      ...(process.env.NODE_ENV !== 'production' && { details: err.message })
    });
  }
};

const authMiddleware = (req, res, next) => {
  const token = getTokenFromReq(req);
  if (!token) return res.status(401).json({ error: 'Token mancante' });
  
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token non valido' });
  }
};

const optionalAuthMiddleware = (req, res, next) => {
  const token = getTokenFromReq(req);
  try {
    req.user = token ? jwt.verify(token, JWT_SECRET) : null;
  } catch {
    req.user = null;
  }
  next();
};

const me = (req, res) => {
  const token = getTokenFromReq(req);
  if (!token) return res.json({ authenticated: false, user: null });
  
  try {
    const { id, username } = jwt.verify(token, JWT_SECRET);
    res.json({ authenticated: true, user: { id, username } });
  } catch {
    res.json({ authenticated: false, user: null });
  }
};

const logout = (req, res) => {
  setAuthCookie(res, '', 0);
  res.json({ message: 'Logout effettuato' });
};

module.exports = { register, login, authMiddleware, optionalAuthMiddleware, me, logout };
