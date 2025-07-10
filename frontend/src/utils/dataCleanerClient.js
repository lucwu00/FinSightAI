// Corrected parameter name here from `product_type` to `productType`
export const autoMapPolicyType = (productType) => {
  const mapping = {
    "Whole Life": "PT001",
    "Term Life": "PT002",
    "Investment-Linked": "PT003",
    "Endowment": "PT004",
    "Retirement Plan": "PT005",
    "Personal Accident": "PT006",
    "Long-Term Care": "PT007",
    "Hospitalization": "PT008",
    "Critical Illness": "PT009",
    "Home": "PT010",
    "Travel": "PT011",
    "Car": "PT012",
    "Disability": "PT013",
    "Child Education": "PT014",
    "Income Protection": "PT015",
    "Universal Life": "PT016"
  };
  return mapping[productType] || 'Unknown'; 
};

export function deriveStatus(end_date) {
  if (!end_date) return 'Unknown';
  const today = new Date();
  const end = new Date(end_date);
  return end >= today ? 'Active' : 'Expired';
}

export const generateNoteWithGPT = async (row) => {
  const res = await fetch('http://localhost:5050/api/genai/row-summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ row }),
  });
  const data = await res.json();
  return data.summary;
};

export function generateNewClientIdSmart(existingClientIdsSet) {
  const prefix = 'C';
  const maxLength = 3;

  for (let i = 1; i <= 999; i++) {
    const newId = `${prefix}${String(i).padStart(maxLength, '0')}`;
    if (!existingClientIdsSet.has(newId)) {
      return newId;
    }
  }

  throw new Error('Too many client IDs assigned!');
}

export function generateNoteAI(row, existingClientIds = []) {
  const notes = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\+65\s?\d{8}$/;
  const nricRegex = /^[STFG]\d{7}[A-Z]$/;

  const productType = row.productType || row.product_type || '';
  const fundType = row.fundTypeILP || row.fund_type || '';
  const clientId = row.clientId || row.client_id;

  const existingNote = row.note || '';

  if (!row.nric || row.nric === '-') {
    if (!existingNote.includes('Missing NRIC')) {
      notes.push('Missing NRIC — required to assign client ID.');
    }
  } else if (!nricRegex.test(row.nric)) {
    notes.push('Invalid NRIC format — expected format like S1234567A.');
  }

  if (!row.email && !row.phone) {
    notes.push('Missing both phone and email — at least one required.');
  }
  if (row.email && !emailRegex.test(row.email)) {
    notes.push('Invalid email format.');
  }
  if (row.phone && !phoneRegex.test(row.phone)) {
    notes.push('Invalid phone number format (expected +65 XXXXXXXX).');
  }

  if (!productType || productType === '-') {
    notes.push('Product type is missing.');
  }

  if (productType.toLowerCase() === 'investment-linked') {
    const validFundTypes = ['Balance', 'Growth', 'Income', 'Conservative', 'Aggressive'];
    if (!fundType) {
      notes.push('Missing fund type for Investment-Linked Plan.');
    } else if (!validFundTypes.includes(fundType)) {
      notes.push(`Fund type must be one of: ${validFundTypes.join(', ')}`);
    }
  }

  if (clientId && existingClientIds.includes(clientId)) {
    notes.push('Existing client — client_id retained.');
  }

  
  const criticalKeywords = [
    'Missing NRIC',
    'Invalid NRIC format',
    'Missing both phone and email',
    'Product type is missing.'
  ];
  const hasCritical = notes.some(note =>
    criticalKeywords.some(keyword => note.includes(keyword))
  );
  const prefix = hasCritical ? '❌' : '⚠️';

  return notes.length ? `${prefix} ${notes.join(' ')}` : '';
}



export function applyClientLevelAIHints(enrichedRows) {
  const groupedByClient = {};

  for (const row of enrichedRows) {
    if (!groupedByClient[row.clientId]) {
      groupedByClient[row.clientId] = [];
    }
    groupedByClient[row.clientId].push(row);
  }

  const seen = new Set();
  const updatedRows = enrichedRows.map((row) => {
    const group = groupedByClient[row.clientId] || [];
    const groupProductTypes = group.map(r => (r.productType || r.product_type)?.trim()).filter(Boolean);
    const uniqueTypes = [...new Set(groupProductTypes)];

    let extras = [];

    if (group.length > 1) {
      if (uniqueTypes.length > 1) {
        extras.push(`Client has multiple product types in the table (${uniqueTypes.join(', ')})`);
      } else {
        extras.push(`Client has multiple policies for the same product type with different durations (${uniqueTypes[0]})`);
      }
    }

    const key = `${row.clientId}-${row.productType}-${row.startDate}-${row.endDate}`;
    if (seen.has(key)) {
      extras.push(`Duplicate policy entry detected for the same client.`);
    } else {
      seen.add(key);
    }

    const currentNote = row.note || '';
    const newNotes = extras.filter(n => !currentNote.includes(n));
    const combined = [currentNote, ...newNotes].filter(Boolean).join('; ').replace(/^;|;;+/g, '').trim();

    return {
      ...row,
      note: combined
    };
  });

  return updatedRows;
}






