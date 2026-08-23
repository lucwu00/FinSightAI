const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const { Parser } = require('json2csv');
const OpenAI = require('openai');

const importController = require('../controllers/importController');
const { 
  autoMapPolicyType, 
  deriveStatus, 
  generateNoteAI, 
  generateNewClientIdSmart 
} = require('../utils/dataCleaner');
const { analyzeDataQuality } = require('../utils/dataValidator');
const { Client, Policy } = require('../models');

const upload = multer({ dest: 'uploads/' });

let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  console.log('✅ OpenAI initialized for hybrid AI strategy');
} else {
  console.log('⚠️ OpenAI API key not found - AI enhancement will be unavailable');
}

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

router.post('/preview', async (req, res) => {
  try {
    const { fileName, mappedFields } = req.body;
    const filePath = path.join(__dirname, '..', 'uploads', fileName);
    
    console.log("📂 Processing file:", filePath);
    console.log("📥 Mapped fields:", mappedFields);

    if (!fs.existsSync(filePath)) {
      return res.status(400).json({ error: 'File not found on server.' });
    }

    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = xlsx.utils.sheet_to_json(sheet, { defval: '' });

    const existingClients = await Client.findAll({ attributes: ['clientId'] });
    const existingClientIds = existingClients.map(c => c.clientId);

    const processedClientIds = [];

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

      const normalizedResult = {
        clientId: result.clientId || result.client_id || '',
        fullName: result.fullName || result.full_name || '',
        email: result.email || '',
        phone: result.phone || '',
        nric: result.nric || '',
        policyName: result.policyName || result.productType || result.product_type || '',
        policyTypeId: result.policyTypeId || result.policy_type_id || '',
        fundTypeILP: result.fundTypeILP || result.fund_type || '',
        premium: result.premium || result.premiumAmount || result.premium_amount || '',
        premiumFrequency: result.premiumFrequency || result.premium_frequency || 'Monthly',
        startDate: result.startDate || result.start_date || '',
        endDate: result.endDate || result.end_date || '',
        policyId: result.policyId || '',
        policyName: result.policyName || result.productType || 'Policy',
        provider: result.provider || 'AIA',
        coverageAmount: result.coverageAmount || 100000,
        status: result.status || 'Active',
        advisorId: result.advisorId || 1,
        recommended: result.recommended ?? false,
      };

      if (!normalizedResult.clientId && normalizedResult.fullName) {
        const allUsedIds = [...existingClientIds, ...processedClientIds];
        normalizedResult.clientId = generateNewClientIdSmart(normalizedResult.fullName, allUsedIds);
      }

      if (normalizedResult.clientId) {
        processedClientIds.push(normalizedResult.clientId);
      }

      if (normalizedResult.policyName && !normalizedResult.policyTypeId) {
        normalizedResult.policyTypeId = autoMapPolicyType(normalizedResult.policyName);
      }

if (!normalizedResult.policyId && normalizedResult.clientId && normalizedResult.policyTypeId) {
  normalizedResult.policyId = `${normalizedResult.clientId}-${normalizedResult.policyTypeId}`;
}

if (normalizedResult.endDate) {
  normalizedResult.status = deriveStatus(normalizedResult.endDate);
}

normalizedResult.note = generateNoteAI(normalizedResult, existingClientIds);

normalizedResult.validationMethod = 'algorithmic';
normalizedResult.enhancedByAI = false;

      if (normalizedResult.endDate) {
        normalizedResult.status = deriveStatus(normalizedResult.endDate);
      }
      normalizedResult.note = generateNoteAI(normalizedResult, existingClientIds);
      
      normalizedResult.validationMethod = 'algorithmic';
      normalizedResult.enhancedByAI = false;

      console.log(`✅ Row ${i + 1} processed (algorithmic):`, normalizedResult);
      return normalizedResult;
    });

    const warnings = [];
    let criticalErrorCount = 0;
    
    cleaned.forEach((row, index) => {
      if (!row.fullName) warnings.push({ row: index, field: 'fullName', message: 'Missing full name' });
      if (!row.clientId) warnings.push({ row: index, field: 'clientId', message: 'Missing client ID' });
      if (!row.email) warnings.push({ row: index, field: 'email', message: 'Missing email' });
      if (!row.nric) warnings.push({ row: index, field: 'nric', message: 'Missing NRIC' });
      if (!row.productType) warnings.push({ row: index, field: 'productType', message: 'Missing product type' });
      
      if (row.email && !/\S+@\S+\.\S+/.test(row.email)) {
        warnings.push({ row: index, field: 'email', message: 'Invalid email format' });
      }
      
      if (row.phone && !/^\+65\s?\d{8}$/.test(row.phone)) {
        warnings.push({ row: index, field: 'phone', message: 'Invalid phone format (should be +65 XXXXXXXX)' });
      }

      if (row.note && row.note.includes('❌')) {
        criticalErrorCount++;
      }
    });

    res.json({ 
      rows: cleaned,
      warnings: warnings,
      summary: {
        totalRows: cleaned.length,
        warningsCount: warnings.length,
        criticalErrors: criticalErrorCount,
        autoGeneratedIds: cleaned.filter(r => r.clientId && r.fullName).length,
        validationMethod: 'algorithmic',
        aiEnhancementAvailable: !!openai
      }
    });

  } catch (err) {
    console.error('❌ Preview error:', err);
    res.status(500).json({ error: 'Failed to preview data', details: err.message });
  }
});

