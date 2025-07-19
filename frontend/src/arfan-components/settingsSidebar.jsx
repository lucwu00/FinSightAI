import React, { useState } from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListSubheader,
  Button
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';

const settingsMenuItems = [
  { title: 'My Account', items: ['Personal Information', 'Client Information', 'Account Security'] },
  { title: 'Data & Privacy', items: ['Data Exportation', 'Privacy Controls', 'Data Deletion'] },
  { title: 'Notifications', items: ['Meeting Alerts', 'Policy Alerts'] }
];

export default function SettingsSidebar() {
  const [selectedSection, setSelectedSection] = useState('Personal Information');

  const isSectionActive = (sectionTitle) => {
    return selectedSection === sectionTitle ||
      settingsMenuItems.find(section => section.title === sectionTitle)?.items.includes(selectedSection);
  };

  return (
    <Paper elevation={1} sx={{ width: 200, p: 2, borderRadius: 2, minHeight: '10vh' }}>
      <Typography variant="h6" fontWeight={700} mb={2}>
        User Settings
      </Typography>
      <List subheader={<li />} sx={{ width: '100%', bgcolor: 'inherit' }}>
        {settingsMenuItems.map((section) => (
          <li key={section.title}>
            <ul style={{ padding: 0 }}>
              <ListSubheader
                sx={{
                  bgcolor: 'inherit',
                  color: selectedSection === section.title ? 'primary.main' : 'text.primary',
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedSection(section.title)}
              >
                {section.title}
              </ListSubheader>
              {section.items.map((item) => (
                <ListItem key={item} disablePadding>
                  <ListItemButton
                    selected={selectedSection === item}
                    onClick={() => setSelectedSection(item)}
                  >
                    <ListItemText
                      primary={item}
                      primaryTypographyProps={{
                        color: selectedSection === item ? 'primary' : 'text.secondary',
                        fontWeight: selectedSection === item ? 600 : 400,
                        fontSize: 14
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </ul>
          </li>
        ))}
      </List>
      <Button
        startIcon={<LogoutIcon />}
        color="error"
        sx={{ mt: 2, fontWeight: 500 }}
        fullWidth
      >
        Log Out
      </Button>
    </Paper>
  );
}
