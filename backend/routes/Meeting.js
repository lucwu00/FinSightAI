const express = require('express');
const router = express.Router();
const { Meeting } = require('../models');
const { generateSummary } = require('../services/bedrockService.js');

router.get('/meetings', async (_req, res) => {
  try {
    const meetings = await Meeting.findAll({ order: [['date', 'ASC']] });
    res.json(meetings);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/meetings', async (req, res) => {
  try {
    const meeting = await Meeting.create(req.body);
    res.status(201).json(meeting);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

router.put('/meetings/:id', async (req, res) => {
  try {
    const meeting = await Meeting.findByPk(req.params.id);
    if (!meeting) return res.status(404).json({ error: 'Not found' });
    await meeting.update(req.body);
    res.json(meeting);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

router.delete('/meetings/:id', async (req, res) => {
  try {
    const meeting = await Meeting.findByPk(req.params.id);
    if (!meeting) return res.status(404).json({ error: 'Not found' });
    await meeting.destroy();
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/meetings/:id/generate-summary', async (req, res) => {
  const { id } = req.params;
  try {
    const meeting = await Meeting.findByPk(id);
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });

    const { notes } = req.body;
    if (!notes) return res.status(400).json({ error: 'Notes are required' });

    const summary = await generateSummary(notes);
    await meeting.update({ summary });
    res.json({ summary });
  } catch (err) {
    console.error('Error generating summary:', err);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

module.exports = router;