// Make sure you have these routes in your importRoutes.js
router.post('/import-approved-data', importController.importApprovedData);
router.post('/confirm-import', importController.confirmImport);
router.post('/cancel-preview', importController.cancelPreview);

// NEW: AI Enhancement Endpoint for Individual Rows
router.post('/enhance-row', async (req, res) => {
  try {
    const { rowData, existingClientIds = [] } = req.body;
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.development') });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are a Singapore insurance data quality assistant.

A financial advisor is importing client data and this row has validation errors. Analyze the data and provide specific, actionable guidance.

CLIENT ROW:
- Name: ${rowData.fullName || 'Missing'}
- NRIC: ${rowData.nric || 'Missing'}
- Email: ${rowData.email || 'Missing'}
- Phone: ${rowData.phone || 'Missing'}
- Policy: ${rowData.policyName || 'Missing'}
- Coverage: ${rowData.coverageAmount || 'Missing'}
- Premium: ${rowData.premium || 'Missing'}
- Fund Type: ${rowData.fundTypeILP || 'N/A'}
- Start Date: ${rowData.startDate || 'Missing'}
- End Date: ${rowData.endDate || 'Missing'}

CURRENT ERRORS: ${rowData.note || 'None'}

Tasks:
1. Identify what specific data is wrong or missing
2. For NRIC: Singapore format is S/T/F/G + 7 digits + letter (e.g. S1234567A)
3. For phone: Singapore format is +65 XXXXXXXX
4. Suggest realistic corrections where possible
5. Give one short professional insight about this client profile

Return ONLY this JSON, no markdown:
{
  "enhancedNote": "specific fix instructions keeping ❌ for errors still present, ✅ if resolved",
  "aiInsights": "one professional insight under 80 chars"
}`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    res.json({
      enhancedNote: parsed.enhancedNote || rowData.note,
      aiInsights: parsed.aiInsights || 'Analysis complete',
    });

  } catch (err) {
    console.error('❌ AI enhance-row failed:', err.message);
    res.json({
      enhancedNote: rowData.note + '<br/>🤖 AI enhancement temporarily unavailable',
      aiInsights: 'Algorithmic validation applied',
    });
  }
});

// BULK AI Enhancement Endpoint (for processing multiple rows)
router.post('/enhance-bulk', async (req, res) => {
  try {
    const { rows, existingClientIds = [] } = req.body;

    if (!openai) {
      return res.status(503).json({ 
        error: 'AI enhancement unavailable',
        message: 'OpenAI API key not configured'
      });
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'Invalid rows data' });
    }

    console.log(`🧠 Bulk enhancing ${rows.length} rows with AI`);

    const enhancedRows = [];
    const batchSize = 3; // Process in small batches to avoid rate limits

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (rowData, batchIndex) => {
        try {
          // Individual AI enhancement for each row
          const enhanceResponse = await fetch(`${req.protocol}://${req.get('host')}/api/import/enhance-row`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rowData, existingClientIds })
          });
          
          const enhancement = await enhanceResponse.json();
          
          return {
            ...rowData,
            note: enhancement.enhancedNote,
            aiInsights: enhancement.aiInsights,
            enhancedByAI: true,
            enhancementMethod: 'openai'
          };
        } catch (error) {
          console.error(`Error enhancing row ${i + batchIndex}:`, error);
          return {
            ...rowData,
            note: rowData.note + '<br/>🤖 AI enhancement failed for this row',
            enhancedByAI: false,
            enhancementMethod: 'fallback'
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      enhancedRows.push(...batchResults);

      // Small delay between batches to respect rate limits
      if (i + batchSize < rows.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    res.json({
      enhancedRows,
      summary: {
        totalProcessed: enhancedRows.length,
        successfulEnhancements: enhancedRows.filter(r => r.enhancedByAI).length,
        failedEnhancements: enhancedRows.filter(r => !r.enhancedByAI).length
      }
    });

  } catch (error) {
    console.error('❌ Bulk AI enhancement error:', error);
    res.status(500).json({ 
      error: 'Bulk AI enhancement failed', 
      details: error.message 
    });
  }
});

