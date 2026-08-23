import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Box
} from '@mui/material';

const statusOptions = ['Completed', 'In Progress', 'Upcoming', 'Scheduled', 'Cancelled'];
const typeOptions = ['Review', 'Complaint', 'Consultation', 'Follow-up'];

export default function MeetingForm({ open, editing, onClose, onSave }) {
  const [meeting, setMeeting] = useState({
    name: '',
    date: '',
    type: '',
    status: 'Upcoming'
  });

  useEffect(() => {
    if (editing) {
      // Validate date before converting
      let dateString = '';
      if (editing.date) {
        const d = new Date(editing.date);
        dateString = isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 16);
      }
      setMeeting({
        name: editing.name || '',
        date: dateString,
        type: editing.type || '',
        status: editing.status || 'Upcoming'
      });
    } else {
      setMeeting({ name: '', date: '', type: '', status: 'Upcoming' });
    }
  }, [editing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMeeting(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(meeting);
  };

  // ...existing code...
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 4, boxShadow: 4 } } }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.25rem', color: 'primary.main', pb: 1 }}>{editing ? 'Edit Meeting' : 'Add Meeting'}</DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 1 }}>
            <TextField
              label="Client Name"
              name="name"
              value={meeting.name}
              onChange={handleChange}
              fullWidth
              variant="outlined"
              sx={{ borderRadius: 2 }}
              required
            />
            <TextField
              label="Date & Time"
              name="date"
              type="datetime-local"
              value={meeting.date || ''}
              onChange={handleChange}
              fullWidth
              variant="outlined"
              sx={{ borderRadius: 2 }}
              required
              InputLabelProps={{ shrink: true }}
            />
            <FormControl fullWidth sx={{ borderRadius: 2 }}>
              <InputLabel>Type</InputLabel>
              <Select
                label="Type"
                name="type"
                value={meeting.type}
                onChange={handleChange}
                variant="outlined"
                required
              >
                {typeOptions.map(type => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ borderRadius: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                name="status"
                value={meeting.status}
                onChange={handleChange}
                variant="outlined"
                required
              >
                {statusOptions.map(status => (
                  <MenuItem key={status} value={status}>{status}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={onClose} sx={{ borderRadius: 2 }} type="button">Cancel</Button>
            <Button type="submit" variant="contained" color="primary" sx={{ borderRadius: 2 }}>Save</Button>
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  );
}