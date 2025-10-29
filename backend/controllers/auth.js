const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const TOKEN_EXPIRY = '2h';
const MAX_AGE = 2 * 60 * 60; // 2h di sessione massima

function setAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieOptions = [
    `token=${token}`,
    'HttpOnly',
    'Path=/',
    `Max-Age=${MAX_AGE}`,
    `SameSite=${isProd ? 'None' : 'Lax'}`,
    isProd && 'Secure'
  ].filter(Boolean).join('; ');
  res.setHeader('Set-Cookie', cookieOptions);
}

function getTokenFromReq(req) {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) return auth.substring(7);
  
  const cookies = req.headers.cookie?.split(';').map(s => s.trim()) || [];
  const tokenCookie = cookies.find(c => c.startsWith('token='));
  return tokenCookie?.substring(6) || null;
}

async function register(req, res) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username e password obbligatori' });
  }
  
  try {
    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(409).json({ error: 'Utente già registrato' });
    }
    
    const hash = await bcrypt.hash(password, 10);
    const user = await new User({ username, password: hash }).save();
    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
    
    setAuthCookie(res, token);
    res.status(201).json({ message: 'Registrazione avvenuta con successo', userId: user._id, token });
  } catch (err) {
    res.status(500).json({ error: 'Errore server', details: err.message });
  }
}

async function login(req, res) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username e password obbligatori' });
  }
  
  try {
    const user = await User.findOne({ username });
    if (!user?.password || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }
    
    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
    setAuthCookie(res, token);
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Errore server', details: err.message });
  }
}

function authMiddleware(req, res, next) {
  const token = getTokenFromReq(req);
  if (!token) {
    return res.status(401).json({ error: 'Token mancante' });
  }
  
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token non valido' });
  }
}

function optionalAuthMiddleware(req, res, next) {
  const token = getTokenFromReq(req);
  try {
    req.user = token ? jwt.verify(token, JWT_SECRET) : null;
  } catch {
    req.user = null;
  }
  next();
}

function me(req, res) {
  const token = getTokenFromReq(req);
  if (!token) {
    return res.json({ authenticated: false, user: null });
  }
  
  try {
    const { id, username } = jwt.verify(token, JWT_SECRET);
    res.json({ authenticated: true, user: { id, username } });
  } catch {
    res.json({ authenticated: false, user: null });
  }
}

function logout(req, res) {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieOptions = [
    'token=',
    'Max-Age=0',
    'HttpOnly',
    'Path=/',
    `SameSite=${isProd ? 'None' : 'Lax'}`,
    isProd && 'Secure'
  ].filter(Boolean).join('; ');
  res.setHeader('Set-Cookie', cookieOptions);
  res.json({ message: 'Logout effettuato' });
}

async function getAllUsers(req, res) {
  try {
    const users = await User.find().select('-password');
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Errore recupero utenti', details: err.message });
  }
}

module.exports = { register, login, authMiddleware, optionalAuthMiddleware, me, logout, getAllUsers };
