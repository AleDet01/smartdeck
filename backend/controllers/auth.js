const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

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
    res.status(201).json({ message: 'Registrazione avvenuta con successo', userId: saved._id });
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
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Errore server', details: err.message });
  }
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Token mancante' });
  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Token non valido' });
  }
}

module.exports = { register, login, authMiddleware };
