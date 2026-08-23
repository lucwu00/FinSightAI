import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  TextField, 
  Button, 
  IconButton, 
  Paper, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Collapse, 
  MenuItem, 
  Menu,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  NativeSelect
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import AIClientAnalytics from './AIClientAnalytics';
export default function ClientList() {
  const [clients, setClients] = useState([]);
  const [open, setOpen] = useState(false);
  const [newClient, setNewClient] = useState({ 
    fullName: '', 
    nric: '', 
    email: '', 
    phone: '+65 ', 
    dob: '', 
    gender: '', 
    maritalStatus: '', 
    occupation: '', 
    annualIncome: '', 
    paymentFrequency: '', 
    riskProfile: '',
    advisorId: 1,
    incomeBracket: '', // Added as it's in the model
    notes: '', // Added as it's in the model
    lastContactedAt: null // Added as it's in the model
  });
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('fullName');
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [aiAnalyticsOpen, setAiAnalyticsOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      if (!res.ok) throw new Error('Failed to fetch clients');
      const data = await res.json();
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setNewClient({ 
      fullName: '', 
      nric: '', 
      email: '', 
      phone: '', 
      dob: '', 
      gender: '', 
      maritalStatus: '', 
      occupation: '', 
      annualIncome: '', 
      paymentFrequency: '', 
      riskProfile: '',
      advisorId: 1
    });
  };

  const handleAddClient = async () => {
    // Validate required fields
    const requiredFields = {
      fullName: 'Full Name',
      nric: 'NRIC',
      email: 'Email',
      phone: 'Phone',
      dob: 'Date of Birth',
      gender: 'Gender',
      occupation: 'Occupation',
      annualIncome: 'Annual Income',
      paymentFrequency: 'Payment Frequency',
      maritalStatus: 'Marital Status',
      riskProfile: 'Risk Profile'
    };

    const missingFields = [];
    for (const [field, label] of Object.entries(requiredFields)) {
      if (!newClient[field]) {
        missingFields.push(label);
      }
    }

    if (missingFields.length > 0) {
      alert(`Please fill in the following required fields: ${missingFields.join(', ')}`);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newClient.email)) {
      alert('Please enter a valid email address');
      return;
    }

    // Validate phone format
    const phoneDigits = newClient.phone.replace(/[^\d]/g, '');
    if (!newClient.phone.startsWith('+65') || phoneDigits.length !== 10) { // 65 + 8 digits = 10
      alert('Phone number must be in format: +65 followed by 8 digits (e.g., +65 12345678)');
      return;
    }

    // Generate clientId in the format CXXX (e.g., C001, C002, ...)
    let maxNum = 0;
    clients.forEach(client => {
      const match = /^C(\d{3})$/.exec(client.clientId);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    const nextNum = (maxNum + 1).toString().padStart(3, '0');
    const clientId = `C${nextNum}`;

    const clientToAdd = {
      ...newClient,
      clientId,
      annualIncome: parseFloat(newClient.annualIncome)
    };

    try {
      console.log('Sending client data:', clientToAdd);
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientToAdd)
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('Server response:', errorData);
        throw new Error(errorData.error || 'Failed to add client');
      }

      await fetchClients();
      handleClose();
    } catch (error) {
      console.error('Error adding client:', error);
    }
  };

  const handleDelete = async (clientId) => {
    try {
      await fetch(`/api/clients/${clientId}`, { method: 'DELETE' });
      await fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  };

  const handleMenuOpen = (event, client) => {
    setMenuAnchor(event.currentTarget);
    setEditClient(client);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleEditOpen = () => {
    setEditOpen(true);
    handleMenuClose();
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setEditClient(null);
  };

  const handleEditSave = async () => {
    if (!editClient.fullName || !editClient.email || !editClient.nric) return;
    try {
      await fetch(`/api/clients/${editClient.clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editClient)
      });
      await fetchClients();
      handleEditClose();
    } catch (error) {
      console.error('Error updating client:', error);
    }
  };

  const filteredClients = clients.filter(c => {
    const value = (filterType === 'fullName' ? c.fullName : filterType === 'email' ? c.email : c.nric) || '';
    return value.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <Box sx={{ ml: 0, mt: 2, background: '', minHeight: '100vh', p: 3 }}>
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
              <MenuItem value="fullName">Client Name</MenuItem>
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="nric">NRIC</MenuItem>
            </TextField>
            <span style={{ color: '#888' }}>Showing results for <b>{filterType}</b></span>
          </Paper>
        </Collapse>

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
                <TableCell>NRIC</TableCell>
                <TableCell>Full Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Occupation</TableCell>
                <TableCell>Annual Income</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredClients.map((client, index) => (
                <TableRow 
                  key={client.clientId}
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
                  <TableCell>{client.nric}</TableCell>
                  <TableCell>{client.fullName}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{client.phone}</TableCell>
                  <TableCell>{client.occupation}</TableCell>
                  <TableCell>{client.annualIncome}</TableCell>
                  <TableCell>
                    <IconButton 
                      color="error" 
                      onClick={() => handleDelete(client.clientId)}
                      sx={{ 
                        color: '#d32f2f',
                        '&:hover': {
                          backgroundColor: '#ffebee'
                        }
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                    <IconButton 
                      onClick={(e) => handleMenuOpen(e, client)}
                      sx={{ color: '#666666' }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

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
              label="Full Name"
              fullWidth
              value={editClient?.fullName || ''}
              onChange={e => setEditClient({ ...editClient, fullName: e.target.value })}
            />
            <TextField
              margin="dense"
              label="NRIC"
              fullWidth
              value={editClient?.nric || ''}
              onChange={e => setEditClient({ ...editClient, nric: e.target.value })}
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
              label="Phone"
              fullWidth
              value={editClient?.phone || ''}
              onChange={e => setEditClient({ ...editClient, phone: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Date of Birth"
              type="date"
              fullWidth
              value={editClient?.dob || ''}
              onChange={e => setEditClient({ ...editClient, dob: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              margin="dense"
              label="Gender"
              fullWidth
              value={editClient?.gender || ''}
              onChange={e => setEditClient({ ...editClient, gender: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Occupation"
              fullWidth
              value={editClient?.occupation || ''}
              onChange={e => setEditClient({ ...editClient, occupation: e.target.value })}
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
              label="Full Name"
              fullWidth
              value={newClient.fullName}
              onChange={e => setNewClient({ ...newClient, fullName: e.target.value })}
            />
            <TextField
              margin="dense"
              label="NRIC"
              fullWidth
              value={newClient.nric}
              onChange={e => setNewClient({ ...newClient, nric: e.target.value })}
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
              label="Phone"
              fullWidth
              placeholder="+65 12345678"
              value={newClient.phone}
              onChange={e => {
                let value = e.target.value;
                value = value.replace(/[^\d+]/g, '');
                
                if (!value.startsWith('+65')) {
                  if (value.startsWith('+')) {
                    value = '+65' + value.substring(1);
                  } else if (value.startsWith('65')) {
                    value = '+' + value;
                  } else {
                    value = '+65' + value;
                  }
                }
                
                
                if (value.length > 3) {
                  value = value.substring(0, 3) + ' ' + value.substring(3);
                }
                
                
                if (value.length > 12) {
                  value = value.substring(0, 12);
                }
                
                setNewClient({ ...newClient, phone: value });
              }}
            />
            <TextField
              margin="dense"
              label="Date of Birth"
              type="date"
              fullWidth
              value={newClient.dob}
              onChange={e => setNewClient({ ...newClient, dob: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <FormControl fullWidth margin="dense">
              <InputLabel htmlFor="gender-select">Gender</InputLabel>
              <NativeSelect
                value={newClient.gender}
                onChange={e => setNewClient({ ...newClient, gender: e.target.value })}
                inputProps={{
                  id: 'gender-select',
                }}
              >
                <option value=""></option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </NativeSelect>
            </FormControl>

            <FormControl fullWidth margin="dense">
              <InputLabel htmlFor="marital-status-select">Marital Status</InputLabel>
              <NativeSelect
                value={newClient.maritalStatus}
                onChange={e => setNewClient({ ...newClient, maritalStatus: e.target.value })}
                inputProps={{
                  id: 'marital-status-select',
                }}
              >
                <option value=""></option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
              </NativeSelect>
            </FormControl>

            <TextField
              margin="dense"
              label="Occupation"
              fullWidth
              value={newClient.occupation}
              onChange={e => setNewClient({ ...newClient, occupation: e.target.value })}
            />

            <TextField
              margin="dense"
              label="Annual Income"
              type="number"
              fullWidth
              value={newClient.annualIncome}
              onChange={e => setNewClient({ ...newClient, annualIncome: e.target.value })}
            />

            <FormControl fullWidth margin="dense">
              <InputLabel htmlFor="payment-frequency-select">Payment Frequency</InputLabel>
              <NativeSelect
                value={newClient.paymentFrequency}
                onChange={e => setNewClient({ ...newClient, paymentFrequency: e.target.value })}
                inputProps={{
                  id: 'payment-frequency-select',
                }}
              >
                <option value=""></option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
              </NativeSelect>
            </FormControl>

            <FormControl fullWidth margin="dense">
              <InputLabel htmlFor="risk-profile-select">Risk Profile</InputLabel>
              <NativeSelect
                value={newClient.riskProfile}
                onChange={e => setNewClient({ ...newClient, riskProfile: e.target.value })}
                inputProps={{
                  id: 'risk-profile-select',
                }}
              >
                <option value=""></option>
                <option value="Conservative">Conservative</option>
                <option value="Balanced">Balanced</option>
                <option value="Aggressive">Aggressive</option>
              </NativeSelect>
            </FormControl>
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