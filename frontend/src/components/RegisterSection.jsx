import React, { useState } from 'react';
import '../css/LandingPage.css';

const API_HOST =
	process.env.REACT_APP_API_HOST ||
	(window.location.hostname === 'localhost' ? 'http://localhost:3000' : '');

export default function RegisterSection({ onRegisterSuccess }) {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');

	const handleRegister = async (e) => {
		e.preventDefault();
		setError('');
		setSuccess('');
		try {
			const res = await fetch(`${API_HOST}/auth/register`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password })
			});
			const data = await res.json();
			if (res.ok) {
				setSuccess('Registrazione avvenuta! Ora puoi accedere.');
				setUsername('');
				setPassword('');
				if (onRegisterSuccess) onRegisterSuccess();
			} else {
				setError(data.error || 'Errore di registrazione');
			}
		} catch {
			setError('Errore di rete');
		}
	};

	return (
		<>
			<h2 className="section-title">Registrati</h2>
			<form onSubmit={handleRegister}>
				<input className="modern-input" type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
				<input className="modern-input" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
				<button className="modern-btn" type="submit">Registrati</button>
			</form>
			{error && <div className="error">{error}</div>}
			{success && <div className="success">{success}</div>}
		</>
	);
}
