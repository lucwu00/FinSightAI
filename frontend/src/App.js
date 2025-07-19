import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import PolicyPage from './PolicyPage/PolicyPage';
import Import from './Import/Import'; 
import ImportSuccess from './Import/ImportSuccess';
import Dashboard from './Dashboard/Dashboard';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/policies" />} />
        <Route path="/policies" element={<PolicyPage />} />
        <Route path="/import" element={<Import />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/import/success" element={<ImportSuccess />} />
      </Routes>
    </Router>
  );
}

export default App;

