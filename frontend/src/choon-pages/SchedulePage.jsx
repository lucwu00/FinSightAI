import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper
} from '@mui/material';

import MeetingForm from '../choon-components/MeetingForm';
import MeetingList from '../choon-components/MeetingList';
import useMeetings from '../choon-hooks/useMeetings';
import MeetingSummary from '../choon-components/MeetingSummary'; // <--- UNCOMMENT THIS LINE
import Header from '../choon-components/Header';

export default function SchedulePage({ dark, toggleTheme }) {
  const [currentName, setCurrentName] = useState('Cheryl Lim');
  
  const {
    meetings,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    // Assuming useMeetings also has a way to update a single meeting's summary
    // This might be provided by a custom setter or a re-fetch function
    fetchMeetings // <--- Add this if useMeetings has a function to re-fetch
  } = useMeetings();

  const [showForm, setShowForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);

  // Track selected meeting to show summary box
  const [selectedSummaryMeeting, setSelectedSummaryMeeting] = useState(null);

  const handleNew = () => {
    setEditingMeeting(null);
    setShowForm(true);
  };

  const handleEdit = (meeting) => {
    setEditingMeeting(meeting);
    setShowForm(true);
  };

  const handleDelete = async (meeting) => {
    if (!meeting?.id) {
      alert("Meeting ID is missing. Cannot delete.");
      return;
    }
    if (window.confirm(`Delete meeting for ${meeting.name}?`)) {
      await deleteMeeting(meeting.id);
      if (selectedSummaryMeeting?.id === meeting.id) setSelectedSummaryMeeting(null);
    }
  };

  const handleSave = async (meeting) => {
    if (editingMeeting?.id) {
      await updateMeeting(editingMeeting.id, meeting);
    } else {
      await createMeeting(meeting);
    }
    setShowForm(false);
    setEditingMeeting(null);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingMeeting(null);
  };

  const handleSummaryIconClick = (meeting) => {
    // If clicking the same meeting, close the summary; otherwise, open it.
    setSelectedSummaryMeeting(
      selectedSummaryMeeting?.id === meeting.id ? null : meeting
    );
  };

  // This function is crucial for updating the summary in the UI
  const handleSummaryUpdated = (meetingId, newSummary) => {
    // This function needs to update the `meetings` state from `useMeetings`
    // so that the summary is reflected in the MeetingList and potentially
    // when the selectedSummaryMeeting is re-rendered.

    // Option 1: If `useMeetings` provides a setter like `setMeetings`
    // const updatedMeetings = meetings.map(m =>
    //   m.id === meetingId ? { ...m, summary: newSummary } : m
    // );
    // setMeetings(updatedMeetings); // Assuming setMeetings is exposed by useMeetings

    // Option 2: If `useMeetings` has a refetch function (most robust)
    // This will refetch all meetings and ensure data consistency.
    if (fetchMeetings) {
      fetchMeetings(); // Assuming fetchMeetings is a function to re-pull data
    } else {
      // Fallback: If no direct setter or refetch, try to manually update
      // This might not cause a re-render if `meetings` is not shallowly changed
      // and selectedSummaryMeeting is not explicitly updated.
      // A simple map might not be enough if the original object reference persists
      // and the component isn't re-rendering due to it.
      const meetingToUpdate = meetings.find(m => m.id === meetingId);
      if (meetingToUpdate) {
        meetingToUpdate.summary = newSummary;
        // You might need to force a re-render if using this method without a setter
        setSelectedSummaryMeeting({ ...selectedSummaryMeeting, summary: newSummary });
      }
    }

    console.log(`Summary for meeting ${meetingId} updated to:`, newSummary);
  };

  return (
    <Box sx={{ 
      flex: 1, 
      overflow: 'auto',
      backgroundColor: '#FFF4F4',
      paddingTop: '80px' // Add padding to account for header height
    }}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ padding: 3, bgcolor: (theme) => theme.palette.background.paper }}>
          <Header
            currentName={currentName}
            setCurrentName={setCurrentName}
            dark={dark}
            toggleTheme={toggleTheme}
          />

              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h4">Schedule</Typography>
                <Button variant="contained" onClick={handleNew}>
                  Schedule New Meeting
                </Button>
              </Box>

            {/* Meeting Table with icon click to open summary */}
            <MeetingList
              meetings={meetings}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSummaryIconClick={handleSummaryIconClick}
              openSummaryId={selectedSummaryMeeting?.id || null}
              onSummaryUpdated={handleSummaryUpdated}
            />

            {selectedSummaryMeeting && (
              <Box mt={4}>
                <MeetingSummary
                  meeting={selectedSummaryMeeting}
                  onSummaryUpdated={handleSummaryUpdated}
                />
              </Box>
            )}

            <MeetingForm
              open={showForm}
              editing={editingMeeting}
              onSave={handleSave}
              onClose={handleClose}
            />
          </Paper>
        </Container>
    </Box>
  );
}