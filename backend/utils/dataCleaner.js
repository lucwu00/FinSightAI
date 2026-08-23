// Backend dataCleaner.js - Data enrichment utilities

/**
 * Auto-map product type to policy type ID
 */
function autoMapPolicyType(product_type) {
  if (!product_type) return '';
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
  return mapping[product_type] || '';
}

/**
 * Derive policy status from end date
 */
function deriveStatus(end_date) {
  if (!end_date) return 'Unknown';
  const today = new Date();
  const end = new Date(end_date);
  return end >= today ? 'Active' : 'Expired';
}

/**
 * Generate sequential client ID with gap filling
 */
function generateSequentialClientId(allUsedIds = []) {
  console.log(`🔢 All used IDs: [${allUsedIds.join(', ')}]`);
  
  // Filter valid C### format IDs and extract numbers
  const validNumbers = allUsedIds
    .filter(id => id && typeof id === 'string' && /^C\d{3}$/.test(id))
    .map(id => parseInt(id.substring(1), 10))
    .filter(num => !isNaN(num))
    .sort((a, b) => a - b);
  
  console.log(`📊 Valid numbers: [${validNumbers.join(', ')}]`);
  
  // Find first gap or next number
  let nextNumber = 1;
  for (const num of validNumbers) {
    if (num === nextNumber) {
      nextNumber++;
    } else {
      break; // Found a gap
    }
  }
  
  const newId = `C${nextNumber.toString().padStart(3, '0')}`;
  console.log(`🎯 Next available: ${newId}`);
  return newId;
}

/**
 * Generate smart client ID based on name and existing IDs
 * This is the function that was missing from your frontend code
 */
function generateNewClientIdSmart(fullName, existingClientIds = []) {
  // For now, use sequential generation
  // You can enhance this later with name-based logic if needed
  return generateSequentialClientId(existingClientIds);
}

/**
 * Generate policy ID based on client ID and policy type
 */
function generatePolicyId(clientId, policyTypeId = '', existingPolicies = []) {
  if (!clientId) return '';
  
  // Safety check for policyTypeId
  if (!policyTypeId || typeof policyTypeId !== 'string') {
    return `${clientId}-PT001`; // Default fallback
  }
  
  // Use the full policy type ID (PT003 stays as PT003)
  let policyType = '';
  if (policyTypeId.startsWith('PT')) {
    policyType = policyTypeId; // Keep the full format PT003
  } else {
    policyType = 'PT001'; // Default to PT001 if no policy type
  }
  
  return `${clientId}-${policyType}`;
}

/**
 * Generate comprehensive validation notes for a data row
 */
function generateNoteAI(row, existingClientIds = []) {
  const notes = [];
  
  // Handle both camelCase and snake_case field names
  const nric = row.nric || row.NRIC;
  const email = row.email;
  const phone = row.phone;
  const productType = row.productType || row.product_type || row.policyName;
  const policyName = row.policyName || row.productType || row.product_type;
  const policyTypeId = row.policyTypeId || row.policy_type_id;
  const fundTypeILP = row.fundTypeILP || row.fund_type;
  const clientId = row.clientId || row.client_id;
  
  // Critical validation errors (❌)
  if (!nric) {
    notes.push('❌ Missing NRIC');
  } else if (!/^[STFG]\d{7}[A-Z]$/i.test(nric)) {
    notes.push('❌ Invalid NRIC format (should be S/T/F/G + 7 digits + letter)');
  }
  
  if (!email && !phone) {
    notes.push('❌ Missing both phone and email — at least one is required');
  } else {
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      notes.push('❌ Invalid email format');
    }
    if (phone && !/^\+65\s?\d{8}$/.test(phone)) {
      notes.push('❌ Invalid phone format (should be +65 XXXXXXXX)');
    }
  }
  
  // Check for both policyName and productType
  if (!policyName && !productType) {
    notes.push('❌ Policy name is missing');
  }
  
  // Warning level validations (⚠️)
  if (!policyTypeId && (productType || policyName)) {
    const derivedPolicyType = autoMapPolicyType(productType || policyName);
    if (derivedPolicyType) {
      // Silently update the row with derived policy type - no need to show this in notes
      if (row.policyTypeId !== undefined) row.policyTypeId = derivedPolicyType;
      if (row.policy_type_id !== undefined) row.policy_type_id = derivedPolicyType;
    } else {
      notes.push('⚠️ Policy type could not be derived from policy name');
    }
  }
  
  if ((productType === 'Investment-Linked' || policyName === 'Investment-Linked') && !fundTypeILP) {
    notes.push('⚠️ Missing fund type for Investment-Linked Plan');
  }
  
  // Info level notes (✅) - Only show meaningful information
  if (clientId && existingClientIds.includes(clientId)) {
    // Only show this for actual existing clients that we're updating
    const isActuallyExisting = existingClientIds.some(id => id === clientId);
    if (isActuallyExisting) {
      notes.push('✅ Existing client – client_id retained');
    }
  }
  
  // Return appropriate status
  const hasErrors = notes.some(note => note.includes('❌'));
  const hasWarnings = notes.some(note => note.includes('⚠️'));
  
  if (hasErrors) {
    return notes.join('• ');
  } else if (hasWarnings) {
    return notes.join('• ');
  } else if (notes.length > 0) {
    return notes.join('• ');
  } else {
    return '✅ Data is clean and complete';
  }
}

