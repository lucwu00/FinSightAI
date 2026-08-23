import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Stack,
  Avatar,
  Box,
  MenuItem,
  Grid,
  Button,
  Popover,
  Checkbox,
  FormControlLabel,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import EmailIcon from "@mui/icons-material/Email";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ClientNoteModal from "./ClientNoteModal";
import CalendarEventModal from "./CalendarEventModal";

const riskProfiles = ["Conservative", "Balanced", "Aggressive"];
const incomeBrackets = ["<30k", "30k-60k", "60k-100k", "100k+"];

export default function QueryClient() {
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [incomeFilter, setIncomeFilter] = useState("");
  const [clients, setClients] = useState([]);

  // Note modal state
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  
  // Calendar modal state
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);

  const navigate = useNavigate(); 

  // For filter popover
  const [anchorEl, setAnchorEl] = useState(null);
  const filtersOpen = Boolean(anchorEl);
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchClients();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query, riskFilter, incomeFilter]);

  async function fetchClients() {
    const params = new URLSearchParams();
    if (query) params.append("query", query);
    if (riskFilter) params.append("riskProfile", riskFilter);
    if (incomeFilter) params.append("incomeBracket", incomeFilter);
    
    // Add userId from localStorage
    const userId = localStorage.getItem('userId');
    if (userId) params.append("userId", userId);

    try {
      const res = await fetch(`/api/clients/search?${params.toString()}`);
      const data = await res.json();
      setClients(data);
    } catch (err) {
      console.error("Failed to fetch clients", err);
    }
  }

  const handleFilterClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setAnchorEl(null);
  };

  const handleOpenNoteModal = (client) => {
    setSelectedClient(client);
    setNoteModalOpen(true);
  };

  const handleCloseNoteModal = () => {
    setNoteModalOpen(false);
    setSelectedClient(null);
  };

  const handleNoteSaved = (note) => {
    // Optionally update the client in the local state
    if (selectedClient) {
      setClients(prevClients => 
        prevClients.map(client => 
          client.clientId === selectedClient.clientId 
            ? { ...client, notes: note }
            : client
        )
      );
    }
  };

  const handleOpenCalendarModal = (client) => {
    setSelectedClient(client);
    setCalendarModalOpen(true);
  };

  const handleCloseCalendarModal = () => {
    setCalendarModalOpen(false);
    setSelectedClient(null);
  };

  const handleEventCreated = (event) => {
    // Optionally update local state or show success message
    console.log('Event created:', event);
  };

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <CardContent
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          paddingBottom: "8px !important",
        }}
      >
        <Typography variant="h6" gutterBottom>
          Query Clients
        </Typography>

        {/* Search bar + Filters button */}
        <Stack
          direction={isSmall ? "column" : "row"}
          spacing={2}
          mb={2}
          alignItems="center"
          sx={{ flexWrap: "wrap" }}
        >
          <TextField
            placeholder="Search by name or id"
            value={query}
            size="small"
            onChange={(e) => setQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1, minWidth: 0 }}
          />
          <Button
            variant={filtersOpen ? "contained" : "outlined"}
            startIcon={<FilterListIcon />}
            onClick={handleFilterClick}
            sx={{ minWidth: 120 }}
          >
            Filters
          </Button>
        </Stack>

        {/* Filters Popover */}
        <Popover
          open={filtersOpen}
          anchorEl={anchorEl}
          onClose={handleFilterClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
        >
          <Box sx={{ p: 2, minWidth: 220 }}>
            <Typography variant="subtitle1" gutterBottom>
              Risk Profile
            </Typography>
            {riskProfiles.map((rp) => (
              <FormControlLabel
                key={`risk-${rp}`}
                control={
                  <Checkbox
                    checked={riskFilter === rp}
                    onChange={() => setRiskFilter(riskFilter === rp ? "" : rp)}
                  />
                }
                label={rp}
              />
            ))}

            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              Income Bracket
            </Typography>
            {incomeBrackets.map((ib) => (
              <FormControlLabel
                key={`income-${ib}`}
                control={
                  <Checkbox
                    checked={incomeFilter === ib}
                    onChange={() => setIncomeFilter(incomeFilter === ib ? "" : ib)}
                  />
                }
                label={ib}
              />
            ))}

            {/* Clear Filters button */}
            <Button
              variant="text"
              onClick={() => {
                setRiskFilter("");
                setIncomeFilter("");
              }}
              sx={{ mt: 2 }}
              fullWidth
            >
              Clear Filters
            </Button>
          </Box>
        </Popover>

        {/* Results */}
        <Box sx={{ flex: 1, overflowY: "auto" }}>
          {clients.map((client) => (
            <Grid
              key={`client-${client.clientId || client.id}`}
              container
              alignItems="center"
              spacing={1}
              sx={{
                py: 1,
                px: 1,
                borderBottom: "1px solid #e0e0e0",
                flexWrap: "wrap",
              }}
            >
              <Grid item>
                <Avatar alt={client.fullName} src={client.profileUrl || ""} />
              </Grid>
              <Grid item xs={12} sm>
                <Typography fontWeight="bold">{client.fullName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  ID: {client.id}
                </Typography>
              </Grid>
              <Grid item>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <IconButton size="small" onClick={() => handleOpenCalendarModal(client)}>
                    <CalendarTodayIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleOpenNoteModal(client)}>
                    <NoteAddIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => window.open(`mailto:${client.email}`, "_blank")}
                  >
                    <EmailIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/client/${client.clientId}`)}
                  >
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Grid>
            </Grid>
          ))}
        </Box>
      </CardContent>

      {/* Client Note Modal */}
      <ClientNoteModal
        open={noteModalOpen}
        onClose={handleCloseNoteModal}
        clientId={selectedClient?.clientId}
        clientName={selectedClient?.fullName}
        onNoteSaved={handleNoteSaved}
      />

      {/* Calendar Event Modal */}
      <CalendarEventModal
        open={calendarModalOpen}
        onClose={handleCloseCalendarModal}
        clientId={selectedClient?.clientId}
        clientName={selectedClient?.fullName}
        clientEmail={selectedClient?.email}
        onEventCreated={handleEventCreated}
      />
    </Card>
  );
}
