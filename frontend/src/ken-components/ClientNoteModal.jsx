import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  IconButton,
  Chip,
  Stack,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon
} from '@mui/icons-material';

export default function ClientNoteModal({ 
  open, 
  onClose, 
  clientId, 
  clientName,
  onNoteSaved 
}) {
  const [note, setNote] = useState('');
  const [originalNote, setOriginalNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch existing note when modal opens
  useEffect(() => {
    if (open && clientId) {
      fetchClientNote();
    }
  }, [open, clientId]);

  // Track changes
  useEffect(() => {
    setHasChanges(note !== originalNote);
  }, [note, originalNote]);

  const fetchClientNote = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/clients/${clientId}`);
      if (response.ok) {
        const clientData = await response.json();
        const existingNote = clientData.notes || '';
        setNote(existingNote);
        setOriginalNote(existingNote);
      } else {
        setError('Failed to load existing note');
      }
    } catch (error) {
      console.error('Error fetching client note:', error);
      setError('Error loading note');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!clientId) return;

    try {
      setSaving(true);
      setError('');

      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: note,
          lastContactedAt: new Date().toISOString()
        }),
      });

      if (response.ok) {
        setOriginalNote(note);
        setHasChanges(false);
        if (onNoteSaved) {
          onNoteSaved(note);
        }
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save note');
      }
    } catch (error) {
      console.error('Error saving note:', error);
      setError('Error saving note');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmDiscard = window.confirm(
        'You have unsaved changes. Are you sure you want to discard them?'
      );
      if (!confirmDiscard) return;
    }
    
    setNote(originalNote);
    setHasChanges(false);
    setError('');
    onClose();
  };

  const handleClose = () => {
    if (hasChanges) {
      const confirmDiscard = window.confirm(
        'You have unsaved changes. Are you sure you want to close without saving?'
      );
      if (!confirmDiscard) return;
    }
    
    setNote(originalNote);
    setHasChanges(false);
    setError('');
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '400px' }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon color="primary" />
            <Box>
              <Typography variant="h6">Client Notes</Typography>
              <Typography variant="body2" color="text.secondary">
                {clientName || `Client ${clientId}`}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {hasChanges && (
              <Chip 
                label="Unsaved changes" 
                color="warning" 
                size="small"
              />
            )}
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TextField
            fullWidth
            multiline
            rows={12}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add notes about this client..."
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: hasChanges ? 'warning.main' : undefined,
                },
              },
            }}
          />
        )}

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            {note.length} characters
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Last updated: {originalNote ? 'Previously saved' : 'No previous notes'}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button
          onClick={handleCancel}
          variant="outlined"
          startIcon={<CancelIcon />}
          disabled={saving}
        >
          Cancel
        </Button>
        
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
          disabled={!hasChanges || saving || loading}
        >
          {saving ? 'Saving...' : 'Save Note'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
