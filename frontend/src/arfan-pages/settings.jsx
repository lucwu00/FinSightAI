import React, { useState } from 'react';
import SettingsSidebar from '../arfan-components/settingsSidebar';
import AccountSettings from '../arfan-components/accountSettings';
import DataPrivacyContent from '../arfan-components/DataPrivacy';
import { Box, Container, Typography } from '@mui/material';

export default function SettingsPage() {
  const [selectedSection, setSelectedSection] = useState('Personal Information');

  const renderContent = () => {
    // Check if any Data & Privacy section is selected
    const dataPrivacySections = ['Data Exportation', 'Privacy Controls', 'Data Deletion', 'Data & Privacy'];
    if (dataPrivacySections.includes(selectedSection)) {
      return <DataPrivacyContent />;
    }
    
    // For all other sections, show AccountSettings
    return <AccountSettings selectedSection={selectedSection} onSectionChange={setSelectedSection} />;
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3, px: 3 }}>
      <Box sx={{ 
        display: 'flex', 
        gap: 2.5, 
        minHeight: 'calc(100vh - 140px)',
        bgcolor: '#f8f9fa',
        borderRadius: 2,
        p: 3,
        border: '1px solid #e9ecef',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <Box sx={{ 
          width: 280, 
          flexShrink: 0,
          bgcolor: 'white',
          borderRadius: 2,
          p: 2,
          border: '1px solid #e9ecef',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          height: 'fit-content'
        }}>
          <SettingsSidebar 
            selectedSection={selectedSection}
            onSectionChange={setSelectedSection}
          />
        </Box>
        <Box sx={{ 
          flex: 1,
          bgcolor: 'white',
          borderRadius: 2,
          border: '1px solid #e9ecef',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          {renderContent()}
        </Box>
      </Box>
    </Container>
  );
}