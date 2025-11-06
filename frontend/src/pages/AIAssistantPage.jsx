import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import PageBackground from '../components/PageBackground';
import '../css/AIAssistantPage.css';
import API_HOST from '../utils/apiHost';

const AIAssistantPage = () => {
	const [messages, setMessages] = useState([
		{
			role: 'assistant',
			content: 'Ciao! Sono il tuo assistente AI per creare test. Dimmi che tipo di test vuoi creare e io lo genererò per te.\n\nEsempio: "Crea un test di 5 domande sulla storia romana" oppure "Voglio un quiz sulla matematica, argomento frazioni"',
			timestamp: new Date()
		}
	]);
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
		'Crea un test di storia sulla seconda guerra mondiale (10 domande)',
		'Genera un quiz di matematica sulle equazioni di secondo grado (8 domande)',
		'Genera test di geografia sull\'Europa (12 domande, livello medio)',
		'Crea un quiz di biologia sul corpo umano (7 domande, livello facile)',
		'Crea test di letteratura italiana sul Decadentismo (10 domande)',
		'Genera quiz di fisica sulla meccanica classica (9 domande, livello avanzato)'
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

		// Determina se l'utente vuole generare un test
		const isTestGeneration = /crea|genera|fai|voglio|prepara/i.test(text);

		try {
			if (isTestGeneration) {
				// Genera test con AI
				const res = await fetch(`${API_HOST}/ai-assistant/generate`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify({ prompt: text })
				});

				const data = await res.json();

				if (data.success) {
					const assistantMessage = {
						role: 'assistant',
						content: `Perfetto! Ho generato il test "${data.testData.thematicArea}" con ${data.createdCount} domande.\n\nPuoi trovarlo nella tua Dashboard. Vuoi fare subito il test o generarne un altro?`,
						timestamp: new Date(),
						testGenerated: true,
						testArea: data.testData.thematicArea
					};
					setMessages(prev => [...prev, assistantMessage]);
				} else if (data.fallback) {
					// Fallback: mostra comunque un messaggio di conferma
					const assistantMessage = {
						role: 'assistant',
						content: `Ho capito! Vuoi creare un test su: "${text}".\n\nPosso generarlo per te in automatico. Quante domande desideri e che livello di difficoltà?`,
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

				const data = await res.json();
				const assistantMessage = {
					role: 'assistant',
					content: data.reply || 'Mi dispiace, non ho capito. Puoi riformulare?',
					timestamp: new Date()
				};
				setMessages(prev => [...prev, assistantMessage]);
			}
		} catch (err) {
			console.error('Errore comunicazione AI:', err);
			const errorMessage = {
				role: 'assistant',
				content: 'Ops! C\'è stato un errore. Per favore riprova oppure specifica materia, argomento e numero di domande e lo genererò per te.',
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
				<div className="ai-header">
					<h1>AI Assistant</h1>
					<p className="ai-subtitle">Crea test semplicemente descrivendo cosa vuoi</p>
				</div>

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

					{showQuickActions && messages.length === 1 && (
						<div className="quick-actions">
							<div className="quick-title">Esempi di generazione automatica:</div>
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
							placeholder="Descrivi il test che vuoi creare..."
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
						>
							{isLoading ? 'Invio…' : 'Invia'}
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
