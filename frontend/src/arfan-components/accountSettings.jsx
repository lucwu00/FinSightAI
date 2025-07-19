import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Divider,
  Avatar,
  TextField,
  IconButton,
  InputAdornment,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListSubheader,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';
import DataPrivacyContent from './DataPrivacy';

export default function AccountSettings() {
  const [showPassword, setShowPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState('Personal Information');
  const [formData, setFormData] = useState({
    username: localStorage.getItem('username') || '',
    email: localStorage.getItem('email') || '',
    password: '',
    phone: localStorage.getItem('phone') || '+65 9058 2443'
  });
  const [mainContent, setMainContent] = useState('settings'); // 'settings' or 'dataprivacy'
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const email = localStorage.getItem('email');
    if (!email) return;
    fetch(`/api/users/me?email=${encodeURIComponent(email)}`)
      .then(res => res.json())
      .then(user => {
        setFormData({
          username: user.username || '',
          email: user.email || '',
          password: '', // Don't display password!
          phone: localStorage.getItem('phone') || '+65 9058 2443'
        });
      })
      .catch(() => {
        setFormData({
          username: '',
          email: '',
          password: '',
          phone: localStorage.getItem('phone') || '+65 9058 2443'
        });
      });
  }, []);

  const settingsMenuItems = [
    { title: 'My Account', items: ['Personal Information', 'Client Information', 'Account Security'] },
    { title: 'Data & Privacy', items: ['Data Exportation', 'Privacy Controls', 'Data Deletion'] },
    { title: 'Notifications', items: ['Meeting Alerts', 'Policy Alerts'] }
  ];

  const getInitials = (name) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]?.toUpperCase()).join('');
  };

  const renderSettingsMenu = () => (
    <Paper elevation={1} sx={{ width: 280, p: 2, borderRadius: 2, height: 'fit-content' }}>
      <Typography variant="h6" fontWeight={700} mb={2} sx={{ color: 'black' }}>User Settings</Typography>
      <List subheader={<li />} sx={{ width: '100%', bgcolor: 'inherit' }}>
        {settingsMenuItems.map((section) => (
          <li key={section.title}>
            <ul style={{ padding: 0 }}>
              <ListSubheader
                sx={{
                  bgcolor: 'inherit',
                  color: 'black', 
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
                    onClick={() => {
                      setSelectedSection(item);
                      if (
                        item === 'Privacy Controls' ||
                        item === 'Data Exportation' ||
                        item === 'Data Deletion'
                      ) {
                        setMainContent('dataprivacy');
                      } else {
                        setMainContent('settings');
                      }
                    }}
                  >
                    <ListItemText
                      primary={item}
                      primaryTypographyProps={{
                        color: 'black',
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
        onClick={() => {
          localStorage.clear();
          navigate('/Login');
        }}
      >
        Log Out
      </Button>
    </Paper>
  );

  const handleEditUsernameClick = () => {
    setNewUsername(formData.username);
    setEditDialogOpen(true);
  };

  const handleDialogClose = () => {
    setEditDialogOpen(false);
  };

  const handleUsernameSave = async () => {
    // Update in DB
    try {
      const email = formData.email;
      const res = await fetch('/api/users/update-username', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username: newUsername })
      });
      if (res.ok) {
        setFormData(prev => ({ ...prev, username: newUsername }));
        localStorage.setItem('username', newUsername);
        setEditDialogOpen(false);
      } else {
        alert('Failed to update username');
      }
    } catch (err) {
      alert('Error updating username');
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 3, width: '100%' }}>
      {renderSettingsMenu()}
      <Box sx={{ flex: 1 }}>
        {mainContent === 'dataprivacy' ? (
          <DataPrivacyContent />
        ) : (
          <div>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 4 }}>
              <TextField
                variant="outlined"
                size="small"
                placeholder="Search Settings"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2, width: 250 }
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 4, mt: -9 }}>
              <Paper elevation={2} sx={{ flex: 2, borderRadius: 3, p: 3, bgcolor: 'linear-gradient(135deg, #fce4ec, #f8bbd9)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar sx={{ width: 60, height: 60, bgcolor: 'secondary.main', fontSize: 24, fontWeight: 600, mr: 2 }}>
                    {getInitials(formData.username)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight={600}>{formData.username || 'User'}</Typography>
                    <Button
                      variant="contained"
                      sx={{ bgcolor: '#ffeb3b', color: '#333', fontWeight: 500, fontSize: 12, borderRadius: 1, mt: 1, '&:hover': { bgcolor: '#fff176' } }}
                    >
                      Edit Profile Picture
                    </Button>
                  </Box>
                </Box>

                <Divider sx={{ mb: 2 }} />

                {['Username', 'Email', 'Password', 'Phone Number'].map((label, idx) => {
                  const keys = ['username', 'email', 'password', 'phone'];
                  const value = formData[keys[idx]];
                  return (
                    <Box sx={{ mb: 2 }} key={label}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography fontWeight={600} fontSize={14}>{label}</Typography>
                        <IconButton
                          size="small"
                          sx={{ bgcolor: '#ffeb3b', '&:hover': { bgcolor: '#fff176' } }}
                          onClick={label === 'Username' ? handleEditUsernameClick : undefined}
                        >
                          {label === 'Password'
                            ? <span onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                              </span>
                            : <EditIcon fontSize="small" sx={{ color: '#333' }} />}
                        </IconButton>
                      </Box>
                      <Typography fontSize={14} color="text.secondary">
                        {label === 'Password' && !showPassword && value ? '*'.repeat(value.length) : value || '-'}
                      </Typography>
                    </Box>
                  );
                })}

                <Divider sx={{ my: 2 }} />
                <Box sx={{ mb: 2 }}>
                  <Typography fontWeight={600} fontSize={14}>Account Created</Typography>
                  <Typography fontSize={14} color="text.secondary">12/5/2025</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography fontWeight={600} fontSize={14}>Date Of Birth</Typography>
                  <Typography fontSize={14} color="text.secondary">2/11/2005</Typography>
                </Box>
                <Box>
                  <Typography fontWeight={600} fontSize={14}>Country & Timezone</Typography>
                  <Typography fontSize={14} color="text.secondary">Singapore, GMT+8</Typography>
                </Box>
              </Paper>

              <Paper elevation={2} sx={{ mt: 10, flex: 1, borderRadius: 3, p: 3, bgcolor: '#f5f5f5', textAlign: 'center', height: 'fit-content' }}>
                <Typography variant="h2" fontWeight={900} color="text.primary" sx={{ mb: 2, letterSpacing: -2 }}>AIA</Typography>
                <Box sx={{ textAlign: 'left' }}>
                  <Typography fontWeight={600} fontSize={14} mb={1}>Tip:</Typography>
                  <Typography fontSize={13} color="text.secondary" mb={1}>
                    Use a strong password with a mix of letters, numbers and special characters
                  </Typography>
                  <Typography fontSize={13} color="text.secondary">
                    Keep your contact information updated to avoid missing policy alerts
                  </Typography>
                </Box>
              </Paper>
            </Box>
          </div>
        )}
      </Box>

      <Dialog open={editDialogOpen} onClose={handleDialogClose}>
        <DialogTitle>Edit Username</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="New Username"
            type="text"
            fullWidth
            value={newUsername}
            onChange={e => setNewUsername(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleUsernameSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
