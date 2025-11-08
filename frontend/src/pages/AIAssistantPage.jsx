import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import PageBackground from '../components/PageBackground';
import '../css/AIAssistantPage.css';
import API_HOST from '../utils/apiHost';

const AIAssistantPage = () => {
	const [messages, setMessages] = useState([]);
	const [inputMessage, setInputMessage] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [showQuickActions, setShowQuickActions] = useState(true);
	const messagesEndRef = useRef(null);
	const navigate = useNavigate();

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	const quickPrompts = [
		'Storia: Seconda Guerra Mondiale',
		'Matematica: Equazioni di secondo grado',
		'Geografia: Capitali europee',
		'Biologia: Corpo umano',
		'Fisica: Meccanica classica',
		'Letteratura: Decadentismo italiano'
	];

	const handleSendMessage = async (text = inputMessage) => {
		if (!text || text.trim().length === 0 || isLoading) return;

		const userMessage = {
			role: 'user',
			content: text.trim(),
			timestamp: new Date()
		};

		setMessages(prev => [...prev, userMessage]);
		setInputMessage('');
		setIsLoading(true);
		setShowQuickActions(false);

		// SEMPRE prova a generare il test - l'AI è abbastanza smart da capire qualsiasi input
		const isTestGeneration = true;

		try {
			if (isTestGeneration) {
				// Genera test con AI
				const res = await fetch(`${API_HOST}/ai-assistant/generate`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify({ prompt: text })
				});

				if (res.status === 401) {
					window.location.href = '/#/';
					return;
				}

				const data = await res.json();

				if (data.success) {
					const assistantMessage = {
						role: 'assistant',
						content: `✅ Perfetto! Ho creato "${data.testData.thematicArea}" con ${data.createdCount} flashcard.\n\nLe trovi nella Dashboard. Vuoi iniziare subito il test?`,
						timestamp: new Date(),
						testGenerated: true,
						testArea: data.testData.thematicArea
					};
					setMessages(prev => [...prev, assistantMessage]);
				} else if (data.error) {
					const assistantMessage = {
						role: 'assistant',
						content: `⚠️ ${data.error}\n\nProva a riformulare la richiesta in modo più specifico. Ad esempio: "Storia romana, 8 domande livello medio"`,
						timestamp: new Date()
					};
					setMessages(prev => [...prev, assistantMessage]);
				}
			} else {
				// Chat normale
				const res = await fetch(`${API_HOST}/ai-assistant/chat`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify({ message: text })
				});

				if (res.status === 401) {
					window.location.href = '/#/';
					return;
				}

				const data = await res.json();
				const assistantMessage = {
					role: 'assistant',
					content: data.reply || 'Mi dispiace, non ho capito. Puoi riformulare?',
					timestamp: new Date()
				};
				setMessages(prev => [...prev, assistantMessage]);
			}
		} catch (err) {
			console.error('❌ Errore comunicazione AI:', err);
			const errorMessage = {
				role: 'assistant',
				content: `❌ Errore di connessione. Verifica la tua connessione e riprova.\n\nSe il problema persiste, descrivi cosa vuoi studiare in modo dettagliato (es: "Crea 10 domande sulla Rivoluzione Francese, livello medio").`,
				timestamp: new Date()
			};
			setMessages(prev => [...prev, errorMessage]);
		} finally {
			setIsLoading(false);
		}
	};

	const handleKeyPress = (e) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	const handleQuickPrompt = (prompt) => {
		setInputMessage(prompt);
		handleSendMessage(prompt);
	};

	return (
		<div className="ai-assistant-page">
			<PageBackground />
			<Topbar />
			<div className="ai-container">
				<div className="chat-container">
					<div className="messages-area">
						{messages.map((msg, idx) => (
							<div key={idx} className={`message ${msg.role}`}>
								<div className="message-avatar">
									{msg.role === 'assistant' ? 'AI' : 'U'}
								</div>
								<div className="message-content">
									<div className="message-text">{msg.content}</div>
									<div className="message-time">
										{msg.timestamp.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
									</div>
									{msg.testGenerated && (
										<button 
											className="test-action-btn"
											onClick={() => navigate('/dashboard')}
										>
											Vai al Test
										</button>
									)}
								</div>
							</div>
						))}
						{isLoading && (
							<div className="message assistant">
								<div className="message-avatar">AI</div>
								<div className="message-content">
									<div className="typing-indicator">
										<span></span>
										<span></span>
										<span></span>
									</div>
								</div>
							</div>
						)}
						<div ref={messagesEndRef} />
					</div>

					{showQuickActions && messages.length === 0 && (
						<div className="quick-actions">
							<div className="quick-title">💡 Prova questi argomenti:</div>
							<div className="quick-buttons">
								{quickPrompts.map((prompt, idx) => (
									<button 
										key={idx}
										className="quick-btn"
										onClick={() => handleQuickPrompt(prompt)}
									>
										{prompt}
									</button>
								))}
							</div>
						</div>
					)}

					<div className="input-area">
						<textarea
							className="message-input"
							placeholder="Scrivi qualsiasi argomento... (es: storia romana, equazioni, verbi inglesi)"
							value={inputMessage}
							onChange={(e) => setInputMessage(e.target.value)}
							onKeyPress={handleKeyPress}
							rows={2}
							disabled={isLoading}
						/>
						<button 
							className="send-btn"
							onClick={() => handleSendMessage()}
							disabled={isLoading || !inputMessage.trim()}
							title={isLoading ? 'Generazione in corso...' : 'Invia'}
						>
							{isLoading ? '⏳' : '➤'}
						</button>
					</div>
				</div>

				<div className="ai-info">
					<div className="info-card">
						<div className="info-icon"></div>
						<div className="info-text">
							<strong>Come funziona?</strong>
							<p>Descrivi il tipo di test che vuoi (materia, argomento, numero domande) e l'AI lo creerà per te automaticamente!</p>
						</div>
					</div>
					<div className="info-card">
						<div className="info-icon"></div>
						<div className="info-text">
							<strong>Veloce e preciso</strong>
							<p>L'AI genera test in pochi secondi con domande pertinenti e risposte accurate.</p>
						</div>
					</div>
					<div className="info-card">
						<div className="info-icon"></div>
						<div className="info-text">
							<strong>Personalizzabile</strong>
							<p>Specifica difficoltà, numero domande e argomenti specifici per test su misura.</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AIAssistantPage;
