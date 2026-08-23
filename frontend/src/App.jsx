// App.jsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import PolicyPage from './PolicyPage/PolicyPage.jsx';
import PolicyStorePage from './PolicyStore/PolicyStorePage.jsx';
import Import from './Import/Import.jsx'; 
import ImportSuccess from './Import/ImportSuccess.jsx';
import Dashboard from './ken-pages/Dashboard.jsx';
import ClientProfile from './ken-pages/ClientProfile.jsx';
import Login from './arfan-pages/login.jsx';
import UserManagement from './arfan-pages/userManagement.jsx';
import SignUp from './arfan-pages/signup.jsx';
import SettingsPage from './arfan-pages/settings.jsx';
import SettingsSidebarTest from './arfan-pages/testing.jsx';
import AccountSettings from './arfan-components/accountSettings.jsx';
import DataPrivacyContent from './arfan-components/DataPrivacy.jsx';
import AccountBot from './arfan-components/accountbot.jsx';
import SchedulePage from './choon-pages/SchedulePage.jsx';
import Sidebar from './arfan-components/sidebar.jsx';
import Header from './arfan-components/header.jsx';
import ClientsPage from './arfan-pages/ClientsPage.jsx';
import HelpPage from './choon-pages/HelpPage.jsx';

// Admin-only route protection component
function AdminProtectedRoute({ children }) {
  const userStatus = localStorage.getItem('status') || 'User';
  
  if (userStatus !== 'Admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}


function LayoutWithSidebarAndHeader({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  
  // Get user status from localStorage or context
  const userStatus = localStorage.getItem('status') || 'User';
  const drawerWidth = 220;
  const collapsedWidth = 60;
  const location = useLocation();
  
  return (
    <div style={{ 
      height: '100vh',  
      overflow: 'hidden', 
      width: '100%' 
    }}>
      {/* Fixed Positioned Sidebar */}
      <Sidebar 
        isCollapsed={sidebarCollapsed} 
        setIsCollapsed={setSidebarCollapsed} 
        userStatus={userStatus}
      />
      
      {/* Main Content Container - full width, content goes behind sidebar */}
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100%',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <Header isCollapsed={sidebarCollapsed} />
        
        {/* Content Area */}
        {/* Content Area */}
<div
  style={{
    flex: 1,
    overflow: 'auto',
    paddingLeft: sidebarCollapsed ? `${collapsedWidth + 16}px` : `${drawerWidth + 16}px`,
    paddingRight: '16px',
    transition: 'padding-left 0.3s ease',
    boxSizing: 'border-box',
  }}
>
  {/* Force remount on path change */}
  <div key={location.pathname}>
    {children}
  </div>
</div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Routes without sidebar/header (login, signup) */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        
        {/* Routes with sidebar and header */}
        <Route path="/dashboard" element={<LayoutWithSidebarAndHeader><Dashboard /></LayoutWithSidebarAndHeader>} />
        <Route path="/userManagement" element={
          <AdminProtectedRoute>
            <LayoutWithSidebarAndHeader><UserManagement /></LayoutWithSidebarAndHeader>
          </AdminProtectedRoute>
        } />
        <Route path="/client" element={<LayoutWithSidebarAndHeader><ClientsPage /></LayoutWithSidebarAndHeader>} />
        <Route path="/client/:id" element={<LayoutWithSidebarAndHeader><ClientProfile /></LayoutWithSidebarAndHeader>} />
        <Route path="/policies" element={<LayoutWithSidebarAndHeader><PolicyPage /></LayoutWithSidebarAndHeader>} />
        <Route path="/import" element={<LayoutWithSidebarAndHeader><Import /></LayoutWithSidebarAndHeader>} />
        <Route path="/import/success" element={<LayoutWithSidebarAndHeader><ImportSuccess /></LayoutWithSidebarAndHeader>} />
        <Route path="/store" element={<LayoutWithSidebarAndHeader><PolicyStorePage /></LayoutWithSidebarAndHeader>} />
        <Route path="/settings" element={<LayoutWithSidebarAndHeader><SettingsPage /></LayoutWithSidebarAndHeader>} />
        <Route path="/help" element={<LayoutWithSidebarAndHeader><HelpPage /></LayoutWithSidebarAndHeader>} />
        <Route path="/schedule" element={<LayoutWithSidebarAndHeader><SchedulePage /></LayoutWithSidebarAndHeader>} />
        
        {/* Legacy/testing routes */}
        <Route path="/settings-sidebar-test" element={<LayoutWithSidebarAndHeader><SettingsSidebarTest /></LayoutWithSidebarAndHeader>} />
        <Route path="/settingstesting" element={<LayoutWithSidebarAndHeader><AccountSettings /></LayoutWithSidebarAndHeader>} />
        <Route path="/dataprivacy" element={<LayoutWithSidebarAndHeader><DataPrivacyContent /></LayoutWithSidebarAndHeader>} />
        <Route path="/accountbottest" element={<LayoutWithSidebarAndHeader><AccountBot /></LayoutWithSidebarAndHeader>} />
      </Routes>
    </Router>
  );
}

export default App;