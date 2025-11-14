import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import PageBackground from '../components/PageBackground';
import LEDEffect from '../components/LEDEffect';
import '../css/AIAssistantPage.css';
import API_HOST from '../utils/apiHost';

const AIAssistantPage = () => {
	const [messages, setMessages] = useState([]);
	const [inputMessage, setInputMessage] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [showQuickActions, setShowQuickActions] = useState(true);
	const [attachedFiles, setAttachedFiles] = useState([]);
	const [aiModel, setAiModel] = useState('gpt-4o'); // gpt-4o, gpt-4o-mini, o1-preview
	const [conversationContext, setConversationContext] = useState([]);
	const [tokenUsage, setTokenUsage] = useState({ input: 0, output: 0, total: 0 });
	
	const messagesEndRef = useRef(null);
	const textareaRef = useRef(null);
	const fileInputRef = useRef(null);
	const navigate = useNavigate();

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	useEffect(() => {
		if (messages.length > 0) {
			scrollToBottom();
		}
	}, [messages]);

	// Auto-resize textarea
	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto';
			textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
		}
	}, [inputMessage]);

	const quickPrompts = [
		'Storia: Seconda Guerra Mondiale',
		'Matematica: Equazioni di secondo grado',
		'Geografia: Capitali europee',
		'Biologia: Corpo umano',
		'Fisica: Meccanica classica',
		'Letteratura: Decadentismo italiano'
	];

	// Helper per leggere file come base64
	const readFileAsBase64 = (file) => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result.split(',')[1]);
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});
	};

	const handleSendMessage = async (text = inputMessage, files = attachedFiles) => {
		if (!text || text.trim().length === 0 || isLoading) return;

		const userMessage = {
			role: 'user',
			content: text.trim(),
			timestamp: new Date(),
			files: files.length > 0 ? files.map(f => f.name) : null
		};

		setMessages(prev => [...prev, userMessage]);
		const newContext = [...conversationContext, { role: 'user', content: text.trim() }];
		setConversationContext(newContext);
		setInputMessage('');
		setAttachedFiles([]);
		setIsLoading(true);
		setShowQuickActions(false);

		// Crea messaggio assistant vuoto per streaming
		const assistantMessageId = Date.now();
		const initialAssistantMessage = {
			id: assistantMessageId,
			role: 'assistant',
			content: '',
			timestamp: new Date(),
			isStreaming: true
		};
		setMessages(prev => [...prev, initialAssistantMessage]);

		try {
			// Prepara files se presenti
			let filesData = null;
			if (files.length > 0) {
				filesData = await Promise.all(files.map(async f => ({
					name: f.name,
					type: f.type,
					size: f.size,
					content: await readFileAsBase64(f)
				})));
			}

			const res = await fetch(`${API_HOST}/ai-assistant/stream`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ 
					prompt: text.trim(),
					model: aiModel,
					conversationHistory: newContext.slice(-10),
					files: filesData
				})
			});

			if (res.status === 401) {
				window.location.href = '/#/';
				return;
			}

			if (!res.ok) {
				throw new Error(`HTTP error! status: ${res.status}`);
			}

			// Leggi stream
			const reader = res.body.getReader();
			const decoder = new TextDecoder();
			let streamedContent = '';
			let tokenStats = null;
			let testData = null;

			while (true) {
				const { value, done } = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value, { stream: true });
				const lines = chunk.split('\n');

				for (const line of lines) {
					if (line.startsWith('data: ')) {
						const data = line.slice(6);
						if (data === '[DONE]') continue;

						try {
							const parsed = JSON.parse(data);
							
							if (parsed.content) {
								streamedContent += parsed.content;
								setMessages(prev => prev.map(msg => 
									msg.id === assistantMessageId 
										? { ...msg, content: streamedContent }
										: msg
								));
							}

							if (parsed.tokens) {
								tokenStats = parsed.tokens;
							}

							if (parsed.testGenerated) {
								testData = parsed.testData;
							}

							if (parsed.error) {
								throw new Error(parsed.error);
							}
						} catch (e) {
							console.warn('Parse error:', e);
						}
					}
				}
			}

			// Finalizza messaggio
			setMessages(prev => prev.map(msg => 
				msg.id === assistantMessageId 
					? { 
						...msg, 
						isStreaming: false,
						testGenerated: !!testData,
						testArea: testData?.thematicArea,
						tokens: tokenStats
					}
					: msg
			));

			// Aggiorna context e token usage
			setConversationContext(prev => [...prev, { role: 'assistant', content: streamedContent }]);
			if (tokenStats) {
				setTokenUsage(prev => ({
					input: prev.input + (tokenStats.input || 0),
					output: prev.output + (tokenStats.output || 0),
					total: prev.total + (tokenStats.total || 0)
				}));
			}

		} catch (err) {
			console.error('❌ Errore AI:', err);
			setMessages(prev => prev.map(msg => 
				msg.id === assistantMessageId 
					? {
						...msg,
						content: `❌ Errore: ${err.message || 'Connessione fallita'}\n\nProva a:\n• Verificare la connessione\n• Riformulare la richiesta\n• Ridurre la lunghezza del messaggio`,
						isStreaming: false,
						isError: true
					}
					: msg
			));
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

	const clearChat = () => {
		if (window.confirm('Vuoi cancellare tutta la cronologia della chat?')) {
			setMessages([]);
			setConversationContext([]);
			setTokenUsage({ input: 0, output: 0, total: 0 });
			setShowQuickActions(true);
		}
	};

	const copyMessage = (content) => {
		navigator.clipboard.writeText(content);
	};

	const regenerateResponse = async (messageIndex) => {
		if (messageIndex < 1) return;
		const userMsg = messages[messageIndex - 1];
		if (userMsg.role !== 'user') return;

		// Rimuovi messaggi dopo quello da rigenerare
		setMessages(prev => prev.slice(0, messageIndex));
		setConversationContext(prev => prev.slice(0, messageIndex));
		
		// Rigenera
		handleSendMessage(userMsg.content);
	};

	const formatCost = (tokens) => {
		// Prezzi OpenAI per 1M tokens
		const pricing = {
			'gpt-4o': { input: 2.50, output: 10.00 },
			'gpt-4o-mini': { input: 0.15, output: 0.60 },
			'o1-preview': { input: 15.00, output: 60.00 }
		};
		const model = pricing[aiModel] || pricing['gpt-4o'];
		const cost = (tokens.input / 1000000 * model.input) + (tokens.output / 1000000 * model.output);
		return cost.toFixed(4);
	};

	const exportChat = () => {
		const chatText = messages.map(msg => 
			`[${msg.timestamp.toLocaleString('it-IT')}] ${msg.role === 'user' ? 'Tu' : 'AI'}: ${msg.content}`
		).join('\n\n');
		
		const blob = new Blob([chatText], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `chat-ai-${new Date().toISOString().split('T')[0]}.txt`;
		a.click();
		URL.revokeObjectURL(url);
	};

	return (
		<div className="ai-assistant-page">
			<PageBackground />
			<LEDEffect variant="floating" color="purple" />
			<Topbar />
			<div className="ai-container">
				<div className="ai-header">
					<div className="ai-title">
						<span className="ai-title-icon">🤖</span>
						<div className="ai-title-text">
							<h1>AI Assistant</h1>
							<p>Genera flashcard intelligenti con l'AI</p>
						</div>
					</div>
					<div className="ai-utilities">
						<button 
							className="utility-btn"
							onClick={exportChat}
							disabled={messages.length === 0}
							title="Esporta chat"
						>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
								<polyline points="7 10 12 15 17 10"/>
								<line x1="12" y1="15" x2="12" y2="3"/>
							</svg>
						</button>
						<button 
							className="utility-btn"
							onClick={clearChat}
							disabled={messages.length === 0}
							title="Cancella cronologia"
						>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<polyline points="3 6 5 6 21 6"/>
								<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
							</svg>
						</button>
					</div>
				</div>
				
				<div className="chat-container">
					<div className="messages-area">
						{messages.map((msg, idx) => (
							<div key={idx} className={`message ${msg.role} ${msg.isError ? 'error' : ''} ${msg.isStreaming ? 'streaming' : ''}`}>
								<div className="message-avatar">
									{msg.role === 'assistant' ? '🤖' : '👤'}
								</div>
								<div className="message-content">
									<div className="message-text">
										{msg.content}
										{msg.isStreaming && <span className="cursor-blink">▋</span>}
									</div>
									
									{msg.files && msg.files.length > 0 && (
										<div className="message-files">
											{msg.files.map((file, i) => (
												<span key={i} className="file-badge">📎 {file}</span>
											))}
										</div>
									)}

									<div className="message-footer">
										<span className="message-time">
											{msg.timestamp.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
										</span>
										
										{msg.tokens && (
											<span className="token-count" title={`Input: ${msg.tokens.input} | Output: ${msg.tokens.output} | Cost: $${formatCost(msg.tokens)}`}>
												{msg.tokens.total} tokens
											</span>
										)}
										
										{msg.role === 'assistant' && !msg.isStreaming && (
											<div className="message-actions">
												<button 
													className="msg-action-btn"
													onClick={() => copyMessage(msg.content)}
													title="Copia"
												>
													📋
												</button>
												<button 
													className="msg-action-btn"
													onClick={() => regenerateResponse(idx)}
													title="Rigenera"
												>
													🔄
												</button>
											</div>
										)}
									</div>

									{msg.testGenerated && (
										<button 
											className="test-action-btn"
											onClick={() => navigate('/dashboard')}
										>
											✨ Vai al Test Generato
										</button>
									)}
								</div>
							</div>
						))}
						{isLoading && (
							<div className="message assistant">
								<div className="message-avatar">🤖</div>
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

					<div className="input-area-wrapper">
						{/* Stats Bar */}
						<div className="stats-bar">
							<div className="model-selector">
								<select 
									value={aiModel} 
									onChange={(e) => setAiModel(e.target.value)}
									disabled={isLoading}
									className="model-select"
								>
									<option value="gpt-4o">GPT-4o (Più veloce)</option>
									<option value="gpt-4o-mini">GPT-4o Mini (Economico)</option>
									<option value="o1-preview">O1 Preview (Ragionamento)</option>
								</select>
							</div>
							<div className="token-stats">
								<span className="stat-label">Token usati:</span>
								<span className="stat-value">{tokenUsage.total.toLocaleString()}</span>
								<span className="stat-cost">~${formatCost(tokenUsage)}</span>
							</div>
						</div>

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
								ref={textareaRef}
								className="message-input"
								placeholder="Chiedi qualsiasi cosa... L'AI può generare test, rispondere a domande, analizzare contenuti... 🚀"
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

					<div className="openai-disclaimer">
						🚀 <strong>Powered by OpenAI</strong> - GPT-4o, GPT-4o-mini, O1-preview | 
						<span style={{ marginLeft: '8px', color: 'var(--color-green-500)', fontWeight: 600 }}>
							$10 Credit Caricato
						</span> | 
						<a href="https://openai.com/pricing" target="_blank" rel="noopener noreferrer" style={{ marginLeft: '8px', color: 'inherit', textDecoration: 'underline' }}>
							Pricing Info
						</a>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AIAssistantPage;
