import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../utils/themeContext';
import API_HOST from '../utils/apiHost';
import '../css/LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleMode = useCallback(() => {
    setMode(prev => (prev === 'login' ? 'register' : 'login'));
    setError('');
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 secondi timeout
    
    try {
      console.log(`📡 Tentativo ${mode} su ${API_HOST}/auth/${mode}`);
      
      const res = await fetch(`${API_HOST}/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: username.trim(), password }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Errore di autenticazione');
      
      console.log('✓ Login effettuato, reindirizzamento...');
      navigate('/dashboard');
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('❌ Errore login:', err);
      
      if (err.name === 'AbortError') {
        setError('Timeout: il server non risponde. Verifica la connessione.');
      } else if (err.message.includes('Failed to fetch')) {
        setError('Impossibile contattare il server. Verifica che il backend sia attivo.');
      } else {
        setError(err.message || 'Errore di connessione');
      }
    } finally {
      setLoading(false);
    }
  }, [mode, username, password, navigate]);

  return (
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
                className="modern-input"
                type="text"
                placeholder=" "
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
              <label htmlFor="username" className="floating-label">Username</label>
            </div>

            <div className="field">
              <input
                id="password"
                className="modern-input"
                type={showPassword ? 'text' : 'password'}
                placeholder=" "
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
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
          </div>
      </div>
    </div>
  );
}
