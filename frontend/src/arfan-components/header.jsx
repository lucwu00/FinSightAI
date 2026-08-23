import React from 'react';
import { AppBar, Toolbar, Typography, Box, Button, Avatar } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const drawerWidth = 220; // Make sure this matches your Sidebar
const collapsedWidth = 60; // Make sure this matches your Sidebar

export default function Header({ isCollapsed = false }) {
  const navigate = useNavigate();
  const [profilePicture, setProfilePicture] = React.useState(localStorage.getItem('profilePicture'));
  
  React.useEffect(() => {
    const handleStorageChange = () => {
      setProfilePicture(localStorage.getItem('profilePicture'));
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const username = localStorage.getItem('username') || 'User';

  return (
    <AppBar
      position="flex"
      color="default"
      elevation={1}
      sx={{
        width: '100vw',
        left: `${isCollapsed ? collapsedWidth : drawerWidth}px`,
        transition: 'left 0.3s ease'
      }}
    >
      <Toolbar sx={{ justifyContent: 'flex-start', px: 4, py: 1.5, minHeight: '64px', gap: 4 }}>
        <Avatar
          src={profilePicture}
          sx={{
            width: 40, 
            height: 40,
            bgcolor: 'primary.main',
            color: 'white',
            fontWeight: 'bold', 
            fontSize: '1.2rem'
          }}
        >
          {username.charAt(0).toUpperCase()}
        </Avatar>
        
        <Box sx={{ mr: 'auto' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2, mb: 0 }}>
            Welcome, {username}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'short', 
              day: 'numeric'
            })}
          </Typography>
        </Box>
        
        <Button
          variant="outlined"
          color="error"
          size="small"
          onClick={() => {
            localStorage.removeItem('username');
            navigate('/login');
          }}
          sx={{ 
            textTransform: 'none',
            fontWeight: 500,
            px: 3,
            py: 1,
            borderRadius: 2,
            ml: 2
          }}
        >
          Log out
        </Button>
      </Toolbar>
    </AppBar>
  );
}