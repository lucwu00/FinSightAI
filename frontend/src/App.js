import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import PolicyPage from './PolicyPage/PolicyPage';
import Import from './Import/Import'; 
import ImportSuccess from './Import/ImportSuccess';
import Dashboard from './Dashboard/Dashboard';
import Login from './arfan-pages/login.jsx'
import UserManagement from './arfan-pages/userManagement.jsx'
import SignUp from './arfan-pages/signup.jsx'
import SettingsPage from './arfan-pages/settings.jsx'
import SettingsSidebarTest from './arfan-pages/testing.jsx' 
import AccountSettings from './arfan-components/accountSettings.jsx'
import DataPrivacyContent from './arfan-components/DataPrivacy.jsx'
import AccountBot from './arfan-components/accountbot.jsx'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/policies" element={<PolicyPage />} />
        <Route path="/import" element={<Import />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/import/success" element={<ImportSuccess />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/userManagement" element={<UserManagement />} />
        <Route path="/settings" element={<SettingsPage/>} />
        <Route path="/settings-sidebar-test" element={<SettingsSidebarTest />} />
        <Route path="/settingstesting" element={<AccountSettings />} />
        <Route path="/dataprivacy" element={<DataPrivacyContent />} />
        <Route path="/accountbottest" element={<AccountBot />} />
      </Routes>
    </Router>
  );
}

export default App;

