import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../utils/themeContext';
import API_HOST from '../utils/apiHost';
import { 
  validatePasswordStrength, 
  validateEmail, 
  validateUsername,
  sanitizeInput,
  RateLimiter,
  generateFingerprint
} from '../utils/security';
import LoadingAnimation from '../components/LoadingAnimation';
import '../css/LandingPage.css';

const loginLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 min
const registerLimiter = new RateLimiter(3, 60 * 60 * 1000); // 3 attempts per hour

export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const fingerprintRef = useRef(null);

  // Generate fingerprint on mount
  useEffect(() => {
    generateFingerprint().then(fp => {
      fingerprintRef.current = fp;
    });
  }, []);

  const toggleMode = useCallback(() => {
    setMode(prev => (prev === 'login' ? 'register' : 'login'));
    setError('');
    setValidationErrors({});
    setPasswordStrength(null);
  }, []);

  // Real-time password validation for register mode
  useEffect(() => {
    if (mode === 'register' && password.length > 0) {
      const validation = validatePasswordStrength(password);
      setPasswordStrength(validation);
    } else {
      setPasswordStrength(null);
    }
  }, [password, mode]);

  // Validate inputs
  const validateInputs = useCallback(() => {
    const errors = {};

    // Username validation
    const trimmedUsername = username.trim();
    if (!trimmedUsername || trimmedUsername.length === 0) {
      errors.username = 'Username richiesto';
    } else if (mode === 'register') {
      const usernameCheck = validateUsername(trimmedUsername);
      if (!usernameCheck.isValid) {
        errors.username = usernameCheck.message;
      }
    }

    // Password validation
    if (!password || password.length === 0) {
      errors.password = 'Password richiesta';
    } else if (mode === 'register') {
      const passwordCheck = validatePasswordStrength(password);
      if (!passwordCheck.isValid) {
        errors.password = passwordCheck.message;
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [mode, username, password]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    
    // Client-side validation
    if (!validateInputs()) {
      return;
    }

    // Rate limiting
    const limiter = mode === 'login' ? loginLimiter : registerLimiter;
    const rateLimitKey = mode === 'login' ? 'login' : 'register';
    const rateLimitCheck = limiter.canAttempt(rateLimitKey);

    if (!rateLimitCheck.allowed) {
      setError(`Troppi tentativi. Riprova tra ${rateLimitCheck.resetIn} minuti.`);
      return;
    }

    setLoading(true);
    window.authStartTime = Date.now(); // Track start time for minimum animation duration
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s per cold start Render
    
    try {
      console.log(`📡 Tentativo ${mode} su ${API_HOST}/auth/${mode}`);
      
      // Sanitize inputs
      const sanitizedUsername = sanitizeInput(username.trim());
      
      const res = await fetch(`${API_HOST}/auth/${mode}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Client-Fingerprint': fingerprintRef.current || 'unknown'
        },
        credentials: 'include',
        body: JSON.stringify({ 
          username: sanitizedUsername, 
          password 
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Errore di autenticazione');
      
      console.log('✓ Autenticazione effettuata, reindirizzamento...');
      
      // Reset rate limiter on success
      limiter.reset(rateLimitKey);
      
      // Store session timestamp
      sessionStorage.setItem('sessionStart', Date.now().toString());
      
      // Delay navigation to show complete animation (minimum 2 seconds)
      const minLoadTime = 2000;
      const elapsed = Date.now() - (window.authStartTime || Date.now());
      const remainingTime = Math.max(0, minLoadTime - elapsed);
      
      setTimeout(() => {
        navigate('/dashboard');
      }, remainingTime);
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('❌ Errore autenticazione:', err);
      
      if (err.name === 'AbortError') {
        setError('Timeout: il server sta avviandosi (attendi 30-60s per il primo accesso). Riprova.');
      } else if (err.message.includes('Failed to fetch')) {
        setError('Errore di rete. Verifica CORS e che il backend sia attivo su Render.');
      } else {
        setError(err.message || 'Errore di connessione');
      }
    } finally {
      setLoading(false);
    }
  }, [mode, username, password, navigate, validateInputs]);

  return (
    <>
      {loading && (
        <LoadingAnimation 
          message={mode === 'login' ? 'Autenticazione in corso...' : 'Creazione account...'}
        />
      )}
      
      <div className="landing-container">
        <div className="marble-background"></div>
        
        <button 
          className="landing-theme-toggle"
          onClick={toggleTheme}
          aria-label="Cambia tema"
          title={theme === 'light' ? 'Passa al tema scuro' : 'Passa al tema chiaro'}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        <div className="form-section">
          <div className="brand-header">
            <div className="brand-logo">
              <span className="logo-icon">📚</span>
              <span className="logo-text">SmartDeck</span>
            </div>
            <p className="brand-tagline">
              {mode === 'login' 
                ? 'Bentornato! Accedi per continuare il tuo percorso di apprendimento' 
                : 'Inizia il tuo viaggio verso un apprendimento più intelligente'}
            </p>
          </div>

          <div className="mode-switch" role="tablist" aria-label="Scegli modalità">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              className={`mode-btn${mode === 'login' ? ' active' : ''}`}
              onClick={() => { setMode('login'); setError(''); }}
            >
              Accedi
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              className={`mode-btn${mode === 'register' ? ' active' : ''}`}
              onClick={() => { setMode('register'); setError(''); }}
            >
              Crea Account
            </button>
          </div>
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="field">
              <input
                id="username"
                className={`modern-input ${validationErrors.username ? 'input-error' : ''}`}
                type="text"
                placeholder=" "
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                maxLength={30}
                required
                aria-invalid={!!validationErrors.username}
                aria-describedby={validationErrors.username ? "username-error" : undefined}
              />
              <label htmlFor="username" className="floating-label">Username</label>
              {validationErrors.username && (
                <span id="username-error" className="field-error" role="alert">
                  {validationErrors.username}
                </span>
              )}
            </div>

            <div className="field">
              <input
                id="password"
                className={`modern-input ${validationErrors.password ? 'input-error' : ''}`}
                type={showPassword ? 'text' : 'password'}
                placeholder=" "
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                maxLength={128}
                required
                aria-invalid={!!validationErrors.password}
                aria-describedby={validationErrors.password ? "password-error" : undefined}
              />
              <label htmlFor="password" className="floating-label">Password</label>
              <button
                type="button"
                className="pass-toggle"
                aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                onClick={() => setShowPassword(v => !v)}
              >
                {showPassword ? 'Nascondi' : 'Mostra'}
              </button>
              {mode === 'register' && passwordStrength && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div 
                      className={`strength-fill strength-${passwordStrength.strength}`}
                      style={{ width: `${passwordStrength.score}%` }}
                    />
                  </div>
                  <span className={`strength-text strength-${passwordStrength.strength}`}>
                    {passwordStrength.message}
                  </span>
                </div>
              )}
              {validationErrors.password && (
                <span id="password-error" className="field-error" role="alert">
                  {validationErrors.password}
                </span>
              )}
            </div>

            {error ? <div className="error" role="alert" aria-live="polite">{error}</div> : null}
            <button className="modern-btn" type="submit" disabled={loading}>
              {loading ? (
                <span className="btn-content">
                  <span className="spinner"></span>
                  Caricamento...
                </span>
              ) : (
                mode === 'login' ? 'Accedi' : 'Crea Account'
              )}
            </button>
          </form>
          
          <div className="form-footer">
            <p className="footer-text">
              {mode === 'login' 
                ? 'Flashcard intelligenti potenziate da AI' 
                : 'Nessuna carta di credito richiesta'}
            </p>
            <div className="legal-links">
              <a href="/#/privacy" className="legal-link">Privacy Policy</a>
              <span className="legal-separator">•</span>
              <a href="/#/terms" className="legal-link">Termini di Servizio</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
