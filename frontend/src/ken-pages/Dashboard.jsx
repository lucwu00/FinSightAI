import React, { useEffect, useState } from "react";
import { Box, Grid, Typography, Button, Stack, Checkbox, FormGroup, FormControlLabel, Divider, Toolbar, Fab, Zoom } from "@mui/material";
import { Responsive, WidthProvider } from "react-grid-layout";
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import TodoList from "./../ken-components/TodoList";
import Nudges from "./../ken-components/Nudges";
import RecommendedPolicies from "./../ken-components/RecommendedPolicies";
import QueryClient from "./../ken-components/QueryClient";
import WidgetSelector from "./../ken-components/WidgetSelector";
import TopProducts from "./../ken-components/TopProducts";

const ResponsiveGridLayout = WidthProvider(Responsive);

const COMPONENTS = {
  todo: <TodoList />,
  nudges: <Nudges />,
  recommendedPolicies: <RecommendedPolicies />,
  queryClient: <QueryClient />,

  topProducts: <TopProducts />,
};

const DEFAULT_LAYOUT = [
  { i: "todo", x: 7, y: 0, w: 5, h: 4 },
  { i: "queryClient", x: 4, y: 0, w: 3, h: 4 },
  { i: "topProducts", x: 0, y: 3, w: 4, h: 5 },
  { i: "nudges", x: 0, y: 0, w: 4, h: 3 },
  { i: "recommendedPolicies", x: 4, y: 4, w: 8, h: 4 }
];

// Create lookup object from the layout array for easy access
const DEFAULT_WIDGET_LAYOUTS = DEFAULT_LAYOUT.reduce((acc, item) => {
  acc[item.i] = item;
  return acc;
}, {});

const ALL_KEYS = Object.keys(COMPONENTS);

export default function Dashboard() {
  const [layout, setLayout] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedWidgets, setSelectedWidgets] = useState(new Set());

  // Get userId from localStorage
  const userId = localStorage.getItem('userId');

  // Load layout from backend
  useEffect(() => {
    if (!userId) {
      console.warn('No userId found in localStorage');
      return;
    }

    fetch(`/api/users/layout-preference?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        const loaded = data?.layoutPreferences ? JSON.parse(data.layoutPreferences) : DEFAULT_LAYOUT;
        setLayout(loaded);
        setSelectedWidgets(new Set(loaded.map((item) => item.i)));
      });
  }, [userId]);

  // When user drags, update layout
  const onLayoutChange = (newLayout) => {
    setLayout(newLayout);
  };

  // Save layout + selected widgets
  const saveLayout = () => {
    if (!userId) {
      console.warn('No userId found in localStorage, cannot save layout');
      return;
    }

    const filteredLayout = layout.filter((item) => selectedWidgets.has(item.i));

    fetch("/api/users/layout-preference", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: parseInt(userId), layoutPreferences: JSON.stringify(filteredLayout) }),
    })
    .then(response => response.json())
    .then(data => {
      if (!data.success) {
        console.error('Failed to save layout preferences');
      }
    })
    .catch(error => {
      console.error('Error saving layout preferences:', error);
    });
    setLayout(filteredLayout);
    setIsEditMode(false);
  };

  // Add widget if checked, remove if unchecked
  const toggleWidget = (key) => {
    const newSet = new Set(selectedWidgets);
    if (newSet.has(key)) {
      newSet.delete(key);
      setLayout((prev) => prev.filter((item) => item.i !== key));
    } else {
      newSet.add(key);
      setLayout((prev) => [
        ...prev,
        {
          ...DEFAULT_WIDGET_LAYOUTS[key],
          y: Infinity, // So it appears at the bottom
        },
      ]);
    }
    setSelectedWidgets(newSet);
  };

  return (
    <Box sx={{ 
      width: '100%', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      position: 'relative',
      p: 2
    }}>
      {/* Edit Mode Overlay */}
      <Box
        sx={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: '300px',
          bgcolor: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(4px)',
          boxShadow: 4,
          transform: isEditMode ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease-in-out',
          zIndex: 10000,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Box sx={{ 
          p: 2, 
          bgcolor: 'rgb(219, 68, 149)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Typography variant="h6">
            Edit Widgets
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            size="small"
            onClick={saveLayout}
            startIcon={<SaveIcon />}
            sx={{ 
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.3)'
              }
            }}
          >
            Save
          </Button>
        </Box>
        <Divider />
        <Box sx={{ 
          p: 2,
          flex: 1,
          overflowY: 'auto'
        }}>
          <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
            Select widgets to display:
          </Typography>
          <WidgetSelector
            allKeys={ALL_KEYS}
            selected={selectedWidgets}
            toggle={toggleWidget}
          />
        </Box>
      </Box>

      {/* Floating Edit Button */}
      <Zoom in={!isEditMode}>
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000
          }}
          onClick={() => setIsEditMode(true)}
        >
          <EditIcon />
        </Fab>
      </Zoom>
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
        cols={{ lg: 12, md: 12, sm: 12, xs: 12 }}
        rowHeight={100}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        style={{
          minHeight: '100%',
          width: '100%'
        }}
        onLayoutChange={onLayoutChange}
        compactType="vertical"
        margin={[16, 16]}
        containerPadding={[0, 0]}
      >
        {layout
          .filter((item) => selectedWidgets.has(item.i))
          .map((item) => (
            <Box
              key={item.i}
              data-grid={item}
              sx={{
                width: '100%',
                height: '100%',
                bgcolor: 'background.paper',
                borderRadius: 2,
                boxShadow: isEditMode ? 2 : 1,
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: isEditMode ? 4 : 1,
                  transform: isEditMode ? 'scale(1.01)' : 'none',
                },
                p: 2
              }}
            >
              {COMPONENTS[item.i]}
            </Box>
          ))}
      </ResponsiveGridLayout>
    </Box>
  );
}