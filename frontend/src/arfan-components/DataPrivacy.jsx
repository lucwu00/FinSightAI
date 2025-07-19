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
  DialogActions
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

export default function DataPrivacyContent() {
  const [allowEmailUpdates, setAllowEmailUpdates] = useState(false);
  const [hideEmailFromClient, setHideEmailFromClient] = useState(false);
  const [displayRoleOnProfile, setDisplayRoleOnProfile] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const navigate = useNavigate();

  const currentUserEmail = localStorage.getItem('email');


  const handleDeleteAccount = async () => {
    try {
      const res = await fetch(`/api/users/deleteByEmail?email=${encodeURIComponent(currentUserEmail)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        localStorage.clear();
        navigate('/SignUp');
      } else {
        alert('Failed to delete account');
      }
    } catch (err) {
      alert('Error deleting account');
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
    <Box sx={{ flex: 1 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" fontWeight={600} mb={2} color="black">
          Data Exportation
        </Typography>
        <Typography fontSize={14} color="black" mb={2}>
          Exporting data allows you to create your own backup data to store in separate files safely.
           You will be exporting the clients data table to your own computer.
        </Typography>
        <Button
          variant="contained"
          sx={{
            bgcolor: '#f5f5f5',
            color: '#333',
            fontWeight: 500,
            fontSize: 14,
            borderRadius: 1,
            textTransform: 'none',
            '&:hover': { bgcolor: '#e0e0e0' }
          }}
          onClick={() => setExportDialogOpen(true)}
        >
          Export my data
        </Button>
      </Box>

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

      <Divider sx={{ my: 3 }} />

      {/* Privacy Controls Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" fontWeight={600} mb={3} color="black">
          Privacy Controls
        </Typography>
        
        {/* Alert Preferences */}
        <Box sx={{ mb: 3 }}>
          <Typography fontWeight={600} fontSize={16} mb={2} color="black">
            Alert Preferences
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography fontSize={14} color="black">
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
                  backgroundColor: '#666',
                },
                '& .MuiSwitch-track': {
                  backgroundColor: '#ccc',
                }
              }}
            />
          </Box>
        </Box>

        <Box>
          <Typography fontWeight={600} fontSize={16} mb={2} color="black">
            Data Visibility
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography fontSize={14} color="black">
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
                  backgroundColor: '#666',
                },
                '& .MuiSwitch-track': {
                  backgroundColor: '#ccc',
                }
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography fontSize={14} color="black">
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
                  backgroundColor: '#6366f1',
                },
                '& .MuiSwitch-track': {
                  backgroundColor: '#ccc',
                }
              }}
            />
          </Box>
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box>
        <Typography variant="h6" fontWeight={600} mb={3} color="black">
          Data Deletion
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Typography fontWeight={600} fontSize={16} mb={2} color="black">
            Account Deletion
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1 }}>
              <Typography fontSize={14} fontWeight={500} mb={1} color="black">
                Delete your account
              </Typography>
              <Typography fontSize={12} color="black">
                Your data history will still retain for audit purposes
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="error"
              sx={{
                fontWeight: 500,
                fontSize: 12,
                borderRadius: 1,
                textTransform: 'none',
                minWidth: 80
              }}
              onClick={() => setShowConfirm(true)}
            >
              Delete
            </Button>
          </Box>
          {/* Confirmation Prompt */}
          {showConfirm && (
            <Alert
              severity="warning"
              action={
                <>
                  <Button color="error" onClick={handleDeleteAccount}>
                    Yes, Delete
                  </Button>
                  <Button color="inherit" onClick={() => setShowConfirm(false)}>
                    Cancel
                  </Button>
                </>
              }
              sx={{ mt: 2 }}
            >
              Are you sure you want to delete your account? This action cannot be undone.
            </Alert>
          )}
        </Box>
      </Box>
    </Box>
  );
}