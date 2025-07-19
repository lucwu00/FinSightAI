import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Grid
} from '@mui/material';

export default function AIAnalyticsTest({ open, onClose, userData }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const testAnalysis = () => {
    setLoading(true);
    
    // Simple test without charts
    setTimeout(() => {
      setLoading(false);
      alert(`Analysis complete! Found ${userData.length} users.`);
    }, 1000);
  };

  useEffect(() => {
    if (open && userData.length > 0) {
      testAnalysis();
    }
  }, [open, userData]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>AI Analytics Test</DialogTitle>
      
      <DialogContent>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Testing AI Analytics...</Typography>
          </Box>
        )}
        
        {!loading && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Basic User Stats</Typography>
                  <Typography>Total Users: {userData.length}</Typography>
                  <Typography>
                    Sample User: {userData.length > 0 ? userData[0].username : 'No users'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
