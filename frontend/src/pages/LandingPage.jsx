import React, { useState } from 'react';
import RegisterSection from '../components/RegisterSection';
import API_HOST from '../utils/apiHost';
import '../css/LandingPage.css';

export default function LandingPage() {

	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	

	
	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
		try {
			const res = await fetch(`${API_HOST}/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username: username.trim(), password })
			});
			const data = await res.json();
			if (res.ok) {
				localStorage.setItem('token', data.token);
				window.location.href = '/#/dashboard';
			} else {
				setError(data.error || 'Errore di login');
			}
		} catch (error) {
			setError('Login failed');
		}
	};

  return (
    <div className="landing-container">
			<div className="landing-box">
				<div className="form-section">
					<h2 className="section-title" style={{ color: 'transparent', userSelect: 'none' }}>Accedi</h2>
					<form onSubmit={handleSubmit}>
						<input className="modern-input" type="text" name="username" autoComplete="username" required placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
						<input className="modern-input" type="password" name="password" autoComplete="current-password" required placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
						<button className="modern-btn" type="submit">Accedi</button>
					</form>
					{error && <div className="error">{error}</div>}
				</div>
				<div className="divider" />
				<div className="form-section">
					<RegisterSection />
				</div>
			</div>
		</div>
	);
}
