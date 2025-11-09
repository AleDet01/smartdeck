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
	const [attachedFiles, setAttachedFiles] = useState([]);
	const messagesEndRef = useRef(null);
	const fileInputRef = useRef(null);
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

	const handleFileSelect = (e) => {
		const files = Array.from(e.target.files);
		const validFiles = files.filter(file => {
			const validTypes = ['text/plain', 'application/pdf', 'image/png', 'image/jpeg'];
			const maxSize = 10 * 1024 * 1024; // 10MB
			return validTypes.includes(file.type) && file.size <= maxSize;
		});
		setAttachedFiles(prev => [...prev, ...validFiles]);
	};

	const removeFile = (index) => {
		setAttachedFiles(prev => prev.filter((_, i) => i !== index));
	};

	const formatFileSize = (bytes) => {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	};

	return (
		<div className="ai-assistant-page">
			<PageBackground />
			<Topbar />
			<div className="ai-container">
				<div className="chat-header">
					<h1 className="chat-title">✨ AI Assistant</h1>
					<p className="chat-subtitle">Genera flashcard intelligenti da qualsiasi argomento</p>
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

					{showQuickActions && messages.length === 0 && (
						<div className="quick-actions">
							<div className="quick-title">💡 Esempi rapidi</div>
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

					{/* File Attachments Preview */}
					{attachedFiles.length > 0 && (
						<div className="attached-files-preview">
							{attachedFiles.map((file, idx) => (
								<div key={idx} className="attached-file">
									<div className="file-info">
										<span className="file-icon">📄</span>
										<div className="file-details">
											<span className="file-name">{file.name}</span>
											<span className="file-size">{formatFileSize(file.size)}</span>
										</div>
									</div>
									<button 
										className="remove-file-btn"
										onClick={() => removeFile(idx)}
										title="Rimuovi file"
									>
										✕
									</button>
								</div>
							))}
						</div>
					)}

					<div className="input-area">
						<input
							type="file"
							ref={fileInputRef}
							onChange={handleFileSelect}
							multiple
							accept=".txt,.pdf,.png,.jpg,.jpeg"
							style={{ display: 'none' }}
						/>
						
						<button 
							className="attach-btn"
							onClick={() => fileInputRef.current?.click()}
							disabled={isLoading}
							title="Allega file (PDF, TXT, Immagini)"
						>
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
								<path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
							</svg>
						</button>

						<textarea
							className="message-input"
							placeholder="Descrivi l'argomento o carica un file... 💬"
							value={inputMessage}
							onChange={(e) => setInputMessage(e.target.value)}
							onKeyPress={handleKeyPress}
							rows={1}
							disabled={isLoading}
						/>

						<button 
							className="send-btn"
							onClick={() => handleSendMessage()}
							disabled={isLoading || (!inputMessage.trim() && attachedFiles.length === 0)}
							title={isLoading ? 'Generazione in corso...' : 'Invia'}
						>
							{isLoading ? (
								<div className="loading-spinner"></div>
							) : (
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
									<path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
								</svg>
							)}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AIAssistantPage;
