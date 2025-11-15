import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import PageBackground from '../components/PageBackground';
import LEDEffect from '../components/LEDEffect';
import '../css/AIAssistantPage.css';
import API_HOST from '../utils/apiHost';

const MODES = {
	CHAT: 'chat',
	TEST: 'test'
};

const quickPrompts = {
	[MODES.CHAT]: [
		'Spiega il DNA in modo semplice',
		'Riassumi il Romanticismo italiano',
		'Come funziona l\'energia solare?',
		'Dammi un esempio pratico di derivate'
	],
	[MODES.TEST]: [
		'Genera 8 domande miste sulla Rivoluzione francese',
		'Quiz di matematica: equazioni di secondo grado (10 domande)',
		'Creo un test facile di biologia sul sistema nervoso',
		'Flashcard su informatica: sicurezza delle reti'
	]
};

const modeMeta = {
	[MODES.CHAT]: {
		label: 'Chat',
		description: 'Fai domande rapide, ottieni spiegazioni e suggerimenti istantanei.'
	},
	[MODES.TEST]: {
		label: 'Genera Test',
		description: 'Descrivi un argomento: creo automaticamente flashcard salvate nella Dashboard.'
	}
};

const placeholderByMode = {
	[MODES.CHAT]: 'Scrivi un messaggio o una domanda... (Invio per inviare)',
	[MODES.TEST]: 'Descrivi l\'argomento del test, livello e numero di domande...'
};

