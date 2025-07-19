// StatusBadge.jsx
import React from 'react';
import { Chip } from '@mui/material';

export default function StatusBadge({ status }) {
  return (
    <Chip
      label={status}
      color={status === 'Admin' ? 'success' : 'default'}
      size="small"
      variant="outlined"
    />
  );
}