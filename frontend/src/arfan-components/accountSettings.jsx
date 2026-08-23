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

export default function AccountSettings({ selectedSection = 'Personal Information', onSectionChange }) {
  const [showPassword, setShowPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    username: localStorage.getItem('username') || '',
    email: localStorage.getItem('email') || '',
    password: '',
    phone: localStorage.getItem('phone') || '+65 9058 2443',
    profilePicture: localStorage.getItem('profilePicture') || ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const email = localStorage.getItem('email');
    if (!email) return;

    // Fetch user data
    fetch(`/api/users/me?email=${encodeURIComponent(email)}`)
      .then(res => res.json())
      .then(async (user) => {
        // Fetch profile picture
        const pictureRes = await fetch(`/api/profile/get-picture?email=${encodeURIComponent(email)}`);
        const pictureData = await pictureRes.json();
        
        setFormData({
          username: user.username || '',
          email: user.email || '',
          password: '', // Don't display password!
          phone: localStorage.getItem('phone') || '+65 9058 2443',
          profilePicture: pictureData.profilePicture || ''
        });

        // Update localStorage with the profile picture
        if (pictureData.profilePicture) {
          localStorage.setItem('profilePicture', pictureData.profilePicture);
          // Force header update
          window.dispatchEvent(new Event('storage'));
        }
      })
      .catch(() => {
        setFormData({
          username: '',
          email: '',
          password: '',
          phone: localStorage.getItem('phone') || '+65 9058 2443',
          profilePicture: ''
        });
      });
  }, []);

  const getInitials = (name) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]?.toUpperCase()).join('');
  };

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

  const renderContent = () => {
    switch (selectedSection) {
      case 'Personal Information':
      case 'Client Information':
      case 'Account Security':
        return (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'stretch', minHeight: 'calc(100vh - 260px)' }}>
              {/* Main Profile Card */}
              <Paper 
                elevation={0} 
                sx={{ 
                  flex: 2, 
                  borderRadius: 2, 
                  p: 3,
                  border: '1px solid #e9ecef',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%'
                }}
              >
                {/* Profile Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, pb: 2.5, borderBottom: '1px solid #f0f0f0' }}>
                  <Box sx={{ position: 'relative', mr: 2.5 }}>
                    <Avatar 
                      src={formData.profilePicture}
                      sx={{ 
                        width: 70, 
                        height: 70, 
                        bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        fontSize: 24, 
                        fontWeight: 600,
                        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                      }}
                    >
                      {getInitials(formData.username)}
                    </Avatar>
                    <input
                      type="file"
                      id="profile-picture-input"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = async () => {
                            const base64Image = reader.result;
                            try {
                              const email = localStorage.getItem('email');
                              console.log('Sending update request for email:', email);
                              
                              const response = await fetch('/api/profile/update-picture', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  email: email,
                                  profilePicture: base64Image
                                }),
                              });
                              
                              if (!response.ok) {
                                const errorData = await response.json();
                                console.error('Server error:', errorData);
                                throw new Error(errorData.error || 'Failed to update profile picture');
                              }
                              
                              const result = await response.json();
                              console.log('Server response:', result);
                              
                              // Update local state and storage
                              setFormData(prev => ({ ...prev, profilePicture: base64Image }));
                              localStorage.setItem('profilePicture', base64Image);
                              // Force header update
                              window.dispatchEvent(new Event('storage'));
                            } catch (error) {
                              console.error('Error updating profile picture:', error);
                              alert('Failed to update profile picture');
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <IconButton
                      size="small"
                      component="label"
                      htmlFor="profile-picture-input"
                      sx={{ 
                        position: 'absolute',
                        bottom: -2,
                        right: -2,
                        bgcolor: '#ffffff',
                        border: '2px solid #f0f0f0',
                        width: 24,
                        height: 24,
                        '&:hover': { 
                          bgcolor: '#f8f9fa',
                          transform: 'scale(1.05)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <EditIcon fontSize="small" sx={{ color: '#666', fontSize: 14 }} />
                    </IconButton>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" fontWeight={600} color="#1a1a1a" sx={{ mb: 0.5, fontSize: '1.3rem' }}>
                      {formData.username || 'User'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.9rem' }}>
                      Financial Advisor
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      component="label"
                      htmlFor="profile-picture-input"
                      sx={{ 
                        borderColor: '#e0e0e0',
                        color: '#666',
                        fontWeight: 500,
                        fontSize: 12,
                        borderRadius: 2,
                        textTransform: 'none',
                        px: 2,
                        py: 0.5,
                        '&:hover': { 
                          borderColor: '#d0d0d0',
                          bgcolor: '#f8f9fa'
                        }
                      }}
                    >
                      Change Profile Picture
                    </Button>
                  </Box>
                </Box>

                {/* Information Fields */}
                <Box sx={{ display: 'grid', gap: 2.5, flex: 1 }}>
                  {[
                    { label: 'Username', key: 'username', icon: '👤' },
                    { label: 'Email Address', key: 'email', icon: '📧' },
                    { label: 'Password', key: 'password', icon: '🔒' },
                  ].map((field) => {
                    const value = formData[field.key];
                    return (
                      <Box 
                        key={field.label}
                        sx={{ 
                          p: 2.5,
                          borderRadius: 3,
                          bgcolor: 'rgba(255,255,255,0.7)',
                          border: '1px solid #f0f0f0',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: '#e0e0e0',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.8 }}>
                              <Typography sx={{ fontSize: 15, mr: 1 }}>{field.icon}</Typography>
                              <Typography fontWeight={600} fontSize={14} color="#1a1a1a">
                                {field.label}
                              </Typography>
                            </Box>
                            <Typography 
                              fontSize={13} 
                              color="text.secondary"
                              sx={{ 
                                fontFamily: field.key === 'password' ? 'monospace' : 'inherit',
                                letterSpacing: field.key === 'password' ? 2 : 'normal'
                              }}
                            >
                              {field.key === 'password' && !showPassword && value 
                                ? '•'.repeat(8) 
                                : value || 'Not set'}
                            </Typography>
                          </Box>
                          <IconButton
                            size="small"
                            sx={{ 
                              bgcolor: 'rgba(102, 126, 234, 0.1)',
                              color: '#667eea',
                              width: 30,
                              height: 30,
                              '&:hover': { 
                                bgcolor: 'rgba(102, 126, 234, 0.2)',
                                transform: 'scale(1.05)'
                              },
                              transition: 'all 0.2s ease'
                            }}
                            onClick={field.label === 'Username' ? handleEditUsernameClick : 
                              field.label === 'Password' ? () => setShowPassword(!showPassword) : undefined}
                          >
                            {field.label === 'Password'
                              ? (showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />)
                              : <EditIcon fontSize="small" />}
                          </IconButton>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>

                {/* Additional Information */}
                <Box sx={{ mt: 3, pt: 2.5, borderTop: '1px solid #f0f0f0' }}>
                  <Typography variant="h6" fontWeight={600} color="#1a1a1a" sx={{ mb: 2.5, fontSize: '1.1rem' }}>
                    Account Details
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2.5 }}>
                    {[
                      { label: 'Account Created', value: '12/5/2025', icon: '📅' },
                      { label: 'Date of Birth', value: '2/11/2005', icon: '🎂' },
                      { label: 'Location', value: 'Singapore', icon: '🌏' },
                      { label: 'Timezone', value: 'GMT+8', icon: '🕐' }
                    ].map((item) => (
                      <Box 
                        key={item.label}
                        sx={{ 
                          p: 2,
                          borderRadius: 2,
                          bgcolor: 'rgba(255,255,255,0.5)',
                          border: '1px solid #f5f5f5'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Typography sx={{ fontSize: 13, mr: 0.8 }}>{item.icon}</Typography>
                          <Typography fontWeight={500} fontSize={12} color="text.secondary">
                            {item.label}
                          </Typography>
                        </Box>
                        <Typography fontWeight={600} fontSize={13} color="#1a1a1a">
                          {item.value}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Paper>

              {/* Sidebar */}
              
            </Box>
          </Box>
        );
      default:
        return (
          <Paper sx={{ p: 4, borderRadius: 2 }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
              {selectedSection}
            </Typography>
            <Typography color="text.secondary">
              Settings content for {selectedSection} coming soon...
            </Typography>
          </Paper>
        );
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {renderContent()}

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
