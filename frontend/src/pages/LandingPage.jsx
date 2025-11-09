import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API_HOST from '../utils/apiHost';
import '../css/LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();
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
      
      console.log('✓ Login effettuato, reindirizzamento...');
      navigate('/dashboard');
    } catch (err) {
      console.error('❌ Errore login:', err);
      setError(err.message || 'Errore');
    } finally {
      setLoading(false);
    }
  }, [mode, username, password, navigate]);

  return (
    <div className="landing-container">
      <div className="form-section">
          <h2 className="section-title" style={{ userSelect: 'none' }}>{mode === 'login' ? 'Benvenuto' : 'Registrati'}</h2>
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
              Registrati
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
              {loading ? 'Attendere…' : (mode === 'login' ? 'Entra' : 'Registrati')}
            </button>
          </form>
          {/* Link alternativo rimosso in favore del selettore a pill */}
      </div>
    </div>
  );
}
