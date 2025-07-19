import { useState, useEffect } from "react";
import TextField from '@mui/material/TextField';
import Sidebar from '../arfan-components/sidebar';
import Header from '../arfan-components/header';
import { Box, Button } from '@mui/material';
import DataTable from "../arfan-components/dataTable";
import StatsCard from "../arfan-components/statsCard";
import AccountSettings from "../arfan-components/accountSettings";
import DataPrivacyContent from "../arfan-components/DataPrivacy";
import ClientList from "../arfan-components/clientlist";
import AIAnalytics from "../arfan-components/AIAnalytics";
import AnalyticsIcon from '@mui/icons-material/Analytics';

function UserManagement() {
  const [activeItem, setActiveItem] = useState('Dashboard');
  const [userData, setUserData] = useState([]);
  const [search, setSearch] = useState('');
  const [aiAnalyticsOpen, setAiAnalyticsOpen] = useState(false);
  const userStatus = localStorage.getItem('status'); // or get from context/api

  useEffect(() => {
    fetch('/api/userManagement')
      .then(res => res.json())
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

  let content;
  if (activeItem === 'Manage Users') {
    content = (
      <Box>
        <Box sx={{ display: 'flex', gap: 2, mb: 4, mt: 5, alignItems: 'center' }}>
          <StatsCard number={userData.length} label="Total Users" change="+ 66% vs previous month" />
          <StatsCard number="3" label="New Users" change="+ 300% vs previous month" />
          <Button
            variant="contained"
            startIcon={<AnalyticsIcon />}
            onClick={() => setAiAnalyticsOpen(true)}
            sx={{ ml: 'auto' }}
          >
            AI Analytics
          </Button>
        </Box>
        <Box sx={{ ml: 2 }}>
          <TextField
            label="Search by username"
            variant="outlined"
            size="small"
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ mb: 2, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 1 }}
          />
          <DataTable data={filteredUsers} onDelete={handleDelete} onStatusChange={handleStatusChange} />
        </Box>
      </Box>
    );
  } else if (activeItem === 'Clients') {
    content = (
      <Box sx={{ mt: 5, ml: 2 }}>
        <ClientList />
      </Box>
    );
  } else if (activeItem === 'Dashboard') {
    content = <Box sx={{ mt: 5, ml: 2 }}><h2>Dashboard Overview</h2><p>Welcome to your dashboard!</p></Box>;
  } else if (activeItem === 'Policies') {
    content = <Box sx={{ mt: 5, ml: 2 }}><h2>Policies Page</h2></Box>;
  } else if (activeItem === 'Settings') {
    content = (
      <Box sx={{ mt: 5, ml: 2 }}>
        <AccountSettings />
      </Box>
    );
  } else {
    content = <Box sx={{ mt: 5, ml: 2 }}><h2>{activeItem} Page</h2></Box>;
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', width: '100vw', background: '#FFF4F4' }}>
      <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} userStatus={userStatus} />
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'margin-left 0.3s ease'
      }}>
        <Header />
        <Box sx={{ pt: '64px', px: 3, flex: 1 }}>
          {/* main area */}
          {content}          
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