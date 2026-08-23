import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Divider,
  Avatar,
  TextField,
  IconButton,
  InputAdornment,
  Paper
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

export default function AccountMainContent() {
  const [selectedSection] = useState('Personal Information');
  const [showPassword, setShowPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData] = useState({
    username: 'Cheryl Lim',
    email: 'ch****@gmail.com',
    password: '**********',
    phone: '+65 9058 2443'
  });

  return (
    <Box sx={{ width: '100%', p: 4, bgcolor: '#fafafa', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight={700}>
          {selectedSection}
        </Typography>
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
      
      <Box sx={{ display: 'flex', gap: 4 }}>
        <Paper elevation={2} sx={{ flex: 2, borderRadius: 3, p: 3, bgcolor: 'linear-gradient(135deg, #fce4ec, #f8bbd9)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ width: 60, height: 60, bgcolor: 'secondary.main', fontSize: 24, fontWeight: 600, mr: 2 }}>
              CL
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={600}>Cheryl Lim</Typography>
              <Button
                variant="contained"
                sx={{
                  bgcolor: '#ffeb3b',
                  color: '#333',
                  fontWeight: 500,
                  fontSize: 12,
                  borderRadius: 1,
                  mt: 1,
                  '&:hover': { bgcolor: '#fff176' }
                }}
              >
                Edit Profile Picture
              </Button>
            </Box>
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          {/* Username */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography fontWeight={600} fontSize={14}>Username</Typography>
              <IconButton size="small" sx={{ bgcolor: '#ffeb3b', '&:hover': { bgcolor: '#fff176' } }}>
                <EditIcon fontSize="small" sx={{ color: '#333' }} />
              </IconButton>
            </Box>
            <Typography fontSize={14} color="text.secondary">{formData.username}</Typography>
          </Box>
          
          {/* Email */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography fontWeight={600} fontSize={14}>Email</Typography>
              <IconButton size="small" sx={{ bgcolor: '#ffeb3b', '&:hover': { bgcolor: '#fff176' } }}>
                <EditIcon fontSize="small" sx={{ color: '#333' }} />
              </IconButton>
            </Box>
            <Typography fontSize={14} color="text.secondary">{formData.email}</Typography>
          </Box>
          
          {/* Password */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography fontWeight={600} fontSize={14}>Password</Typography>
              <IconButton size="small" sx={{ bgcolor: '#ffeb3b', '&:hover': { bgcolor: '#fff176' } }}>
                <EditIcon fontSize="small" sx={{ color: '#333' }} />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography fontSize={14} color="text.secondary">
                {showPassword ? 'MyPassword123' : '**********'}
              </Typography>
              <IconButton
                size="small"
                onClick={() => setShowPassword(!showPassword)}
                sx={{ ml: 1 }}
              >
                {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </IconButton>
            </Box>
          </Box>
          
          {/* Phone */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography fontWeight={600} fontSize={14}>Phone Number</Typography>
              <IconButton size="small" sx={{ bgcolor: '#ffeb3b', '&:hover': { bgcolor: '#fff176' } }}>
                <EditIcon fontSize="small" sx={{ color: '#333' }} />
              </IconButton>
            </Box>
            <Typography fontSize={14} color="text.secondary">{formData.phone}</Typography>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          {/* Account Info */}
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
        
        <Paper elevation={2} sx={{ flex: 1, borderRadius: 3, p: 3, bgcolor: '#f5f5f5', textAlign: 'center', height: 'fit-content' }}>
          <Typography variant="h2" fontWeight={900} color="text.primary" sx={{ mb: 2, letterSpacing: -2 }}>
            AIA
          </Typography>
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
    </Box>
  );
}