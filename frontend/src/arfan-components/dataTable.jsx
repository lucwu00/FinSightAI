import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import StatusBadge from './statusBadge';

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
    <TableContainer 
      component={Paper} 
      sx={{ 
        mt: 2, 
        width: '100%',
        boxShadow: 1,
        '& .MuiTable-root': {
          width: '100%'
        }
      }}
    >
      <Table sx={{ width: '100%' }}>
        <TableHead>
          <TableRow sx={{ 
            backgroundColor: '#f5f5f5',
            '& .MuiTableCell-head': {
              fontWeight: 600,
              color: '#424242'
            }
          }}>
            <TableCell>User ID</TableCell>
            <TableCell>Username</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Date Created</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((user, index) => (
            <TableRow 
              key={user.id}
              sx={{
                backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafafa',
                '&:hover': {
                  backgroundColor: '#f0f0f0'
                },
                '& .MuiTableCell-body': {
                  borderBottom: '1px solid #e0e0e0'
                }
              }}
            >
              <TableCell>{user.id}</TableCell>
              <TableCell>{user.username}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.dateCreated}</TableCell>
              <TableCell>
                <StatusBadge status={user.status} />
              </TableCell>
              <TableCell>
                <IconButton 
                  onClick={(e) => handleMenuOpen(e, user)}
                  sx={{ color: '#666666' }}
                >
                  <MoreVertIcon />
                </IconButton>
                <IconButton 
                  color="error" 
                  onClick={() => onDelete(user.id)}
                  sx={{ 
                    color: '#d32f2f',
                    '&:hover': {
                      backgroundColor: '#ffebee'
                    }
                  }}
                >
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

