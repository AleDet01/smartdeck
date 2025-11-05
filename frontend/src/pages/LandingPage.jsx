import React, { useState, useCallback } from 'react';
import API_HOST from '../utils/apiHost';
import '../css/LandingPage.css';

export default function LandingPage() {
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
    try {
      const res = await fetch(`${API_HOST}/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: username.trim(), password })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Errore di autenticazione');
      window.location.href = '/#/dashboard';
    } catch (err) {
      setError(err.message || 'Errore');
    } finally {
      setLoading(false);
    }
  }, [mode, username, password]);

  return (
    <div className="landing-container">
      <div className="landing-box">
        <div className="brand" aria-hidden="true">
          <div className="brand-title">SmartDeck</div>
          <div className="brand-subtitle">Studia, crea e valuta con semplicità</div>
        </div>
        <div className="form-section">
          <h2 className="section-title" style={{ userSelect: 'none' }}>{mode === 'login' ? 'Benvenuto' : 'Crea un account'}</h2>
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
              {loading ? 'Attendere…' : (mode === 'login' ? 'Entra' : 'Registrati')}
            </button>
          </form>
          <button className="link-btn" type="button" onClick={toggleMode}>
            {mode === 'login' ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
          </button>
        </div>
      </div>
    </div>
  );
}