/**
 * Apply client-level AI hints for data enrichment
 */
function applyClientLevelAIHints(row, existingClientIds = []) {
  const enriched = { ...row };
  
  // Auto-generate client ID if missing using new C001 format
  if (!enriched.clientId && !enriched.client_id && enriched.fullName) {
    const generatedId = generateNewClientIdSmart(enriched.fullName, existingClientIds);
    enriched.clientId = generatedId;
  }
  
  // Normalize phone number format
  if (enriched.phone && !enriched.phone.startsWith('+65')) {
    // Assume Singapore number if it's 8 digits
    if (/^\d{8}$/.test(enriched.phone)) {
      enriched.phone = `+65 ${enriched.phone}`;
    }
  }
  
  // Auto-derive policy type
  if (!enriched.policyTypeId && !enriched.policy_type_id && enriched.productType) {
    const derivedType = autoMapPolicyType(enriched.productType);
    if (derivedType) {
      enriched.policyTypeId = derivedType;
    }
  }
  
  // Set default values for missing fields
  if (!enriched.provider) enriched.provider = 'AIA';
  if (!enriched.status) enriched.status = deriveStatus(enriched.endDate || enriched.end_date);
  if (!enriched.advisorId && !enriched.advisor_id) enriched.advisorId = 1;
  if (enriched.recommended === undefined) enriched.recommended = false;
  
  return enriched;
}

/**
 * Enrich data by applying AI hints and generating IDs
 */
// In your backend dataCleaner.js, update the enrichData function:
async function enrichData(rows, existingClientIds = []) {
  console.log('🔄 Starting data enrichment...');
  
  const enrichedRows = [];
  const allClientIds = [...existingClientIds];
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    console.log(`Processing row ${i + 1}:`, row);
    
    // Apply client-level AI hints
    let enrichedRow = applyClientLevelAIHints(row, allClientIds);
    
    // Generate client ID if still missing
    if (!enrichedRow.clientId && !enrichedRow.client_id) {
      const newClientId = generateSequentialClientId(allClientIds);
      enrichedRow.clientId = newClientId;
      allClientIds.push(newClientId);
    }
    
    // IMPORTANT: Generate policy ID using the C001-PT003 format
    const clientId = enrichedRow.clientId || enrichedRow.client_id;
    const policyTypeId = enrichedRow.policyTypeId || enrichedRow.policy_type_id;
    if (clientId && policyTypeId && !enrichedRow.policyId && !enrichedRow.policy_id) {
      enrichedRow.policyId = generatePolicyId(clientId, policyTypeId); // This should generate C001-PT003
    }
    
    // Generate AI notes
    enrichedRow.aiNotes = generateNoteAI(enrichedRow, allClientIds);
    
    enrichedRows.push(enrichedRow);
  }
  
  console.log('✅ Data enrichment completed');
  return enrichedRows;
}

module.exports = {
  autoMapPolicyType,
  deriveStatus,
  generateSequentialClientId,
  generateNewClientIdSmart,
  generatePolicyId,
  generateNoteAI,
  applyClientLevelAIHints,
  enrichData
};