import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, Button, TextField, CircularProgress, Alert, Paper } from '@mui/material';

export default function MeetingSummary({ meeting, onSummaryUpdated }) {
  const [localNotes, setLocalNotes] = useState(meeting.notes || '');
  const [generatedSummary, setGeneratedSummary] = useState(meeting.summary || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Update local state when the 'meeting' prop changes (e.g., a new meeting is selected)
  useEffect(() => {
    setLocalNotes(meeting.notes || '');
    setGeneratedSummary(meeting.summary || ''); // Display existing summary if available
    setError(null); // Clear errors for new meeting selection
  }, [meeting]);

  const handleGenerateSummary = async () => {
    if (!localNotes.trim()) {
      setError("Please enter some notes to summarize.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Make the API call to your backend endpoint
      const response = await axios.post(`/api/meetings/${meeting.id}/generate-summary`, { notes: localNotes });
      const newSummary = response.data.summary;

      setGeneratedSummary(newSummary); // Update the local state for display
      onSummaryUpdated(meeting.id, newSummary); // Propagate up to update the main meetings list

    } catch (err) {
      console.error("Error generating summary:", err);
      // Check if the error is from the Bedrock safety filter
      if (err.response && err.response.data && err.response.data.error && err.response.data.error.includes("comfortably summarizing those meeting notes")) {
        setError("Summary generation failed: Content may violate safety guidelines. Please review the notes.");
      } else {
        setError(err.message || "Failed to generate summary. Please try again.");
      }
      setGeneratedSummary("Error generating summary."); // Provide a fallback message for display
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Paper elevation={2} sx={{ padding: 3, marginTop: 4, bgcolor: (theme) => theme.palette.background.paper }}>
      <Typography variant="h5" gutterBottom>
        Summary for Meeting with {meeting.name} ({new Date(meeting.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })})
      </Typography>

      <Typography variant="h6" mt={2} mb={1}>
        Meeting Notes Input:
      </Typography>
      <TextField
        multiline
        rows={6}
        fullWidth
        variant="outlined"
        placeholder="Enter key points or sentences from the meeting here for AI summarization..."
        value={localNotes}
        onChange={(e) => setLocalNotes(e.target.value)}
        disabled={isLoading}
        sx={{ mb: 2 }}
      />
      <Button
        variant="contained"
        onClick={handleGenerateSummary}
        disabled={isLoading || !localNotes.trim()}
        sx={{ mb: 2 }}
        startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
      >
        {isLoading ? "Generating..." : "GENERATE SUMMARY"}
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Typography variant="h6" mt={2} mb={1}>
        Summary:
      </Typography>
      <Box
        sx={{
          minHeight: '100px',
          border: '1px solid',
          borderColor: (theme) => theme.palette.divider,
          borderRadius: '4px',
          padding: 2,
          bgcolor: (theme) => theme.palette.background.default,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        <Typography variant="body1">
          {generatedSummary || "Summary will appear here after generation."}
        </Typography>
      </Box>
    </Paper>
  );
}