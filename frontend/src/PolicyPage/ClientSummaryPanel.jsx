import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import './ClientSummaryPanel.css';


export default function ClientSummaryPanel({ client, policies, apiBaseUrl }) {
  const [onepager, setOnepager] = useState('');
  const [onepagerLoading, setOnepagerLoading] = useState(false);
  const [onepagerError, setOnepagerError] = useState(false);

  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  const QUICK_QUESTIONS = useMemo(() => {
  const questions = [
    'Give me a one-line summary of this client\'s coverage.',
    'What critical illness coverage does this client have?',
    'Is this client under-insured for life coverage?',
  ];
  if (policies.some(p => new Date(p.endDate) < new Date())) {
    questions.push('Which policies have expired?');
  } else if (policies.some(p => {
    const end = new Date(p.endDate);
    const now = new Date();
    return end >= now && end <= new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  })) {
    questions.push('Which policies are expiring soon?');
  } else {
    questions.push('What gaps exist in this client\'s coverage?');
  }
  return questions;
}, [policies]);

  // Fetch one-pager when client changes
  useEffect(() => {
    if (!client?.clientId || policies.length === 0) return;
    setOnepagerLoading(true);
    setOnepagerError(false);
    setOnepager('');
    setChatHistory([]);

    axios
      .post(`${apiBaseUrl}/api/genai/client-onepager`, { client, policies })
      .then(res => setOnepager(res?.data?.onepager ?? ''))
      .catch(() => setOnepagerError(true))
      .finally(() => setOnepagerLoading(false));
  }, [client?.clientId, policies.length, apiBaseUrl]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const askQuestion = async (q) => {
    const text = (q || question).trim();
    if (!text) return;

    setQuestion('');
    setChatHistory(prev => [...prev, { role: 'advisor', text }]);
    setChatLoading(true);

    try {
      const res = await axios.post(`${apiBaseUrl}/api/genai/client-ask`, {
        client,
        policies,
        question: text,
      });
      const answer = res?.data?.answer ?? 'No answer returned.';
      setChatHistory(prev => [...prev, { role: 'ai', text: answer }]);
    } catch {
      setChatHistory(prev => [...prev, { role: 'ai', text: 'Could not get an answer. Please try again.', error: true }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (!client || !policies.length) return null;

  return (
    <div className="csp-panel">

      {/* ── One-pager ── */}
      <div className="csp-section">
        <div className="csp-section-header">
          <span className="csp-section-icon">📋</span>
          <h3 className="csp-section-title">AI Portfolio Summary</h3>
          <span className="csp-badge">One-pager</span>
        </div>

        {onepagerLoading && (
          <div className="csp-loading">
            <span className="csp-spinner" /> Generating portfolio summary…
          </div>
        )}
        {onepagerError && (
          <p className="csp-error">Could not generate summary. The coverage analysis above is still accurate.</p>
        )}
        {!onepagerLoading && !onepagerError && onepager && (
          <div className="csp-onepager">
            {onepager.split('\n').filter(Boolean).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        )}
      </div>

      {/* ── Ask AI ── */}
      <div className="csp-section csp-chat-section">
        <div className="csp-section-header">
          <span className="csp-section-icon">💬</span>
          <h3 className="csp-section-title">Ask AI about {client.fullName}</h3>
        </div>

        {/* Quick questions */}
        <div className="csp-quick-questions">
          {QUICK_QUESTIONS.map((q, i) => (
            <button
              key={i}
              className="csp-quick-btn"
              onClick={() => askQuestion(q)}
              disabled={chatLoading}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat history */}
        {chatHistory.length > 0 && (
          <div className="csp-chat-history">
            {chatHistory.map((msg, i) => (
              <div key={i} className={`csp-msg csp-msg-${msg.role} ${msg.error ? 'csp-msg-error' : ''}`}>
                <span className="csp-msg-label">
                  {msg.role === 'advisor' ? '👤 Advisor' : '🤖 AI'}
                </span>
                <p className="csp-msg-text">{msg.text}</p>
              </div>
            ))}
            {chatLoading && (
              <div className="csp-msg csp-msg-ai">
                <span className="csp-msg-label">🤖 AI</span>
                <p className="csp-msg-text csp-typing">
                  <span className="csp-spinner" /> Thinking…
                </p>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}

        {/* Input */}
        <div className="csp-input-row">
          <input
            className="csp-input"
            type="text"
            placeholder="e.g. Is this client covered for disability?"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !chatLoading && askQuestion()}
            disabled={chatLoading}
          />
          <button
            className="csp-send-btn"
            onClick={() => askQuestion()}
            disabled={chatLoading || !question.trim()}
          >
            Ask
          </button>
        </div>
      </div>

    </div>
  );
}