// server/controllers/meetingController.js
import Meeting from '../models/Meeting.js';
import { generateSummary } from '../services/bedrockService.js';

/**
 * Get all meetings.
 * @param {object} _req - Express request object.
 * @param {object} res - Express response object.
 */
export const getMeetings = async (_req, res) => {
  try {
    const meetings = await Meeting.findAll({ order: [['date', 'ASC']] });
    res.json(meetings);
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
};

/**
 * Create a new meeting.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
export const createMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.create(req.body);
    res.status(201).json(meeting);
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ error: 'Failed to create meeting' });
  }
};

/**
 * Update an existing meeting.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
export const updateMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findByPk(req.params.id);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    await meeting.update(req.body);
    res.json(meeting);
  } catch (error) {
    console.error('Error updating meeting:', error);
    res.status(500).json({ error: 'Failed to update meeting' });
  }
};

/**
 * Delete a meeting.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
export const deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findByPk(req.params.id);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    await meeting.destroy();
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting meeting:', error);
    res.status(500).json({ error: 'Failed to delete meeting' });
  }
};

/**
 * Generate a summary for a meeting using Bedrock.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
export const generateMeetingSummary = async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;

  if (!notes) {
    return res.status(400).json({ error: 'Notes are required' });
  }

  try {
    const meeting = await Meeting.findByPk(id);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    const summary = await generateSummary(notes);
    await meeting.update({ summary });
    res.json({ summary });
  } catch (error) {
    console.error('Error generating summary:', error);
    // Be careful not to expose too much internal error detail to the client
    res.status(500).json({ error: 'Failed to generate summary' });
  }
};