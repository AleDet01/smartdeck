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
const [aiModel, setAiModel] = useState('gpt-4o');
const [conversationContext, setConversationContext] = useState([]);

const messagesEndRef = useRef(null);
const textareaRef = useRef(null);
const navigate = useNavigate();

const scrollToBottom = () => {
messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
};

useEffect(() => {
if (messages.length > 0) {
scrollToBottom();
}
}, [messages]);

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
'Biologia: Corpo umano'
];

const handleSendMessage = async (text = inputMessage) => {
if (!text || text.trim().length === 0 || isLoading) return;

const userMessage = {
role: 'user',
content: text.trim(),
timestamp: new Date()
};

setMessages(prev => [...prev, userMessage]);
const newContext = [...conversationContext, { role: 'user', content: text.trim() }];
setConversationContext(newContext);
setInputMessage('');
setIsLoading(true);
setShowQuickActions(false);

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
const res = await fetch(\\/ai-assistant/stream\, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
credentials: 'include',
body: JSON.stringify({ 
prompt: text.trim(),
model: aiModel,
conversationHistory: newContext.slice(-10)
})
});

if (res.status === 401) {
window.location.href = '/#/';
return;
}

if (!res.ok) {
throw new Error(\HTTP error! status: \\);
}

const reader = res.body.getReader();
const decoder = new TextDecoder();
let streamedContent = '';
let testData = null;

while (true) {
const { value, done } = await reader.read();
if (done) break;

const chunk = decoder.decode(value, { stream: true });
const lines = chunk.split('\\n');

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

setMessages(prev => prev.map(msg => 
msg.id === assistantMessageId 
? { 
...msg, 
isStreaming: false,
testGenerated: !!testData,
testArea: testData?.thematicArea
}
: msg
));

setConversationContext(prev => [...prev, { role: 'assistant', content: streamedContent }]);

} catch (err) {
console.error('Error:', err);
setMessages(prev => prev.map(msg => 
msg.id === assistantMessageId 
? {
...msg,
content: \Error: \\,
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

const clearChat = () => {
if (window.confirm('Clear chat history?')) {
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

setMessages(prev => prev.slice(0, messageIndex));
setConversationContext(prev => prev.slice(0, messageIndex));

handleSendMessage(userMsg.content);
};

return (
<div className="ai-assistant-page">
<PageBackground />
<LEDEffect variant="floating" color="purple" />
<Topbar />
<div className="ai-container">
<div className="ai-header">
<h1>AI Assistant</h1>
<button 
className="clear-btn"
onClick={clearChat}
disabled={messages.length === 0}
>
Clear
</button>
</div>

<div className="chat-container">
<div className="messages-area">
{messages.map((msg, idx) => (
<div key={idx} className={\message \ \\}>
<div className="message-content">
{msg.content}
{msg.isStreaming && <span className="cursor">|</span>}
</div>

{msg.role === 'assistant' && !msg.isStreaming && (
<div className="message-actions">
<button onClick={() => copyMessage(msg.content)}>
Copy
</button>
<button onClick={() => regenerateResponse(idx)}>
Regenerate
</button>
</div>
)}

{msg.testGenerated && (
<button 
className="test-btn"
onClick={() => navigate('/dashboard')}
>
View Test
</button>
)}
</div>
))}
{isLoading && (
<div className="message assistant">
<div className="typing">
<span></span>
<span></span>
<span></span>
</div>
</div>
)}
<div ref={messagesEndRef} />
</div>

{showQuickActions && messages.length === 0 && (
<div className="suggestions">
{quickPrompts.map((prompt, idx) => (
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
placeholder="Message AI..."
value={inputMessage}
onChange={(e) => setInputMessage(e.target.value)}
onKeyPress={handleKeyPress}
rows={1}
disabled={isLoading}
/>

<button 
className="send-btn"
onClick={() => handleSendMessage()}
disabled={isLoading || !inputMessage.trim()}
>
{isLoading ? '...' : ''}
</button>
</div>
</div>
</div>
</div>
);
};

export default AIAssistantPage;
