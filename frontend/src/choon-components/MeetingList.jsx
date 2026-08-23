import React from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, Paper, Typography, Button } from '@mui/material';

const statusColors = {
  Completed: '#2e7d32',
  'In Progress': '#0288d1',
  Upcoming: '#f57c00',
  Scheduled: '#1976d2',
  Cancelled: '#d32f2f'
};

export default function MeetingList({ meetings, onEdit, onDelete, onSummaryIconClick, openSummaryId, onSummaryUpdated }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const safeMeetings = Array.isArray(meetings) ? meetings : [];

  return (
    <Box component={Paper} elevation={3} sx={{ p: 3, borderRadius: 3, mt: 2, mb: 4, boxShadow: 3 }}>
      <Typography variant="h6" fontWeight={700} gutterBottom color="primary">
        Upcoming Meetings
      </Typography>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary, borderRadius: '12px', overflow: 'hidden' }}>
        <thead style={{ backgroundColor: isDark ? '#424242' : '#f5f5f5', color: theme.palette.text.primary }}>
          <tr>
            <th style={{ padding: '14px', fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap' }}>Client Name</th>
            <th style={{ padding: '14px', fontWeight: 600, textAlign: 'left' }}>Date &amp; Time</th>
            <th style={{ padding: '14px', fontWeight: 600, textAlign: 'left' }}>Type</th>
            <th style={{ padding: '14px', fontWeight: 600, textAlign: 'left' }}>Status</th>
            <th style={{ padding: '14px', fontWeight: 600, textAlign: 'left' }}>Summary</th>
            <th style={{ padding: '14px', fontWeight: 600, textAlign: 'left' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {safeMeetings.map((m) => {
            const meetingDate = new Date(m.date);
            const formattedDate = meetingDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
            const formattedTime = meetingDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            const isOpen = openSummaryId === m.id;

            return (
              <React.Fragment key={m.id}>
                <tr style={{ borderBottom: isOpen ? 'none' : '1px solid #ddd' }}>
                  <td style={{ padding: '12px', verticalAlign: 'middle', textAlign: 'left' }}>{m.name}</td>
                  <td style={{ padding: '12px', verticalAlign: 'middle', textAlign: 'left' }}>
                    {formattedDate} {formattedTime}
                  </td>
                  <td style={{ padding: '12px', verticalAlign: 'middle', textAlign: 'left' }}>{m.type}</td>
                  <td style={{ padding: '12px', verticalAlign: 'middle', textAlign: 'left' }}>
                    <span style={{ 
                      display: 'inline-flex', 
                      padding: '6px 16px', 
                      borderRadius: '20px', 
                      background: statusColors[m.status] || '#eee', 
                      color: '#fff', 
                      fontWeight: 500, 
                      fontSize: '0.875rem', 
                      minHeight: '32px',
                      lineHeight: '20px',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      boxSizing: 'border-box',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {m.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px', verticalAlign: 'middle', textAlign: 'left' }}>
                    <Button variant="outlined" color="secondary" size="small" onClick={() => onSummaryIconClick(m)} sx={{ mx: 0.5, borderRadius: 2, minHeight: 36 }}>View</Button>
                  </td>
                  <td style={{ padding: '12px', verticalAlign: 'middle', whiteSpace: 'nowrap', textAlign: 'left' }}>
                    <Button variant="contained" color="primary" size="small" onClick={() => onEdit(m)} sx={{ mx: 0.5, borderRadius: 2, minHeight: 36 }}>Edit</Button>
                    <Button variant="outlined" color="error" size="small" onClick={() => onDelete(m)} sx={{ mx: 0.5, borderRadius: 2, minHeight: 36 }}>Delete</Button>
                  </td>
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </Box>
  );
}
