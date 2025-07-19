import React, { useState } from 'react';
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
  IconButton
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

const drawerWidth = 220;
const collapsedWidth = 60;

export default function Sidebar({ activeItem, setActiveItem, userStatus }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const getIcon = (label) => {
    switch (label) {
      case 'Dashboard': return <DashboardIcon />;
      case 'Manage Users': return <PeopleIcon />;
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

  let navigationItems;
  
  if (userStatus === 'Admin') {
    navigationItems = [
      { label: 'Dashboard' },
      { label: 'Manage Users' },
      { label: 'Clients' },
      { label: 'Policies' },
      { label: 'Import' },
      { label: 'Policy Store' },
      { label: 'Schedule' },
    ];
  } else {
    navigationItems = [
      { label: 'Dashboard' },
      { label: 'Clients' },
      { label: 'Policies' },
      { label: 'Import' },
      { label: 'Policy Store' },
      { label: 'Schedule' },
    ];
  }

  const supportItems = [
    { label: 'Settings' },
    { label: 'Help' },
  ];

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: isCollapsed ? collapsedWidth : drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { 
          width: isCollapsed ? collapsedWidth : drawerWidth, 
          boxSizing: 'border-box',
          transition: 'width 0.3s ease',
          overflowX: 'hidden',
        },
      }}
    >
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          px: 1,
        }}
      >
        {!isCollapsed && (
          <Typography variant="h6" noWrap>
            Menu
          </Typography>
        )}
        <IconButton
          onClick={toggleSidebar}
          sx={{
            ml: isCollapsed ? 0 : 'auto',
          }}
        >
          {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Toolbar>
      <Divider />
      <List>
        {navigationItems.map((item) => (
          <ListItem key={item.label} disablePadding>
            <ListItemButton
              selected={activeItem === item.label}
              onClick={() => setActiveItem(item.label)}
              sx={{
                minHeight: 48,
                justifyContent: isCollapsed ? 'center' : 'initial',
                px: 2.5,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: isCollapsed ? 'auto' : 3,
                  justifyContent: 'center',
                }}
              >
                {getIcon(item.label)}
              </ListItemIcon>
              {!isCollapsed && (
                <ListItemText 
                  primary={item.label} 
                  sx={{ opacity: 1 }}
                />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ mt: 10 }} />
      {!isCollapsed && (
        <Box sx={{ px: 2, pt: 4 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Support
          </Typography>
        </Box>
      )}
      <List>
        {supportItems.map((item) => (
          <ListItem key={item.label} disablePadding>
            <ListItemButton
              selected={activeItem === item.label}
              onClick={() => setActiveItem(item.label)}
              sx={{
                minHeight: 48,
                justifyContent: isCollapsed ? 'center' : 'initial',
                px: 2.5,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: isCollapsed ? 'auto' : 3,
                  justifyContent: 'center',
                }}
              >
                {getIcon(item.label)}
              </ListItemIcon>
              {!isCollapsed && (
                <ListItemText 
                  primary={item.label} 
                  sx={{ opacity: 1 }}
                />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}