// Import approval endpoint (unchanged)
router.post('/approve-import', async (req, res) => {
  try {
    const { clients = [], policies = [] } = req.body;

    console.log('📊 Import request:', { clientsCount: clients.length, policiesCount: policies.length });

    // Import clients first (if any)
    let importedClients = 0;
    if (clients.length > 0) {
      await Client.bulkCreate(clients, { 
        ignoreDuplicates: true,
        validate: true 
      });
      importedClients = clients.length;
    }

    // Import policies
    let importedPolicies = 0;
    if (policies.length > 0) {
      // Ensure all policies have required fields
      const validPolicies = policies.filter(policy => 
        policy.clientId && 
        policy.fullName && 
        policy.productType
      );

      await Policy.bulkCreate(validPolicies, { 
        ignoreDuplicates: true,
        validate: true 
      });
      importedPolicies = validPolicies.length;
    }

    res.json({
      message: 'Import completed successfully',
      summary: {
        total: importedClients + importedPolicies,
        clients: importedClients,
        policies: importedPolicies,
      },
    });

  } catch (err) {
    console.error('❌ Import error:', err);
    res.status(500).json({ 
      error: 'Failed to import data', 
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Export report endpoint
router.post('/export-report', (req, res) => {
  try {
    const { rows, warnings } = req.body;

    // Prepare data for CSV export
    const exportData = rows.map((row, index) => ({
      ...row,
      warnings: warnings.filter(w => w.row === index).map(w => w.message).join('; '),
      aiEnhanced: row.enhancedByAI ? 'Yes' : 'No',
      validationMethod: row.enhancementMethod || row.validationMethod || 'algorithmic'
    }));

    const parser = new Parser();
    const csv = parser.parse(exportData);
    const filename = `import-report-${new Date().toISOString().split('T')[0]}.csv`;

    res.header('Content-Type', 'text/csv');
    res.attachment(filename);
    res.send(csv);

  } catch (error) {
    console.error('❌ Export error:', error);
    res.status(500).json({ error: 'Failed to export report' });
  }
});

// Legacy import endpoint (for compatibility)
router.post('/import', async (req, res) => {
  try {
    const importedPolicies = req.body.rows;
    
    if (!Array.isArray(importedPolicies)) {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    await Policy.bulkCreate(importedPolicies, { 
      ignoreDuplicates: true,
      validate: true 
    });
    
    res.status(200).json({ 
      message: 'Import completed successfully', 
      count: importedPolicies.length 
    });

  } catch (error) {
    console.error('❌ Legacy import error:', error);
    res.status(500).json({ error: 'Import failed', details: error.message });
  }
});

module.exports = router;