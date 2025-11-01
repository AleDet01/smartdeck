const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

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
  if (!username || !password) return res.status(400).json({ error: 'Username e password obbligatori' });
  
  try {
    if (await User.findOne({ username })) return res.status(409).json({ error: 'Utente già registrato' });
    
    const user = await User.create({ username, password: await bcrypt.hash(password, 10) });
    const token = jwt.sign({ id: user._id, username }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
    
    setAuthCookie(res, token);
    res.status(201).json({ message: 'Registrazione avvenuta con successo', userId: user._id, token });
  } catch (err) {
    res.status(500).json({ error: 'Errore server', details: err.message });
  }
};

const login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username e password obbligatori' });
  
  try {
    const user = await User.findOne({ username });
    if (!user?.password || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: 'Credenziali non valide' });
    
    const token = jwt.sign({ id: user._id, username }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
    setAuthCookie(res, token);
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Errore server', details: err.message });
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
