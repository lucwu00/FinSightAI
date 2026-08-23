import { useEffect, useState } from 'react';

export default function useMeetings() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMeetings = async () => {
    setLoading(true);
    const res = await fetch('/api/meetings');
    const data = await res.json();
    setMeetings(data);
    setLoading(false);
  };

  const createMeeting = async (meeting) => {
    await fetch('/api/meetings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(meeting)
    });
    await fetchMeetings();
  };

  const updateMeeting = async (id, meeting) => {
    await fetch(`/api/meetings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(meeting)
    });
    await fetchMeetings();
  };

  const deleteMeeting = async (id) => {
    await fetch(`/api/meetings/${id}`, { method: 'DELETE' });
    await fetchMeetings();
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  return {
    meetings,
    loading,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    refetch: fetchMeetings
  };
}