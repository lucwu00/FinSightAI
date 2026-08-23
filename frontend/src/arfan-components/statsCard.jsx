// StatsCard.jsx
import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';

export default function StatsCard({ number, label, change }) {
  return (
    <Card sx={{ minWidth: 150, mr: 2 }}>
      <CardContent>
        <Typography variant="h4" component="div">{number}</Typography>
        <Typography color="text.secondary">{label}</Typography>
        <Typography variant="body2" color="success.main">{change}</Typography>
      </CardContent>
    </Card>
  );
}