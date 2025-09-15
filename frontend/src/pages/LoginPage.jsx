import React, { useState } from 'react';
import '../css/AuthPage.css';
import { useNavigate } from 'react-router-dom';
import RegisterSection from '../components/RegisterSection';

const API_HOST =
	process.env.REACT_APP_API_HOST ||
	(window.location.hostname === 'localhost' ? 'http://localhost:3000' : '');

export default function LoginPage() {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const navigate = useNavigate();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
		try {
			const res = await fetch(`${API_HOST}/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password })
			});
			const data = await res.json();
			if (res.ok) {
				localStorage.setItem('token', data.token);
				navigate('/dashboard');
			} else {
				setError(data.error || 'Errore di login');
			}
		} catch {
			setError('Errore di rete');
		}
	};

	return (
		<div className="auth-container">
		 <div className="auth-box">
			 <div className="auth-section auth-form-box">
					   <h2 className="auth-title">Login</h2>
					   <form onSubmit={handleSubmit}>
						   <input className="auth-input" type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
						   <input className="auth-input" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
						   <button className="auth-btn" type="submit">Accedi</button>
					   </form>
					   {error && <div className="error">{error}</div>}
				   </div>
				<div className="auth-divider" />
				<RegisterSection />
			</div>
		</div>
	);
}
