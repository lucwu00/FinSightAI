const xlsx = require('xlsx');

const productTypeMap = {
  "Whole Life": "PT001",
  "Term Life": "PT002",
  "Critical Illness": "PT003",
  "Endowment": "PT004",
  "Investment-Linked": "PT005"
};

function parseExcel(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const json = xlsx.utils.sheet_to_json(sheet, { defval: '' });
  return json;
}

function applyMapping(rows, mapping) {
  const usedClientIds = new Set();
  const enriched = [];

  rows.forEach(originalRow => {
    const row = {};

    for (const [excelHeader, { suggested }] of Object.entries(mapping)) {
      if (suggested) {
        row[suggested] = originalRow[excelHeader];
      }
    }

    if (!row.client_id) {
      const base = 'C';
      let i = 1;
      while (usedClientIds.has(`${base}${String(i).padStart(3, '0')}`)) i++;
      row.client_id = `${base}${String(i).padStart(3, '0')}`;
    }
    usedClientIds.add(row.client_id);

    const productKey = row.productType?.trim();
    if (productKey && productTypeMap[productKey]) {
      row.policy_type_id = productTypeMap[productKey];
    }

    if (row.endDate) {
      try {
        const end = new Date(row.endDate);
        row.status = end >= new Date() ? 'Active' : 'Expired';
      } catch {
        row.status = 'Unknown';
      }
    }

    if (productKey !== 'Investment-Linked') {
      row.fundTypeILP = '';
    }

    const notes = [];
    if (!productKey) notes.push("⚠️ Product type is missing.");
    if (!row.policy_type_id) notes.push("Policy type not derived from product type");
    row.note = notes.join(' ');

    enriched.push(row);
  });

  return enriched;
}

function validateRow(row) {
  const warnings = [];

  if (!row.email || !row.email.includes('@')) {
    warnings.push({ field: 'email', warning: 'Missing or invalid email' });
  }

  if (row.phone && !/^\+?\d{8,15}$/.test(row.phone)) {
    warnings.push({ field: 'phone', warning: 'Phone should be 8–15 digits and can include country code' });
  }

  if (!row.client_id || row.client_id.length < 4) {
    warnings.push({ field: 'client_id', warning: 'Invalid or missing client ID' });
  }

  return warnings;
}

module.exports = {
  parseExcel,
  applyMapping,
  validateRow
};
