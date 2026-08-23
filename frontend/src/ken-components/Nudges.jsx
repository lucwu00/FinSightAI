import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  Stack,
  Box,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Slider from "react-slick";
import CalendarEventModal from "./CalendarEventModal";
import ClientNoteModal from "./ClientNoteModal";

// Import react-slick styles
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

export default function Nudges() {
  const [nudges, setNudges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

  // Modal handlers
  const handleOpenCalendarModal = (nudge) => {
    console.log('Opening calendar modal for nudge:', nudge);
    const clientData = {
      id: nudge.id, // This is the actual clientId
      name: nudge.client.name,
      email: nudge.client.email
    };
    console.log('Setting selectedClient to:', clientData);
    setSelectedClient(clientData);
    setCalendarModalOpen(true);
  };

  const handleCloseCalendarModal = () => {
    setCalendarModalOpen(false);
    setSelectedClient(null);
  };

  const handleOpenNoteModal = (nudge) => {
    console.log('Opening note modal for nudge:', nudge);
    const clientData = {
      id: nudge.id, // This is the actual clientId
      name: nudge.client.name,
      email: nudge.client.email
    };
    console.log('Setting selectedClient to:', clientData);
    setSelectedClient(clientData);
    setNoteModalOpen(true);
  };

  const handleCloseNoteModal = () => {
    setNoteModalOpen(false);
    setSelectedClient(null);
  };

  const handleEventCreated = (event) => {
    console.log('Event created:', event);
    // Optionally show success message
  };

  const handleNoteSaved = (note) => {
    console.log('Note saved:', note);
    // Optionally show success message or update UI
  };

  useEffect(() => {
    async function fetchNudges() {
      try {
        // Get userId from localStorage
        const userId = localStorage.getItem('userId');
        if (!userId) {
          console.warn('No userId found in localStorage');
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/nudges?userId=${userId}`);
        const data = await res.json();
        setNudges(data);
      } catch (err) {
        console.error("Failed to fetch nudges", err);
      } finally {
        setLoading(false);
      }
    }

    fetchNudges();
  }, []);

  const settings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
  };

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden",
      }}
    >
      <CardContent
        sx={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          maxHeight: "100%",
          p: { xs: 1, sm: 2 },
        }}
      >
        <Typography variant="h6" gutterBottom>
          Nudges
        </Typography>

        {loading ? (
          <Box display="flex" justifyContent="center" mt={4}>
            <CircularProgress />
          </Box>
        ) : nudges.length === 0 ? (
          <Typography>No nudges available</Typography>
        ) : (
          <Slider {...settings}>
            {nudges.map((nudge) => (
              <Box key={nudge.id} sx={{ px: 1 }}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  alignItems="flex-start"
                >
                  <Avatar
                    src={nudge.client.profileUrl || ""}
                    alt={nudge.client.name}
                    sx={{ width: 56, height: 56 }}
                  />
                  <Box>
                    <Typography fontWeight="bold">
                      {nudge.client.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {nudge.type}
                    </Typography>
                    <Typography variant="body2" mt={1}>
                      {nudge.message}
                    </Typography>
                  </Box>
                </Stack>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  mt={2}
                  alignItems={{ xs: "stretch", sm: "center" }}
                >
                  <Button
                    fullWidth={isSmall}
                    variant="outlined"
                    size="small"
                    onClick={() => handleOpenCalendarModal(nudge)}
                  >
                    Add to Calendar
                  </Button>
                  <Button
                    fullWidth={isSmall}
                    variant="outlined"
                    size="small"
                    onClick={() => handleOpenNoteModal(nudge)}
                  >
                    Quick Note
                  </Button>
                  <Button
                    fullWidth={isSmall}
                    variant="outlined"
                    size="small"
                    onClick={() =>
                      window.open(`mailto:${nudge.client.email}`, "_blank")
                    }
                  >
                    Email Client
                  </Button>
                </Stack>
              </Box>
            ))}
          </Slider>
        )}
      </CardContent>

      {/* Calendar Event Modal */}
      <CalendarEventModal
        open={calendarModalOpen}
        onClose={handleCloseCalendarModal}
        clientId={selectedClient?.id}
        clientName={selectedClient?.name}
        clientEmail={selectedClient?.email}
        onEventCreated={handleEventCreated}
      />

      {/* Client Note Modal */}
      <ClientNoteModal
        open={noteModalOpen}
        onClose={handleCloseNoteModal}
        clientId={selectedClient?.id}
        clientName={selectedClient?.name}
        onNoteSaved={handleNoteSaved}
      />
    </Card>
  );
}
