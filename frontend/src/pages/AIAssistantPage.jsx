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

			// Aggiorna context
			setConversationContext(prev => [...prev, { role: 'assistant', content: streamedContent }]);

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
					<h1>AI Assistant</h1>
					<div className="ai-actions">
						<button 
							className="icon-btn"
							onClick={clearChat}
							disabled={messages.length === 0}
						>
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
								<polyline points="3 6 5 6 21 6"/>
								<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
							</svg>
						</button>
					</div>
				</div>
				
				<div className="chat-container">
					<div className="messages-area">
						{messages.map((msg, idx) => (
							<div key={idx} className={`message ${msg.role} ${msg.isError ? 'error' : ''}`}>
								<div className="message-content">
									<div className="message-text">
										{msg.content}
										{msg.isStreaming && <span className="cursor">|</span>}
									</div>
									
									{msg.role === 'assistant' && !msg.isStreaming && (
										<div className="message-actions">
											<button 
												className="action-btn"
												onClick={() => copyMessage(msg.content)}
											>
												Copy
											</button>
											<button 
												className="action-btn"
												onClick={() => regenerateResponse(idx)}
											>
												Regenerate
											</button>
										</div>
									)}

									{msg.testGenerated && (
										<button 
											className="test-btn"
											onClick={() => navigate('/dashboard')}
										>
											Go to Test →
										</button>
									)}
								</div>
							</div>
						))}
						{isLoading && (
							<div className="message assistant">
								<div className="message-content">
									<div className="typing">
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
						<div className="suggestions">
							{quickPrompts.slice(0, 4).map((prompt, idx) => (
								<button 
									key={idx}
									className="suggestion"
									onClick={() => handleQuickPrompt(prompt)}
								>
									{prompt}
								</button>
							))}
						</div>
					)}

					{attachedFiles.length > 0 && (
						<div className="files">
							{attachedFiles.map((file, idx) => (
								<div key={idx} className="file">
									<span>{file.name}</span>
									<button onClick={() => removeFile(idx)}>×</button>
								</div>
							))}
						</div>
					)}

					<div className="input-container">
						<input
							type="file"
							ref={fileInputRef}
							onChange={handleFileSelect}
							multiple
							accept=".txt,.pdf,.png,.jpg,.jpeg"
							style={{ display: 'none' }}
						/>
						
						<div className="input-wrapper">
							<select 
								value={aiModel} 
								onChange={(e) => setAiModel(e.target.value)}
								disabled={isLoading}
								className="model-select"
							>
								<option value="gpt-4o">GPT-4o</option>
								<option value="gpt-4o-mini">GPT-4o Mini</option>
								<option value="o1-preview">O1 Preview</option>
							</select>

							<textarea
								ref={textareaRef}
								className="input"
								placeholder="Message AI..."
								value={inputMessage}
								onChange={(e) => setInputMessage(e.target.value)}
								onKeyPress={handleKeyPress}
								rows={1}
								disabled={isLoading}
							/>

							<button 
								className="send"
								onClick={() => handleSendMessage()}
								disabled={isLoading || !inputMessage.trim()}
							>
								{isLoading ? '...' : '→'}
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AIAssistantPage;
