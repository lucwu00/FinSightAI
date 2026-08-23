import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Toolbar,
  Divider,
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Policy as PolicyIcon,
  Upload as UploadIcon,
  Store as StoreIcon,
  Schedule as ScheduleIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 220;
const collapsedWidth = 60;

export default function Sidebar({ isCollapsed, setIsCollapsed, userStatus = 'User' }) {
  const navigate = useNavigate();
  const location = useLocation();

  const getIcon = (label) => {
    switch (label) {
      case 'Dashboard': return <DashboardIcon />;
      case 'User Management': return <PeopleIcon />;
      case 'Clients': return <BusinessIcon />;
      case 'Policies': return <PolicyIcon />;
      case 'Import': return <UploadIcon />;
      case 'Policy Store': return <StoreIcon />;
      case 'Schedule': return <ScheduleIcon />;
      case 'Settings': return <SettingsIcon />;
      case 'Help': return <HelpIcon />;
      default: return <DashboardIcon />;
    }
  };

  const getPath = (label) => {
    switch (label) {
      case 'Dashboard': return '/dashboard';
      case 'User Management': return '/userManagement';
      case 'Clients': return '/client';
      case 'Policies': return '/policies';
      case 'Import': return '/import';
      case 'Policy Store': return '/store';
      case 'Schedule': return '/schedule';
      case 'Settings': return '/settings';
      case 'Help': return '/help';
      default: return '/dashboard';
    }
  };

  const navigationItems = userStatus === 'Admin'
    ? ['Dashboard', 'User Management', 'Clients', 'Policies', 'Import', 'Policy Store', 'Schedule']
    : ['Dashboard', 'Clients', 'Policies', 'Import', 'Policy Store'];

  const supportItems = ['Settings', 'Help'];

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const renderItem = (label) => {
    const path = getPath(label);
    const selected = location.pathname.startsWith(path);

    return (
      <ListItem key={label} disablePadding>
        <ListItemButton
          selected={selected}
          onClick={() => navigate(path)}
          sx={{ 
            minHeight: 48, 
            justifyContent: isCollapsed ? 'center' : 'initial', 
            px: 2.5,
            '&.Mui-selected': {
              backgroundColor: 'rgba(25, 118, 210, 0.12)',
            },
          }}
        >
          <ListItemIcon sx={{ 
            minWidth: 0, 
            mr: isCollapsed ? 'auto' : 3, 
            justifyContent: 'center' 
          }}>
            {getIcon(label)}
          </ListItemIcon>
          {!isCollapsed && <ListItemText primary={label} sx={{ opacity: 1 }} />}
        </ListItemButton>
      </ListItem>
    );
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: isCollapsed ? collapsedWidth : drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: isCollapsed ? collapsedWidth : drawerWidth,
          boxSizing: 'border-box',
          overflowX: 'hidden',
          transition: 'width 0.3s ease',
          position: 'fixed',
          height: '100vh',
          background: '#fff',
          borderRight: '1px solid rgba(0, 0, 0, 0.12)',
          zIndex: 1200,
        },
      }}
    >
      <Toolbar sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: isCollapsed ? 'center' : 'space-between', 
        px: 1,
        minHeight: '64px !important'
      }}>
        {!isCollapsed && <Typography variant="h6" noWrap>Menu</Typography>}
        <IconButton onClick={toggleSidebar} sx={{ ml: isCollapsed ? 0 : 'auto' }}>
          {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Toolbar>
      <Divider />
      <List>{navigationItems.map(renderItem)}</List>
      <Divider sx={{ mt: 10 }} />
      {!isCollapsed && (
        <Box sx={{ px: 2, pt: 4 }}>
          <Typography variant="subtitle2" color="text.secondary">Support</Typography>
        </Box>
      )}
      <List>{supportItems.map(renderItem)}</List>
    </Drawer>
  );
}