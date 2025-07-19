import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import StatusBadge from './StatusBadge';

export default function DataTable({ data, onDelete, onStatusChange }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const handleMenuOpen = (event, user) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleStatusChange = (newStatus) => {
    if (selectedUser) {
      onStatusChange(selectedUser.id, newStatus);
      handleMenuClose();
    }
  };

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>User ID</TableCell>
            <TableCell>Username</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Date Created</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.id}</TableCell>
              <TableCell>{user.username}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.dateCreated}</TableCell>
              <TableCell>
                <StatusBadge status={user.status} />
              </TableCell>
              <TableCell>
                <IconButton onClick={(e) => handleMenuOpen(e, user)}>
                  <MoreVertIcon />
                </IconButton>
                <IconButton color="error" onClick={() => onDelete(user.id)}>
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* Popup Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {selectedUser && selectedUser.status !== 'Admin' && (
          <MenuItem onClick={() => handleStatusChange('Admin')}>Promote to Admin</MenuItem>
        )}
        {selectedUser && selectedUser.status === 'Admin' && (
          <MenuItem onClick={() => handleStatusChange('User')}>Demote to User</MenuItem>
        )}
      </Menu>
    </TableContainer>
  );
}

