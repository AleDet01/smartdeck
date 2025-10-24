const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

function setAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';
  const maxAgeSeconds = 2 * 60 * 60; // 2h
  const sameSiteAttr = isProd ? 'SameSite=None' : 'SameSite=Lax';
  const cookie = [
    `token=${token}`,
    'HttpOnly',
    'Path=/',
    `Max-Age=${maxAgeSeconds}`,
    sameSiteAttr,
    isProd ? 'Secure' : null
  ].filter(Boolean).join('; ');
  res.setHeader('Set-Cookie', cookie);
}

function getTokenFromReq(req) {
  // Prefer Authorization: Bearer <token>
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    return auth.split(' ')[1];
  }
  // Fallback to cookie named 'token'
  const cookieHeader = req.headers.cookie || '';
  const parts = cookieHeader.split(';').map(s => s.trim());
  for (const part of parts) {
    if (part.startsWith('token=')) {
      return part.substring('token='.length);
    }
  }
  return null;
}

async function register(req, res) {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username e password obbligatori' });
  try {
    const existing = await User.findOne({ username });
    if (existing) return res.status(409).json({ error: 'Utente già registrato' });
    const hash = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hash });
    const saved = await user.save();
    console.log('Nuovo utente salvato:', saved._id.toString(), saved.username);
    // crea token e imposta cookie httpOnly
    const token = jwt.sign({ id: saved._id, username: saved.username }, JWT_SECRET, { expiresIn: '2h' });
    setAuthCookie(res, token);
    res.status(201).json({ message: 'Registrazione avvenuta con successo', userId: saved._id, token });
  } catch (err) {
    res.status(500).json({ error: 'Errore server', details: err.message });
  }
}

async function login(req, res) {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username e password obbligatori' });
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: 'Credenziali non valide' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Credenziali non valide' });
    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '2h' });
    setAuthCookie(res, token);
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Errore server', details: err.message });
  }
}

function authMiddleware(req, res, next) {
  const token = getTokenFromReq(req);
  if (!token) return res.status(401).json({ error: 'Token mancante' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Token non valido' });
  }
}

function me(req, res) {
  const token = getTokenFromReq(req);
  if (!token) return res.status(200).json({ authenticated: false, user: null });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return res.json({ authenticated: true, user: { id: decoded.id, username: decoded.username } });
  } catch {
    return res.status(200).json({ authenticated: false, user: null });
  }
}

function logout(req, res) {
  const isProd = process.env.NODE_ENV === 'production';
  const cookie = [
    'token=; Max-Age=0',
    'HttpOnly',
    'Path=/',
    isProd ? 'SameSite=None' : 'SameSite=Lax',
    isProd ? 'Secure' : null
  ].filter(Boolean).join('; ');
  res.setHeader('Set-Cookie', cookie);
  res.json({ message: 'Logout effettuato' });
}

module.exports = { register, login, authMiddleware, me, logout };
