import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import PolicyPage from './PolicyPage/PolicyPage';
import Import from './Import/Import'; 
import ImportSuccess from './Import/ImportSuccess';
import Dashboard from './Dashboard/Dashboard';
import Login from './pages/login.jsx'
import UserManagement from './pages/userManagement.jsx'
import SignUp from './pages/signup.jsx'
import SettingsPage from './pages/settings.jsx'
import SettingsSidebarTest from './pages/testing.jsx' 
import AccountSettings from './arfan-components/accountSettings.jsx'
import DataPrivacyContent from './arfan-components/DataPrivacy.jsx'
import AccountBot from './arfan-components/accountbot.jsx'

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
        <Route path="/" element={<Login />} />
        <Route path="/SignUp" element={<SignUp />} />
        <Route path="/userManagement" element={<UserManagement />} />
        <Route path="/Login" element={<Login/>} />
        <Route path="/Settings" element={<SettingsPage/>} />
        <Route path="/settings-sidebar-test" element={<SettingsSidebarTest />} />
        <Route path="/settingstesting" element={<AccountSettings />} />
        <Route path="/DataPrivacy" element={<DataPrivacyContent />} />
        <Route path="/accountbottest" element={<AccountBot />} />

      </Routes>
    </Router>
  );
}

export default App;

