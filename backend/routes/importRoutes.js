const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const { Parser } = require('json2csv');

const importController = require('../controllers/importController');
const { autoMapPolicyType, deriveStatus, generateNoteAI } = require('../utils/dataCleaner');
const { analyzeDataQuality } = require('../utils/dataValidator');
const { Client, Policy } = require('../models');


const upload = multer({ dest: 'uploads/' });


router.post('/map-headers', importController.mapHeaders);


router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ fileName: req.file.filename });
});


router.post('/parse-headers', upload.single('file'), (req, res) => {
  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const headers = xlsx.utils.sheet_to_json(sheet, { header: 1 })[0];
    res.json({ headers });
  } catch (error) {
    console.error('Error parsing Excel headers:', error);
    res.status(500).json({ message: 'Failed to parse Excel headers' });
  }
});


router.post('/preview-data', async (req, res) => {
  try {
    const { fileName, mappedFields } = req.body;
    const filePath = path.join(__dirname, '..', 'uploads', fileName);
    console.log("📂 filePath =", filePath);

    if (!fs.existsSync(filePath)) {
      return res.status(400).json({ error: 'File not found on server.' });
    }

    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = xlsx.utils.sheet_to_json(sheet, { defval: '' });

    const cleaned = rawData.map((row, i) => {
      const result = {};

      for (const [header, mapping] of Object.entries(mappedFields)) {
        const field = typeof mapping === 'object' ? mapping?.suggested : mapping;
        if (field) {
          const matchedKey = Object.keys(row).find(
            (k) => k.trim().toLowerCase() === header.trim().toLowerCase()
          );
          if (matchedKey) {
            result[field] = row[matchedKey];
          }
        }
      }

      result.policy_type_id = autoMapPolicyType(result.product_type);
      result.status = deriveStatus(result.end_date);
      result.note = generateNoteAI(result);

      console.log(`✅ Row ${i + 1} preview:`, result);
      return result;
    });

    res.json({ rows: cleaned });
  } catch (err) {
    console.error('❌ Preview error:', err);
    res.status(500).json({ error: 'Failed to preview data' });
  }
});


router.post('/approve-import', async (req, res) => {
  try {
    const { clients = [], policies = [] } = req.body;

    if (clients.length > 0) await Client.insertMany(clients);
    if (policies.length > 0) await Policy.insertMany(policies);

    res.json({
      message: 'Imported successfully',
      summary: {
        total: clients.length + policies.length,
        clients: clients.length,
        policies: policies.length,
      },
    });
  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ error: 'Failed to import data' });
  }
});


router.post('/export-report', (req, res) => {
  const { rows, warnings } = req.body;

  const parser = new Parser();
  const csv = parser.parse(rows);
  const filename = 'import-report.csv';

  res.header('Content-Type', 'text/csv');
  res.attachment(filename);
  res.send(csv);
});


router.post('/import', async (req, res) => {
  try {
    const importedPolicies = req.body.rows;
    await Policy.insertMany(importedPolicies);
    res.status(200).json({ message: 'Imported successfully', count: importedPolicies.length });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Import failed' });
  }
});

module.exports = router;
