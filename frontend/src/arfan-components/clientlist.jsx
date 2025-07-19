import React, { useState, useEffect } from 'react';
import { Box, Container, TextField, Button, IconButton, Paper, Dialog, DialogTitle, DialogContent, DialogActions, Collapse, MenuItem, Menu } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import AIClientAnalytics from './AIClientAnalytics';



//lmao so many func for simple page
export default function ClientList() {
  const [clients, setClients] = useState([]);
  const [open, setOpen] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', email: '', plan: '' });
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('name');
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [aiAnalyticsOpen, setAiAnalyticsOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const res = await fetch('/api/clients');
    const data = await res.json();
    setClients(data);
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setNewClient({ name: '', email: '', plan: '' });
  };

  const handleAddClient = async () => {
    if (!newClient.name || !newClient.email || !newClient.plan) return;
    await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newClient)
    });
    handleClose();
    fetchClients();
  };

  const handleDelete = async (clientId) => {
    await fetch(`/api/clients/${clientId}`, { method: 'DELETE' });
    fetchClients();
  };

  // Open menu for a specific client
  const handleMenuOpen = (event, client) => {
    setMenuAnchor(event.currentTarget);
    setEditClient(client);
  };
  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  // Open edit dialog
  const handleEditOpen = () => {
    setEditOpen(true);
    handleMenuClose();
  };
  const handleEditClose = () => {
    setEditOpen(false);
    setEditClient(null);
  };

  // Save edited client
  const handleEditSave = async () => {
    if (!editClient.name || !editClient.email || !editClient.plan) return;
    await fetch(`/api/clients/${editClient.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editClient)
    });
    handleEditClose();
    fetchClients();
  };

  // Filtering logic based on filterType
  const filteredClients = clients.filter(c => {
    const value = (filterType === 'name' ? c.name : filterType === 'email' ? c.email : c.plan) || '';
    return value.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <Box sx={{ ml: 0, mt: 2, background: '#FFF4F4', minHeight: '100vh', p: 3 }}>
      <Container sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TextField
            size="small"
            placeholder={`Search by ${filterType}`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <SearchIcon sx={{ mr: 1, color: 'grey.500' }} />
              ),
              sx: { bgcolor: '#fff', borderRadius: 2, width: 200 }
            }}
            sx={{ mr: 2 }}
          />
          <Button
            variant="contained"
            sx={{ bgcolor: '#3f51b5', borderRadius: 2, textTransform: 'none', boxShadow: 1, mr: 2 }}
            onClick={() => setFilterPanelOpen(v => !v)}
            endIcon={filterPanelOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          >
            Filter
          </Button>
          <Button
            variant="contained"
            color="success"
            sx={{ borderRadius: 2, textTransform: 'none', boxShadow: 1, mr: 2 }}
            onClick={handleOpen}
          >
            Add Client
          </Button>
          <Button
            variant="contained"
            color="primary"
            sx={{ borderRadius: 2, textTransform: 'none', boxShadow: 1 }}
            onClick={() => setAiAnalyticsOpen(true)}
            startIcon={<AnalyticsIcon />}
          >
            AI Analytics
          </Button>
        </Box>
        <Collapse in={filterPanelOpen}>
          <Paper elevation={2} sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              select
              label="Filter by"
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              size="small"
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="name">Client Name</MenuItem>
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="plan">Plan</MenuItem>
            </TextField>
            <span style={{ color: '#888' }}>Showing results for <b>{filterType}</b></span>
          </Paper>
        </Collapse>
        <Paper elevation={1} sx={{ p: 2, background: '#fff', borderRadius: 2 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'transparent' }}>
            <thead>
              <tr style={{ background: 'transparent' }}>
                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Client ID</th>
                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Client Name</th>
                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Email</th>
                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Plans</th>
                <th style={{ padding: '10px 8px', textAlign: 'center' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr key={client.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px 8px' }}>{client.clientId}</td>
                  <td style={{ padding: '10px 8px' }}>{client.name}</td>
                  <td style={{ padding: '10px 8px' }}>{client.email}</td>
                  <td style={{ padding: '10px 8px' }}>{client.plan}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                    <IconButton color="error" onClick={() => handleDelete(client.id)}>
                      <DeleteIcon />
                    </IconButton>
                    <IconButton onClick={e => handleMenuOpen(e, client)}>
                      <MoreVertIcon />
                    </IconButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Paper>
        {/* Edit Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleEditOpen}>Edit</MenuItem>
        </Menu>
        {/* Edit Dialog */}
        <Dialog open={editOpen} onClose={handleEditClose}>
          <DialogTitle>Edit Client</DialogTitle>
          <DialogContent>
            <TextField
              margin="dense"
              label="Client Name"
              fullWidth
              value={editClient?.name || ''}
              onChange={e => setEditClient({ ...editClient, name: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Email"
              fullWidth
              value={editClient?.email || ''}
              onChange={e => setEditClient({ ...editClient, email: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Plan"
              fullWidth
              value={editClient?.plan || ''}
              onChange={e => setEditClient({ ...editClient, plan: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleEditClose}>Cancel</Button>
            <Button onClick={handleEditSave} variant="contained">Save</Button>
          </DialogActions>
        </Dialog>
        {/* Add Client Dialog */}
        <Dialog open={open} onClose={handleClose}>
          <DialogTitle>Add Client</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Client Name"
              fullWidth
              value={newClient.name}
              onChange={e => setNewClient({ ...newClient, name: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Email"
              fullWidth
              value={newClient.email}
              onChange={e => setNewClient({ ...newClient, email: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Plan"
              fullWidth
              value={newClient.plan}
              onChange={e => setNewClient({ ...newClient, plan: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={handleAddClient} variant="contained">Add</Button>
          </DialogActions>
        </Dialog>
        {/* AI Analytics Dialog */}
        <AIClientAnalytics 
          open={aiAnalyticsOpen} 
          onClose={() => setAiAnalyticsOpen(false)}
          clientData={clients}
        />
      </Container>
    </Box>
  );
}