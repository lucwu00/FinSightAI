import React from 'react';

// Header component now receives props for user name, theme, and their respective handlers
export default function Header({ currentName, setCurrentName }) {
  const names = ['Cheryl Lim'];

  // State for dropdown visibility, managed internally as it's purely UI for Header
  const [showDropdown, setShowDropdown] = React.useState(false);

  // Real-time Date and Time logic - can remain here or be a separate component if reused elsewhere
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const date = now.toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });
  const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return (
    <header style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "2rem",
      padding: "0 2rem",
      background: "#fff",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      borderRadius: "16px",
      minHeight: "64px",
      transition: "background 0.3s, box-shadow 0.3s"
    }}>
      <div className="user-info" style={{ display: "flex", alignItems: "center", gap: "0.75rem", position: "relative" }}>
        <select
          value={currentName}
          onChange={e => setCurrentName(e.target.value)}
          style={{ fontWeight: 600, fontSize: "1.1rem", color: "#222", padding: "4px 8px", outline: "none", boxShadow: "none", border: "none", background: "#fff" }}
        >
          {names.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div className="datetime" style={{ fontSize: "1rem", color: "#222", letterSpacing: "0.5px" }}>
          {date} | {time}
        </div>
      </div>
    </header>
  );
}