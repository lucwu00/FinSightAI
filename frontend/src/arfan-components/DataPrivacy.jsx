import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Divider,
  Switch,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

export default function DataPrivacyContent() {
  const [allowEmailUpdates, setAllowEmailUpdates] = useState(false);
  const [hideEmailFromClient, setHideEmailFromClient] = useState(false);
  const [displayRoleOnProfile, setDisplayRoleOnProfile] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const currentUserEmail = localStorage.getItem('email');


  const handleDeleteAccount = async () => {
    if (!currentUserEmail) {
      alert('No user email found. Please log in again.');
      return;
    }

    setIsDeleting(true);
    
    try {
      console.log('Attempting to delete account for:', currentUserEmail);
      
      const res = await fetch(`/api/users/deleteByEmail?email=${encodeURIComponent(currentUserEmail)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Delete response status:', res.status);
      
      if (res.ok) {
        const result = await res.json();
        console.log('Delete successful:', result);
        
        // Clear all localStorage data
        localStorage.clear();
        
        // Show success message
        alert('Account deleted successfully. You will be redirected to the signup page.');
        
        // Navigate to signup page
        navigate('/SignUp');
      } else {
        const error = await res.json();
        console.error('Delete failed:', error);
        alert(`Failed to delete account: ${error.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error deleting account:', err);
      alert('Network error occurred while deleting account. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  // Fetch client data and export as Excel
  const handleExportData = async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      // Convert to worksheet
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Clients');
      XLSX.writeFile(wb, 'clients_data.xlsx');
    } catch (err) {
      alert('Failed to export data');
    }
    setExportDialogOpen(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper 
        elevation={0} 
        sx={{ 
          borderRadius: 2, 
          p: 3,
          border: '1px solid #e9ecef',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          minHeight: 'calc(100vh - 260px)'
        }}
      >
        {/* Data Exportation Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" fontWeight={600} mb={2} color="#1a1a1a" sx={{ fontSize: '1.1rem' }}>
            📤 Data Exportation
          </Typography>
          <Typography fontSize={14} color="text.secondary" mb={3} sx={{ lineHeight: 1.6 }}>
            Export your data to create backup files. You can download client data as an Excel file 
            for your records and safekeeping.
          </Typography>
          <Button
            variant="contained"
            sx={{
              bgcolor: '#667eea',
              color: 'white',
              fontWeight: 500,
              fontSize: 14,
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              py: 1,
              boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
              '&:hover': { 
                bgcolor: '#5a67d8',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
              }
            }}
            onClick={() => setExportDialogOpen(true)}
          >
            Export Client Data
          </Button>
        </Box>

        <Divider sx={{ my: 4, borderColor: '#e9ecef' }} />

      {/* Export Confirmation Dialog */}
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
        <DialogTitle>Export Client Data</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to export all client data as an Excel file?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleExportData} variant="contained">Yes, Export</Button>
        </DialogActions>
      </Dialog>

        {/* Privacy Controls Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" fontWeight={600} mb={3} color="#1a1a1a" sx={{ fontSize: '1.1rem' }}>
            🔒 Privacy Controls
          </Typography>
          
          {/* Alert Preferences */}
          <Box sx={{ 
            mb: 3, 
            p: 2.5,
            borderRadius: 2,
            bgcolor: 'rgba(255,255,255,0.7)',
            border: '1px solid #f0f0f0'
          }}>
            <Typography fontWeight={600} fontSize={15} mb={2} color="#1a1a1a">
              Alert Preferences
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography fontSize={14} color="text.secondary">
                Allow email updates about partner companies
              </Typography>
              <Switch
                checked={allowEmailUpdates}
                onChange={(e) => setAllowEmailUpdates(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#fff',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#667eea',
                  },
                  '& .MuiSwitch-track': {
                    backgroundColor: '#ccc',
                  }
                }}
              />
            </Box>
          </Box>

          <Box sx={{ 
            p: 2.5,
            borderRadius: 2,
            bgcolor: 'rgba(255,255,255,0.7)',
            border: '1px solid #f0f0f0'
          }}>
            <Typography fontWeight={600} fontSize={15} mb={2} color="#1a1a1a">
              Data Visibility
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography fontSize={14} color="text.secondary">
                Hide email from client profiles
              </Typography>
              <Switch
                checked={hideEmailFromClient}
                onChange={(e) => setHideEmailFromClient(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#fff',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#667eea',
                  },
                  '& .MuiSwitch-track': {
                    backgroundColor: '#ccc',
                  }
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography fontSize={14} color="text.secondary">
                Display my role on profile
              </Typography>
              <Switch
                checked={displayRoleOnProfile}
                onChange={(e) => setDisplayRoleOnProfile(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#fff',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#667eea',
                  },
                  '& .MuiSwitch-track': {
                    backgroundColor: '#ccc',
                  }
                }}
              />
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 4, borderColor: '#e9ecef' }} />

        {/* Data Deletion Section */}
        <Box>
          <Typography variant="h6" fontWeight={600} mb={3} color="#1a1a1a" sx={{ fontSize: '1.1rem' }}>
            🗑️ Data Deletion
          </Typography>
          
          <Box sx={{ 
            p: 2.5,
            borderRadius: 2,
            bgcolor: 'rgba(255,255,255,0.7)',
            border: '1px solid #f0f0f0'
          }}>
            <Typography fontWeight={600} fontSize={15} mb={2} color="#1a1a1a">
              Account Deletion
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1 }}>
                <Typography fontSize={14} fontWeight={500} mb={1} color="#1a1a1a">
                  Delete your account
                </Typography>
                <Typography fontSize={13} color="text.secondary">
                  Your data history will be retained for audit purposes
                </Typography>
              </Box>
              <Button
                variant="contained"
                color="error"
                disabled={isDeleting}
                sx={{
                  fontWeight: 500,
                  fontSize: 12,
                  borderRadius: 2,
                  textTransform: 'none',
                  minWidth: 80,
                  boxShadow: '0 2px 8px rgba(244, 67, 54, 0.3)',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(244, 67, 54, 0.4)'
                  },
                  '&:disabled': {
                    bgcolor: '#ccc',
                    color: '#666'
                  }
                }}
                onClick={() => setShowConfirm(true)}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </Box>
            {/* Confirmation Prompt */}
            {showConfirm && (
              <Alert
                severity="warning"
                action={
                  <>
                    <Button 
                      color="error" 
                      disabled={isDeleting}
                      onClick={() => {
                        handleDeleteAccount();
                      }}
                      sx={{ fontWeight: 600 }}
                    >
                      {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                    </Button>
                    <Button 
                      color="inherit" 
                      disabled={isDeleting}
                      onClick={() => setShowConfirm(false)}
                      sx={{ fontWeight: 600 }}
                    >
                      Cancel
                    </Button>
                  </>
                }
                sx={{ mt: 2, borderRadius: 2 }}
              >
                <Typography fontWeight={500}>
                  ⚠️ Are you sure you want to delete your account? This action cannot be undone.
                  {currentUserEmail && (
                    <Box component="span" sx={{ display: 'block', mt: 1, fontSize: 12, opacity: 0.8 }}>
                      Account: {currentUserEmail}
                    </Box>
                  )}
                </Typography>
              </Alert>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}