const createMessageId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const AIAssistantPage = () => {
	const [mode, setMode] = useState(MODES.CHAT);
	const [messagesByMode, setMessagesByMode] = useState({
		[MODES.CHAT]: [],
		[MODES.TEST]: []
	});
	const [drafts, setDrafts] = useState({
		[MODES.CHAT]: '',
		[MODES.TEST]: ''
	});
	const [isLoading, setIsLoading] = useState(false);
	const [aiModel, setAiModel] = useState('gpt-4o');

	const messagesEndRef = useRef(null);
	const textareaRef = useRef(null);
	const navigate = useNavigate();

	const inputMessage = drafts[mode];
	const currentMessages = messagesByMode[mode];
	const isTestMode = mode === MODES.TEST;

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	useEffect(() => {
		if (currentMessages.length > 0) {
			scrollToBottom();
		}
	}, [currentMessages, mode]);

	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto';
			textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
		}
	}, [inputMessage, mode]);

	const updateMessagesForMode = (targetMode, updater) => {
		setMessagesByMode(prev => ({
			...prev,
			[targetMode]: updater(prev[targetMode] || [])
		}));
	};

	const buildConversationHistory = (targetMode, extraEntries = []) => {
		const base = messagesByMode[targetMode] || [];
		const compact = base
			.filter(msg => msg.role === 'user' || msg.role === 'assistant')
			.map(msg => ({ role: msg.role, content: msg.content }));
		return [...compact, ...extraEntries].slice(-10);
	};

	const handleSendMessage = async (text = inputMessage, targetMode = mode) => {
		const trimmed = (text || '').trim();
		if (!trimmed || isLoading) return;

		const userMessage = {
			id: createMessageId(),
			role: 'user',
			content: trimmed,
			timestamp: new Date()
		};

		updateMessagesForMode(targetMode, prev => [...prev, userMessage]);
		const newHistory = targetMode === MODES.CHAT
			? buildConversationHistory(targetMode, [{ role: 'user', content: trimmed }])
			: [{ role: 'user', content: trimmed }];

		setDrafts(prev => ({ ...prev, [targetMode]: '' }));
		setIsLoading(true);

		const assistantMessageId = createMessageId();
		const initialAssistantMessage = {
			id: assistantMessageId,
			role: 'assistant',
			content: '',
			timestamp: new Date(),
			isStreaming: true
		};
		updateMessagesForMode(targetMode, prev => [...prev, initialAssistantMessage]);

		try {
			const res = await fetch(`${API_HOST}/ai-assistant/stream`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					prompt: trimmed,
					model: aiModel,
					conversationHistory: targetMode === MODES.CHAT ? newHistory : [],
					mode: targetMode
				})
			});

			if (res.status === 401) {
				window.location.href = '/#/';
				return;
			}

			if (!res.ok) {
				throw new Error(`HTTP error! status: ${res.status}`);
			}

			const reader = res.body.getReader();
			const decoder = new TextDecoder();
			let streamedContent = '';
			let testData = null;

			while (true) {
				const { value, done } = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value, { stream: true });
				const lines = chunk.split('\n');

				for (const line of lines) {
					if (!line.startsWith('data: ')) continue;
					const data = line.slice(6);
					if (data === '[DONE]') continue;

					try {
						const parsed = JSON.parse(data);

						if (parsed.content) {
							streamedContent += parsed.content;
							updateMessagesForMode(targetMode, prev => prev.map(msg => 
								msg.id === assistantMessageId
									? { ...msg, content: streamedContent }
									: msg
							));
						}

						if (parsed.testGenerated) {
							testData = parsed.testData;
						}

						if (parsed.error) {
							throw new Error(parsed.error);
						}
					} catch (streamError) {
						console.warn('Parse error:', streamError);
					}
				}
			}

			updateMessagesForMode(targetMode, prev => prev.map(msg => 
				msg.id === assistantMessageId
					? {
						...msg,
						isStreaming: false,
						testGenerated: !!testData,
						testArea: testData?.thematicArea,
						testCount: testData?.questionCount
					}
					: msg
			));

		} catch (err) {
			console.error('❌ Errore AI:', err);
			updateMessagesForMode(targetMode, prev => prev.map(msg => 
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
		setDrafts(prev => ({ ...prev, [mode]: prompt }));
		handleSendMessage(prompt);
	};

	const clearChat = () => {
		if (window.confirm('Vuoi cancellare la cronologia di questa modalità?')) {
			updateMessagesForMode(mode, () => []);
			setDrafts(prev => ({ ...prev, [mode]: '' }));
		}
	};

	const copyMessage = (content) => {
		navigator.clipboard.writeText(content);
	};

	const regenerateResponse = (messageIndex) => {
		const modeMessages = messagesByMode[mode];
		if (!modeMessages || messageIndex < 1) return;
		const userMsg = modeMessages[messageIndex - 1];
		if (!userMsg || userMsg.role !== 'user') return;

		updateMessagesForMode(mode, prev => prev.slice(0, messageIndex));
		handleSendMessage(userMsg.content, mode);
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
							className="clear-btn"
							onClick={clearChat}
							disabled={currentMessages.length === 0 || isLoading}
						>
							Pulisci chat
						</button>
					</div>
				</div>

				<div className="mode-switch">
					{Object.values(MODES).map(key => (
						<button
							key={key}
							className={`mode-btn ${mode === key ? 'active' : ''}`}
							onClick={() => setMode(key)}
							disabled={isLoading && mode !== key}
						>
							{modeMeta[key].label}
						</button>
					))}
				</div>
				<p className="mode-description">{modeMeta[mode].description}</p>

				<div className="chat-container">
					<div className="messages-area">
						{currentMessages.map((msg, idx) => (
							<div key={msg.id || idx} className={`message ${msg.role} ${msg.isError ? 'error' : ''}`}>
								<div className="message-content">
									<div className="message-text">
										{msg.content}
										{msg.isStreaming && <span className="cursor">|</span>}
									</div>

									{msg.role === 'assistant' && !msg.isStreaming && (
										<div className="message-actions">
											<button className="action-btn" onClick={() => copyMessage(msg.content)}>Copia</button>
											<button className="action-btn" onClick={() => regenerateResponse(idx)}>Rigenera</button>
										</div>
									)}

									{msg.testGenerated && (
										<button 
											className="test-btn"
											onClick={() => navigate('/dashboard')}
										>
											Vai al test ({msg.testArea || 'Dashboard'})
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

					{currentMessages.length === 0 && (
						<div className="suggestions">
							{quickPrompts[mode].map((prompt, idx) => (
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

					<div className="input-area">
						<select 
							value={aiModel} 
							onChange={(e) => setAiModel(e.target.value)}
							disabled={isLoading}
						>
							<option value="gpt-4o">GPT-4o</option>
							<option value="gpt-4o-mini">GPT-4o Mini</option>
							<option value="o1-preview">O1 Preview</option>
						</select>

						<textarea
							ref={textareaRef}
							placeholder={placeholderByMode[mode]}
							value={inputMessage}
							onChange={(e) => setDrafts(prev => ({ ...prev, [mode]: e.target.value }))}
							onKeyPress={handleKeyPress}
							rows={1}
							disabled={isLoading}
						/>

						<button 
							className="send"
							onClick={() => handleSendMessage()}
							disabled={isLoading || !inputMessage.trim()}
						>
							{isLoading ? '...' : isTestMode ? 'Genera' : '→'}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AIAssistantPage;
