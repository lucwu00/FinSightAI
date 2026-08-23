import { useState, useEffect } from "react";
import TextField from '@mui/material/TextField';
import { Box, Button } from '@mui/material';
import DataTable from "../arfan-components/dataTable";
import StatsCard from "../arfan-components/statsCard";
import AIAnalytics from "../arfan-components/AIAnalytics";
import AnalyticsIcon from '@mui/icons-material/Analytics';

function UserManagement() {
  const [userData, setUserData] = useState([]);
  const [search, setSearch] = useState('');
  const [aiAnalyticsOpen, setAiAnalyticsOpen] = useState(false);

  useEffect(() => {
    fetch('/api/userManagement')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => setUserData(data))
      .catch(err => console.error('Failed to fetch users:', err));
  }, []);

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        setUserData(prev => prev.filter(user => String(user.id) !== String(userId)));
      } else {
        alert('Failed to delete user');
      }
    } catch (err) {
      alert('Error deleting user');
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      const res = await fetch(`/api/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setUserData(prev =>
          prev.map(user =>
            user.id === userId ? { ...user, status: newStatus } : user
          )
        );
      } else {
        alert('Failed to update status');
      }
    } catch (err) {
      alert('Error updating status');
    }
  };

  const filteredUsers = userData.filter(user =>
    user.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{ 
      p: 3, 
      bgcolor: '',
      minHeight: '100vh',
      width: '100%',
      boxSizing: 'border-box',
      overflowX: 'hidden'
    }}>
      {/* Stats Cards Section */}
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        mb: 4, 
        flexWrap: 'wrap',
        width: '100%'
      }}>
        <StatsCard 
          number={userData.length} 
          label="Total Users" 
          change="+ 66% vs previous month" 
        />
        <StatsCard 
          number="3" 
          label="New Users" 
          change="+ 300% vs previous month" 
        />
      </Box>

      {/* Search and Table Section */}
      <Box sx={{ 
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}>
        {/* Search and AI Button Row */}
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          mb: 3,
          width: '100%',
          flexDirection: { xs: 'column', sm: 'row' }
        }}>
          <TextField
            fullWidth
            label="Search by username"
            variant="outlined"
            size="small"
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ 
              bgcolor: 'background.paper',
              borderRadius: 1,
              flex: 1
            }}
          />
          <Button
            variant="contained"
            startIcon={<AnalyticsIcon />}
            onClick={() => setAiAnalyticsOpen(true)}
            sx={{ 
              minWidth: 140,
              alignSelf: { xs: 'flex-start', sm: 'center' }
            }}
          >
            AI Analytics
          </Button>
        </Box>

        {/* Data Table */}
        <Box sx={{ 
          width: '100%',
          overflowX: 'auto',
          '&::-webkit-scrollbar': {
            height: '6px'
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'grey.400',
            borderRadius: 3
          }
        }}>
          <DataTable 
            data={filteredUsers} 
            onDelete={handleDelete} 
            onStatusChange={handleStatusChange}
            sx={{ 
              minWidth: 850, // Minimum width for the table
              width: '100%',
              '& .MuiTableCell-root': {
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }
            }}
          />
        </Box>
      </Box>

      {/* AI Analytics Dialog */}
      <AIAnalytics 
        open={aiAnalyticsOpen} 
        onClose={() => setAiAnalyticsOpen(false)}
        userData={userData}
      />
    </Box>
  );
}

export default UserManagement;