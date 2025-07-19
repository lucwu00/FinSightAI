import React from 'react';
import Sidebar from '../components/sidebar';
import SettingsSidebar from '../components/settingsSidebar';
import { Box } from '@mui/material';

export default function SettingsPage() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#fafafa' }}>
      <Sidebar />
      <Box sx={{ flex: 1 }} /> {/* This pushes the settings sidebar to the right */}
      <SettingsSidebar />
    </Box>
  );
}