import React from 'react';
import { AppBar, Toolbar, Typography, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const drawerWidth = 220; // Make sure this matches your Sidebar

export default function Header() {
  const navigate = useNavigate();
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const username = localStorage.getItem('username') || 'User';

  return (
    <AppBar
      position="fixed"
      color="default"
      elevation={1}
      sx={{
        width: `calc(100% - ${drawerWidth}px)`,
        ml: `${drawerWidth}px`
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', mt: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{
            width: 32, height: 32, borderRadius: '50%',
            bgcolor: 'primary.main', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
          }}>
            {username.charAt(0).toUpperCase()}
          </Box>
          <Typography variant="body1">{username}</Typography>
          <Typography variant="body2" color="text.secondary">
            {currentDate} | 16:35 | 19°C
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>AIA</Typography>
          <Button
            variant="outlined"
            color="error"
            onClick={() => {
              localStorage.removeItem('username');
              navigate('/login');
            }}
          >
            Log out
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}