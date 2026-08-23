import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Checkbox,
  Box,
  Select,
  MenuItem,
  Chip,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Tooltip,
  Badge,
  LinearProgress
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Flag as FlagIcon,
  Event as EventIcon,
  Category as CategoryIcon,
  Sort as SortIcon,
  FilterList as FilterIcon
} from "@mui/icons-material";
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { format, isAfter, isBefore, isToday } from 'date-fns';

const PRIORITIES = {
  HIGH: { label: 'High', color: '#ef5350' },
  MEDIUM: { label: 'Medium', color: '#fb8c00' },
  LOW: { label: 'Low', color: '#66bb6a' }
};

const CATEGORIES = {
  WORK: { label: 'Work', color: '#42a5f5' },
  PERSONAL: { label: 'Personal', color: '#ab47bc' },
  SHOPPING: { label: 'Shopping', color: '#26a69a' },
  HEALTH: { label: 'Health', color: '#ec407a' },
  OTHER: { label: 'Other', color: '#7e57c2' }
};

export default function TodoList() {
  const [todos, setTodos] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    task: "",
    priority: "MEDIUM",
    category: "WORK",
    dueDate: new Date(),
  });
  const [filter, setFilter] = useState({
    priority: "ALL",
    category: "ALL",
    completed: "ALL"
  });
  const [sortBy, setSortBy] = useState("dueDate");

  // Fetch on mount
  useEffect(() => {
    // Get userId from localStorage
    const userId = localStorage.getItem('userId');
    if (!userId) {
      console.warn('No userId found in localStorage');
      return;
    }

    fetch(`/api/todos?userId=${userId}`)
      .then((res) => res.json())
      .then(todos => {
        // Ensure each todo has all required fields with defaults
        const normalizedTodos = todos.map(todo => ({
          ...todo,
          priority: todo.priority || "MEDIUM",
          category: todo.category || "WORK",
          dueDate: todo.dueDate ? new Date(todo.dueDate) : new Date(),
          completed: !!todo.completed
        }));
        setTodos(normalizedTodos);
      });
  }, []);

  const addTodo = async () => {
    if (!newTask.task.trim()) return;
    
    // Get userId from localStorage
    const userId = localStorage.getItem('userId');
    if (!userId) {
      console.warn('No userId found in localStorage');
      return;
    }

    const res = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newTask,
        userId: parseInt(userId),
        completed: false
      }),
    });
    const created = await res.json();
    setTodos((prev) => [...prev, created]);
    setNewTask({
      task: "",
      priority: "MEDIUM",
      category: "WORK",
      dueDate: new Date(),
    });
    setDialogOpen(false);
  };

  const deleteTodo = async (id) => {
    await fetch(`/api/todos/${id}`, { method: "DELETE" });
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleComplete = async (id) => {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    const updated = { 
      ...todo, 
      completed: !todo.completed,
      // Ensure these fields exist when updating
      priority: todo.priority || "MEDIUM",
      category: todo.category || "WORK",
      dueDate: todo.dueDate ? new Date(todo.dueDate) : new Date()
    };

    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      
      if (res.ok) {
        setTodos((prev) =>
          prev.map((t) => (t.id === id ? updated : t))
        );
      }
    } catch (error) {
      console.error("Failed to update todo:", error);
    }
  };

  const filteredTodos = todos
    .filter(todo => {
      if (filter.priority !== "ALL" && todo.priority !== filter.priority) return false;
      if (filter.category !== "ALL" && todo.category !== filter.category) return false;
      if (filter.completed === "COMPLETE" && !todo.completed) return false;
      if (filter.completed === "INCOMPLETE" && todo.completed) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "priority":
          return Object.keys(PRIORITIES).indexOf(b.priority) - Object.keys(PRIORITIES).indexOf(a.priority);
        case "dueDate":
          return new Date(a.dueDate) - new Date(b.dueDate);
        default:
          return 0;
      }
    });

  const getProgress = () => {
    if (!todos.length) return 0;
    return (todos.filter(t => t.completed).length / todos.length) * 100;
  };

  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardContent
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header with Progress */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6">
              To-Do List
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {todos.filter(t => t.completed).length}/{todos.length} completed
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={getProgress()} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              backgroundColor: 'rgba(0,0,0,0.1)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#66bb6a'
              }
            }} 
          />
        </Box>

        {/* Controls */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
            sx={{ flexGrow: 1 }}
          >
            Add Task
          </Button>
          <Tooltip title="Sort">
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                startAdornment={
                  <InputAdornment position="start">
                    <SortIcon fontSize="small" />
                  </InputAdornment>
                }
              >
                <MenuItem value="dueDate">Due Date</MenuItem>
                <MenuItem value="priority">Priority</MenuItem>
              </Select>
            </FormControl>
          </Tooltip>
        </Box>

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={filter.priority}
              onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
              startAdornment={
                <InputAdornment position="start">
                  <FlagIcon fontSize="small" />
                </InputAdornment>
              }
            >
              <MenuItem value="ALL">All Priorities</MenuItem>
              {Object.entries(PRIORITIES).map(([key, { label }]) => (
                <MenuItem key={key} value={key}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={filter.category}
              onChange={(e) => setFilter({ ...filter, category: e.target.value })}
              startAdornment={
                <InputAdornment position="start">
                  <CategoryIcon fontSize="small" />
                </InputAdornment>
              }
            >
              <MenuItem value="ALL">All Categories</MenuItem>
              {Object.entries(CATEGORIES).map(([key, { label }]) => (
                <MenuItem key={key} value={key}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={filter.completed}
              onChange={(e) => setFilter({ ...filter, completed: e.target.value })}
            >
              <MenuItem value="ALL">All Status</MenuItem>
              <MenuItem value="COMPLETE">Completed</MenuItem>
              <MenuItem value="INCOMPLETE">Incomplete</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Todo List */}
        <Box sx={{ overflowY: "auto", flex: 1 }}>
          <List dense>
            {filteredTodos.map((todo) => (
              <ListItem
                key={todo.id}
                sx={{
                  mb: 1,
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  boxShadow: 1,
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
                secondaryAction={
                  <IconButton edge="end" onClick={() => deleteTodo(todo.id)}>
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <Checkbox
                  checked={todo.completed}
                  onChange={() => toggleComplete(todo.id)}
                  sx={{
                    color: PRIORITIES[todo.priority].color,
                    '&.Mui-checked': {
                      color: PRIORITIES[todo.priority].color,
                    },
                  }}
                />
                <Box sx={{ ml: 1, flexGrow: 1 }}>
                  <ListItemText
                    primary={todo.task}
                    sx={{
                      textDecoration: todo.completed ? "line-through" : "none",
                      opacity: todo.completed ? 0.7 : 1,
                    }}
                    secondary={
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        <Chip
                          size="small"
                          label={PRIORITIES[todo.priority].label}
                          sx={{ 
                            bgcolor: PRIORITIES[todo.priority].color + '20',
                            color: PRIORITIES[todo.priority].color,
                            fontWeight: 'medium'
                          }}
                        />
                        <Chip
                          size="small"
                          label={CATEGORIES[todo.category].label}
                          sx={{ 
                            bgcolor: CATEGORIES[todo.category].color + '20',
                            color: CATEGORIES[todo.category].color,
                            fontWeight: 'medium'
                          }}
                        />
                        <Chip
                          size="small"
                          icon={<EventIcon sx={{ fontSize: '16px !important' }} />}
                          label={format(new Date(todo.dueDate), 'MMM d')}
                          color={isAfter(new Date(todo.dueDate), new Date()) ? "default" : "error"}
                          variant="outlined"
                        />
                      </Box>
                    }
                  />
                </Box>
              </ListItem>
            ))}
          </List>
        </Box>
      </CardContent>

      {/* Add Task Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Task</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              autoFocus
              fullWidth
              label="Task"
              value={newTask.task}
              onChange={(e) => setNewTask({ ...newTask, task: e.target.value })}
            />
            
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={newTask.priority}
                label="Priority"
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
              >
                {Object.entries(PRIORITIES).map(([key, { label, color }]) => (
                  <MenuItem key={key} value={key}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FlagIcon sx={{ color }} />
                      {label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={newTask.category}
                label="Category"
                onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
              >
                {Object.entries(CATEGORIES).map(([key, { label, color }]) => (
                  <MenuItem key={key} value={key}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CategoryIcon sx={{ color }} />
                      {label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Due Date"
                value={newTask.dueDate}
                onChange={(newValue) => setNewTask({ ...newTask, dueDate: newValue })}
              />
            </LocalizationProvider>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={addTodo} variant="contained" disabled={!newTask.task.trim()}>
            Add Task
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
