// StatusBadge.jsx
import React from 'react';
import { Chip } from '@mui/material';

export default function StatusBadge({ status }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Admin':
        return {
          backgroundColor: '#e8f5e8',
          color: '#2e7d32',
          borderColor: '#4caf50'
        };
      case 'User':
        return {
          backgroundColor: '#e3f2fd',
          color: '#1565c0',
          borderColor: '#2196f3'
        };
      default:
        return {
          backgroundColor: '#f5f5f5',
          color: '#616161',
          borderColor: '#9e9e9e'
        };
    }
  };

  const statusStyle = getStatusColor(status);

  return (
    <Chip
      label={status}
      size="small"
      variant="outlined"
      sx={{
        backgroundColor: statusStyle.backgroundColor,
        color: statusStyle.color,
        borderColor: statusStyle.borderColor,
        fontWeight: 500
      }}
    />
  );
}