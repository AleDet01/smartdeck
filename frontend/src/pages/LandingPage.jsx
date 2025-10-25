import React, { useState, useCallback } from 'react';
import API_HOST from '../utils/apiHost';
import '../css/LandingPage.css';

export default function LandingPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
      const body = { username: username.trim(), password };
      const res = await fetch(`${API_HOST}/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Errore di autenticazione');
      }
      // cookie httpOnly viene impostato dal server; reindirizza alla dashboard
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
        <div className="form-section">
          <h2 className="section-title" style={{ userSelect: 'none' }}>Benvenuto</h2>
          <form onSubmit={handleSubmit} className="auth-form">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
            />
            {error ? <div className="error-text">{error}</div> : null}
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
