import React, { useState, useEffect } from 'react';
import { FaWandMagicSparkles } from 'react-icons/fa6';
import { NavLink } from 'react-router-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import './Layout.css';

function Layout({ children }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showAskBox, setShowAskBox] = useState(false);
  const [userQuestion, setUserQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [sidebarWidth, setSidebarWidth] = useState('220px');
  const [isResizing, setIsResizing] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const resize = (e) => {
      if (isResizing) {
        const newWidth = Math.max(160, e.clientX);
        setSidebarWidth(`${newWidth}px`);
      }
    };
    const stopResizing = () => setIsResizing(false);

    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing]);

  const startResizing = () => setIsResizing(true);

  const handleAsk = async () => {
    if (!userQuestion.trim()) return;
    try {
      const res = await fetch('http://localhost:5050/api/policies/summary/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userQuestion }),
      });
      const data = await res.json();
      setAiAnswer(data.summary || 'No answer found.');
    } catch (err) {
      console.error(err);
      setAiAnswer('Something went wrong. Please try again.');
    }
  };

  const formatDate = (date) =>
    date.toLocaleDateString('en-SG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const formatTime = (date) =>
    date.toLocaleTimeString('en-SG', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

  return (
    <div className="policy-container">
      <aside className="policy-sidebar" style={{ width: sidebarWidth }}>
        <div className="sidebar-buttons">
        <NavLink to="/dashboard" className={({ isActive }) => `sidebar-button ${isActive ? 'active' : ''}`}>
  📋 Dashboard
</NavLink>
          <button className="sidebar-button">👤 Clients</button>
          <NavLink to="/policies" className={({ isActive }) => `sidebar-button ${isActive ? 'active' : ''}`}>🧾 Policies</NavLink>
          <NavLink to="/import" className={({ isActive }) => `sidebar-button ${isActive ? 'active' : ''}`}>🧑‍💼 Import</NavLink>
          <button className="sidebar-button">🛒 Policy Store</button>
          <button className="sidebar-button">🗓 Schedule</button>
        </div>
        <div className="sidebar-footer">
          <p className="sidebar-support-title">Support</p>
          <button className="sidebar-button">⚙ Settings</button>
          <button className="sidebar-button">💬 Help</button>
        </div>
      </aside>

      <div className="resizer" onMouseDown={startResizing} />

      <main className="policy-main">
        <div className="top-bar">
          <div className="profile">
          <img src="/images/profile_image.jpg" alt="profile" className="profile-image" />
          <p className="profile-name">Cheryl Lim</p>
          </div>
          <div className="datetime">
            {formatDate(currentTime)} | {formatTime(currentTime)} | 29°C
          </div>
          <div className="top-bar-actions">
            <button>✏️</button>
            <button>🚪 Log out</button>
          </div>
        </div>

        {children}

        <button onClick={() => setShowAskBox(prev => !prev)} className="genai-button">
          <FaWandMagicSparkles className="genai-icon" />
        </button>

        {showAskBox && (
          <div className="ask-box">
            <input
              type="text"
              value={userQuestion}
              onChange={(e) => setUserQuestion(e.target.value)}
              placeholder="e.g. What policy types are most common?"
            />
            <button onClick={handleAsk}>Ask</button>
            {aiAnswer && (
              <div className="ai-answer-box">
                <p className="ai-answer-title">✨ AI Summary:</p>
                {aiAnswer.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default Layout;
