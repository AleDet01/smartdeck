import React, { useState } from 'react';
import API_HOST from '../utils/apiHost';
import '../css/LandingPage.css';

export default function LandingPage() {

	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [mode, setMode] = useState('login'); // 'login' | 'register'
	

	
	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
		try {
			const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
			const res = await fetch(`${API_HOST}${endpoint}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ username: username.trim(), password })
			});
			const data = await res.json();
			if (res.ok) {
				// Sessione gestita via cookie httpOnly, nessun salvataggio in localStorage
				window.location.href = '/#/dashboard';
			} else {
				setError(data.error || 'Errore');
			}
		} catch (error) {
			setError('Richiesta fallita');
		}
	};

  return (
    <div className="landing-container">
			<div className="landing-box">
				<div className="form-section" style={{ gap: 10 }}>
					<h2 className="section-title" style={{ userSelect: 'none' }}>{mode === 'login' ? 'Accedi' : 'Registrati'}</h2>
					<form onSubmit={handleSubmit}>
						<input className="modern-input" type="text" name="username" autoComplete="username" required placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
						<input className="modern-input" type="password" name="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
						<button className="modern-btn" type="submit">{mode === 'login' ? 'Accedi' : 'Registrati'}</button>
					</form>
					{error && <div className="error">{error}</div>}
					<button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }} style={{
						marginTop: 10,
						background: 'transparent',
						border: 'none',
						color: '#23272f',
						textDecoration: 'underline',
						cursor: 'pointer',
						fontWeight: 600
					}}>
						{mode === 'login' ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
					</button>
				</div>
			</div>
		</div>
	);
}
