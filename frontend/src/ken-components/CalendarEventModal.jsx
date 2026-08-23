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
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Event as EventIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Google as GoogleIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

export default function CalendarEventModal({ 
  open, 
  onClose, 
  clientId, 
  clientName,
  clientEmail,
  onEventCreated 
}) {
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    startDateTime: new Date(),
    endDateTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    eventType: 'meeting',
    location: '',
    meetingType: 'in-person'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isGoogleConfigured, setIsGoogleConfigured] = useState(false);
  const [googleCalendarId, setGoogleCalendarId] = useState('primary');
  const [connectedGoogleAccount, setConnectedGoogleAccount] = useState('');

  const eventTypes = [
    { value: 'meeting', label: 'Client Meeting' },
    { value: 'consultation', label: 'Consultation' },
    { value: 'review', label: 'Policy Review' },
    { value: 'follow-up', label: 'Follow-up Call' },
    { value: 'presentation', label: 'Product Presentation' },
    { value: 'other', label: 'Other' }
  ];

  const meetingTypes = [
    { value: 'in-person', label: 'In-Person' },
    { value: 'video-call', label: 'Video Call' },
    { value: 'phone-call', label: 'Phone Call' },
    { value: 'online', label: 'Online Meeting' }
  ];

  // Initialize event data when modal opens
  useEffect(() => {
    if (open && clientName) {
      setEventData(prev => ({
        ...prev,
        title: `Meeting with ${clientName}`,
        description: `Scheduled meeting with client ${clientName} (ID: ${clientId})`
      }));
      checkGoogleConnection();
    }
  }, [open, clientName, clientId]);

  const checkGoogleConnection = async () => {
    // Check if user has Google Calendar connected
    try {
      // Get userId from localStorage
      const userId = localStorage.getItem('userId') || 'default';
      const response = await fetch(`/api/calendar/status?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setIsGoogleConnected(data.connected);
        setIsGoogleConfigured(data.configured);
        setConnectedGoogleAccount(data.googleEmail || '');
      }
    } catch (error) {
      console.log('Google Calendar not available');
      setIsGoogleConnected(false);
      setIsGoogleConfigured(false);
      setConnectedGoogleAccount('');
    }
  };

  const connectGoogleCalendar = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get userId from localStorage
      const userId = localStorage.getItem('userId') || 'default';
      
      // Open Google OAuth flow in a popup window with userId and force account selection
      const popup = window.open(
        `/api/calendar/auth?userId=${userId}&force_select=true`,
        'googleOAuth',
        'width=500,height=600,scrollbars=yes,resizable=yes,left=' + 
        (window.screenX + (window.outerWidth - 500) / 2) + ',top=' + 
        (window.screenY + (window.outerHeight - 600) / 2)
      );

      // Handle case where popup is blocked
      if (!popup) {
        setError('Popup blocked. Please allow popups and try again.');
        setLoading(false);
        return;
      }

      // Listen for popup to close (when OAuth completes)
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          // Give a small delay for the backend to save tokens
          setTimeout(() => {
            checkGoogleConnection();
            setLoading(false);
          }, 500);
        }
      }, 1000);

      // Handle case where popup doesn't close after 5 minutes (timeout)
      setTimeout(() => {
        if (!popup.closed) {
          clearInterval(checkClosed);
          popup.close();
          setError('Connection timeout. Please try again.');
          setLoading(false);
        }
      }, 300000); // 5 minutes timeout

    } catch (error) {
      console.error('Error connecting Google Calendar:', error);
      setError('Failed to connect Google Calendar');
      setLoading(false);
    }
  };

  const disconnectGoogleCalendar = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get userId from localStorage
      const userId = localStorage.getItem('userId') || 'default';
      
      const response = await fetch(`/api/calendar/disconnect?userId=${userId}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        setIsGoogleConnected(false);
        setConnectedGoogleAccount('');
        console.log('Google Calendar disconnected successfully');
      } else {
        setError('Failed to disconnect Google Calendar');
      }
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
      setError('Failed to disconnect Google Calendar');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEventData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStartDateChange = (newDate) => {
    if (newDate) {
      const endDate = new Date(newDate.getTime() + 60 * 60 * 1000); // 1 hour later
      setEventData(prev => ({
        ...prev,
        startDateTime: newDate,
        endDateTime: endDate
      }));
    }
  };

  const handleCreateEvent = async () => {
    if (!eventData.title.trim()) {
      setError('Event title is required');
      return;
    }

    if (eventData.startDateTime >= eventData.endDateTime) {
      setError('End time must be after start time');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Get userId from localStorage
      const userId = localStorage.getItem('userId') || 'default';

      const eventPayload = {
        ...eventData,
        clientId,
        clientName,
        clientEmail,
        userId, // Include userId in the payload
        attendees: clientEmail ? [{ email: clientEmail }] : []
      };

      if (isGoogleConnected) {
        // Create Google Calendar event
        const response = await fetch('/api/calendar/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventPayload),
        });

        if (response.ok) {
          const createdEvent = await response.json();
          if (onEventCreated) {
            onEventCreated(createdEvent);
          }
          onClose();
          resetForm();
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to create calendar event');
        }
      } else if (isGoogleConfigured) {
        // Google Calendar configured but not connected
        setError('Please connect your Google Calendar account first.');
      } else {
        // Google Calendar not configured - create local event
        const response = await fetch('/api/calendar/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventPayload),
        });

        if (response.ok) {
          const createdEvent = await response.json();
          if (onEventCreated) {
            onEventCreated(createdEvent);
          }
          onClose();
          resetForm();
          // Show info about local event creation
          console.log('Event created locally. Configure Google Calendar for cloud sync.');
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to create event');
        }
      }
    } catch (error) {
      console.error('Error creating calendar event:', error);
      setError('Error creating calendar event');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEventData({
      title: '',
      description: '',
      startDateTime: new Date(),
      endDateTime: new Date(Date.now() + 60 * 60 * 1000),
      eventType: 'meeting',
      location: '',
      meetingType: 'in-person'
    });
    setError('');
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog 
        open={open} 
        onClose={handleCancel}
        maxWidth={false}
        fullWidth={false}
        scroll="paper"
        sx={{
          '& .MuiDialog-container': {
            alignItems: 'center',
            justifyContent: 'center'
          }
        }}
        PaperProps={{
          sx: { 
            width: { xs: '95vw', sm: '85vw', md: '900px' },
            maxWidth: '900px',
            maxHeight: '85vh',
            minHeight: '300px',
            borderRadius: 2,
            margin: '20px'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, pt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EventIcon color="primary" />
              <Box>
                <Typography variant="h6">Schedule Event</Typography>
                <Typography variant="body2" color="text.secondary">
                  {clientName || `Client ${clientId}`}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isGoogleConnected ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip 
                    icon={<GoogleIcon />}
                    label={`Connected${connectedGoogleAccount ? `: ${connectedGoogleAccount}` : ''}`}
                    color="success" 
                    size="small"
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={connectGoogleCalendar}
                    disabled={loading}
                    sx={{ fontSize: '0.75rem', minWidth: 'auto', px: 1 }}
                  >
                    Switch Account
                  </Button>
                </Box>
              ) : isGoogleConfigured ? (
                <Chip 
                  icon={<GoogleIcon />}
                  label="Ready to Connect" 
                  color="warning" 
                  size="small"
                />
              ) : (
                <Chip 
                  icon={<GoogleIcon />}
                  label="Local Events Only" 
                  color="default" 
                  size="small"
                />
              )}
              <IconButton onClick={handleCancel} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 1, pb: 2, overflow: 'auto' }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {isGoogleConnected && (
            <Alert 
              severity="success" 
              sx={{ mb: 2 }}
              action={
                <Stack direction="row" spacing={1}>
                  <Button 
                    color="inherit" 
                    size="small" 
                    onClick={connectGoogleCalendar}
                    disabled={loading}
                    startIcon={<GoogleIcon />}
                  >
                    Switch Account
                  </Button>
                  <Button 
                    color="inherit" 
                    size="small" 
                    onClick={disconnectGoogleCalendar}
                    disabled={loading}
                  >
                    Disconnect
                  </Button>
                </Stack>
              }
            >
              Google Calendar connected{connectedGoogleAccount ? ` as ${connectedGoogleAccount}` : ''}. 
              Events will be synced to your Google Calendar.
            </Alert>
          )}

          {!isGoogleConnected && isGoogleConfigured && (
            <Alert 
              severity="info" 
              sx={{ mb: 2 }}
              action={
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={connectGoogleCalendar}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={16} /> : <GoogleIcon />}
                >
                  {loading ? 'Connecting...' : 'Connect'}
                </Button>
              }
            >
              {loading ? 
                'Opening Google Calendar authorization in popup window...' : 
                'Connect Google Calendar to create and sync events'
              }
            </Alert>
          )}

          {!isGoogleConfigured && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Google Calendar not configured. Events will be created locally. 
              See backend/config/README.md for setup instructions.
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 3 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Event Title"
                value={eventData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Event Type</InputLabel>
                <Select
                  value={eventData.eventType}
                  label="Event Type"
                  onChange={(e) => handleInputChange('eventType', e.target.value)}
                >
                  {eventTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Meeting Type</InputLabel>
                <Select
                  value={eventData.meetingType}
                  label="Meeting Type"
                  onChange={(e) => handleInputChange('meetingType', e.target.value)}
                >
                  {meetingTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <DateTimePicker
                label="Start Date & Time"
                value={eventData.startDateTime}
                onChange={handleStartDateChange}
                renderInput={(params) => <TextField {...params} fullWidth />}
                minDateTime={new Date()}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <DateTimePicker
                label="End Date & Time"
                value={eventData.endDateTime}
                onChange={(newDate) => handleInputChange('endDateTime', newDate)}
                renderInput={(params) => <TextField {...params} fullWidth />}
                minDateTime={eventData.startDateTime}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location / Meeting Link"
                value={eventData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder={
                  eventData.meetingType === 'video-call' 
                    ? 'Enter meeting link (Zoom, Teams, etc.)' 
                    : eventData.meetingType === 'in-person'
                    ? 'Enter meeting address'
                    : 'Enter location or meeting details'
                }
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Description / Agenda"
                value={eventData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Add meeting agenda, topics to discuss, or additional notes..."
              />
            </Grid>

            {clientEmail && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon color="action" />
                  <Typography variant="body2" color="text.secondary">
                    Invitation will be sent to: {clientEmail}
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={handleCancel}
            variant="outlined"
            startIcon={<CancelIcon />}
            disabled={loading}
          >
            Cancel
          </Button>
          
          <Button
            onClick={handleCreateEvent}
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
            disabled={loading}
          >
            {loading ? 'Creating...' : isGoogleConnected ? 'Create Event' : 'Create Local Event'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}
