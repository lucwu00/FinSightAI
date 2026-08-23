// userManaexport default function Dashboard() {
  const [activeItem, setActiveItem] = useState('Dashboard');
  const [userData, setUserData] = useState([]);
  const [aiAnalyticsOpen, setAiAnalyticsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);jsx
import React, { useState, useEffect } from 'react';
import { Box, Container, Button, TextField, Typography } from '@mui/material';
import Sidebar from './sidebar';
import Header from './header';
import StatsCard from './statsCard';
import DeleteIcon from '@mui/icons-material/Delete';
import DataTable from './dataTable'; // Import the DataTable component
import AIAnalytics from './AIAnalytics'; // Import the AI Analytics component
import AnalyticsIcon from '@mui/icons-material/Analytics';

export default function Dashboard() {
  const [activeItem, setActiveItem] = useState('Dashboard');
  const [userData, setUserData] = useState([]);
  const [aiAnalyticsOpen, setAiAnalyticsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch('/api/userManagement')
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch users');
        }
        return res.json();
      })
      .then(data => {
        setUserData(data);
        setError(null);
      })
      .catch(err => {
        console.error('Failed to fetch users:', err);
        setError('Failed to load user data');
        setUserData([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);


  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        setUserData(prev => prev.filter(user => user.id !== userId));
      } else {
        alert('Failed to delete user');
      }
    } catch (err) {
      alert('Error deleting user');
    }
  };

  // Filter users based on search
  const filteredUsers = userData.filter(user =>
    user.username?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase())
  );


  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar 
        activeItem={activeItem} 
        setActiveItem={setActiveItem}
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
      />
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'margin-left 0.3s ease'
      }}>
        <Header isCollapsed={sidebarCollapsed} />
        <Container sx={{ mt: 4 }}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <Typography>Loading users...</Typography>
            </Box>
          )}
          
          {error && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <Typography color="error">{error}</Typography>
            </Box>
          )}
          
          {!loading && !error && (
            <>
              <Box sx={{ display: 'flex', gap: 2, mb: 4, alignItems: 'center' }}>
                <StatsCard 
                  number={userData.length} 
                  label="Total Users" 
                  change="+ 66% vs previous month" 
                />
              </Box>
              
              {/* Search Bar and AI Analytics Button */}
              <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
                <TextField
                  label="Search by username or email"
                  variant="outlined"
                  size="small"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  sx={{ 
                    backgroundColor: 'rgba(255,255,255,0.7)', 
                    borderRadius: 1,
                    flex: 1,
                    maxWidth: 400
                  }}
                />
                <Button
                  variant="contained"
                  startIcon={<AnalyticsIcon />}
                  onClick={() => setAiAnalyticsOpen(true)}
                  sx={{ 
                    height: 40,
                    minWidth: 140
                  }}
                >
                  AI Analytics
                </Button>
              </Box>
              
              {/* User Table */}
              <DataTable data={filteredUsers} onDelete={handleDelete} /> {/* Use the DataTable component */}
          
          {/* AI Analytics Dialog */}
          <AIAnalytics 
            open={aiAnalyticsOpen} 
            onClose={() => setAiAnalyticsOpen(false)}
            userData={userData}
          />
            </>
          )}
        </Container>
      </Box>
    </Box>
  );
}