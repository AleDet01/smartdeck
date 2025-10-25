const bcrypt = require('bcrypt');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user');

const isProd = process.env.NODE_ENV === 'production';
const FRONTEND_URL = process.env.FRONTEND_URL || null;

// Passport serialize/deserialize
passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    done(null, user);
  } catch (e) {
    done(e);
  }
});

// Google OAuth 2.0 strategy
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const OAUTH_CALLBACK_URL = process.env.OAUTH_CALLBACK_URL || '/auth/google/callback';

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: OAUTH_CALLBACK_URL
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const provider = 'google';
      const providerId = profile.id;
      let user = await User.findOne({ provider, providerId });
      if (!user) {
        const username = (profile.emails && profile.emails[0] && profile.emails[0].value) || profile.displayName || `google_${providerId}`;
        user = new User({ username, provider, providerId });
        await user.save();
      }
      return done(null, user);
    } catch (e) {
      return done(e);
    }
  }));
}

// Middleware auth basato su sessione Passport
function authMiddleware(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  return res.status(401).json({ error: 'Non autenticato' });
}

// Endpoints classici (opzionali): manteniamo per retrocompatibilità minima
async function register(req, res) {
  return res.status(501).json({ error: 'Registrazione locale disabilitata: usare OAuth' });
}
async function login(req, res) {
  return res.status(501).json({ error: 'Login locale disabilitato: usare OAuth' });
}

function me(req, res) {
  if (req.user) {
    const u = req.user;
    return res.json({ authenticated: true, user: { id: u._id || u.id, username: u.username } });
  }
  return res.json({ authenticated: false, user: null });
}

function logout(req, res) {
  const done = () => {
    // distruggi cookie di sessione impostando Max-Age=0
    const name = (req.session && req.session.cookie && req.session.cookie.name) || 'connect.sid';
    const cookie = [
      `${name}=; Max-Age=0`,
      'HttpOnly',
      'Path=/',
      isProd ? 'SameSite=None' : 'SameSite=Lax',
      isProd ? 'Secure' : null
    ].filter(Boolean).join('; ');
    res.setHeader('Set-Cookie', cookie);
    res.json({ message: 'Logout effettuato' });
  };
  try {
    req.logout(() => {
      if (req.session) req.session.destroy(() => done()); else done();
    });
  } catch {
    if (req.session) req.session.destroy(() => done()); else done();
  }
}

// Avvio OAuth
function startGoogleAuth(req, res, next) {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) return res.status(500).send('OAuth non configurato');
  return passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
}

// Callback OAuth
const googleCallback = [
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    const origin = FRONTEND_URL || req.headers.origin || '';
    const target = origin ? `${origin}/#/dashboard` : '/';
    res.redirect(target);
  }
];

module.exports = { passportInstance: passport, register, login, authMiddleware, me, logout, startGoogleAuth, googleCallback };
