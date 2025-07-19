const path = require('path');
const { parseExcel, applyMapping, validateRow } = require('../utils/excelParser');
const { Policy, Client } = require('../models');

exports.previewData = async (req, res) => {
  try {
    const { fileName, mappedFields } = req.body;
    console.log("📥 Received mappedFields:", req.body.mappedFields);
    
    const filePath = path.join(__dirname, '..', 'uploads', fileName); 
    const rawRows = parseExcel(filePath);
    const cleanedRows = applyMapping(rawRows, mappedFields);

    const warnings = [];

    cleanedRows.forEach((row, index) => {
      const rowWarnings = validateRow(row);
      rowWarnings.forEach(w => {
        warnings.push({ row: index, ...w });
      });
    });

    return res.json({
      rows: cleanedRows,
      warnings
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Preview generation failed' });
  }
};

exports.mapHeaders = (req, res) => {
    const { headers } = req.body;
  
    const policyFields = Object.keys(Policy.rawAttributes);
    const clientFields = Object.keys(Client.rawAttributes);
    const availableFields = [...new Set([...policyFields, ...clientFields])];
  
    const normalize = (str) => str.toLowerCase().replace(/[-_ ]/g, '');

    const aliases = {
      client_name: 'fullName',
      clientid: 'clientId',
      client_id: 'clientId',
      policy_type_id: 'policyTypeId',
      product_type: 'productType',
      premium_amount: 'premiumAmount',
      premium_frequency: 'premiumFrequency',
      start_date: 'startDate',
      end_date: 'endDate',
      nric: 'nric',
      email: 'email',
      phone: 'phone'
    };
  
    const mappings = {};
  
    headers.forEach((header) => {
      const normalizedHeader = normalize(header);
  
      if (aliases[normalizedHeader]) {
        mappings[header] = { suggested: aliases[normalizedHeader], confidence: 1.0 };
        return;
      }
  
      let bestMatch = '';
      let confidence = 0;
  
      availableFields.forEach((field) => {
        const normalizedField = normalize(field);
  
        if (normalizedHeader === normalizedField) {
          bestMatch = field;
          confidence = 1.0;
        } else if (normalizedHeader.includes(normalizedField) || normalizedField.includes(normalizedHeader)) {
          if (confidence < 0.7) {
            bestMatch = field;
            confidence = 0.7;
          }
        }
      });
  
      mappings[header] = { suggested: bestMatch, confidence };
    });
  
    res.json({ mappings, availableFields });
  };
  
  exports.uploadFile = (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    return res.json({ fileName: req.file.filename }); 
  };
  