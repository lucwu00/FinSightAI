// dataCleanerClient.js - Complete final version

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

function deriveStatus(end_date) {
  if (!end_date) return 'Unknown';
  const today = new Date();
  const end = new Date(end_date);
  return end >= today ? 'Active' : 'Expired';
}

// Update your generateNoteAI function in dataCleanerClient.js:

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
  
  // CRITICAL: Policy name validation - make "Policy" a blocking error
  if (!policyName || policyName === 'Policy' || policyName === '-') {
    notes.push('❌ Invalid or missing policy type - must select a valid policy from dropdown');
  }
  
  // CRITICAL: Investment-Linked fund type validation - make it blocking (❌ instead of ⚠️)
  if ((productType === 'Investment-Linked' || policyName === 'Investment-Linked')) {
    const validFundTypes = ['Growth', 'Income', 'Balanced', 'Aggressive'];
    if (!fundTypeILP || fundTypeILP === '-' || !validFundTypes.includes(fundTypeILP)) {
      notes.push('❌ Investment-Linked policies MUST have a fund type (Growth, Income, Balance, or Aggressive)');
    }
  }
  
  // Auto-derive policy type if missing and policy name is valid
  if (!policyTypeId && (productType || policyName) && policyName !== 'Policy' && policyName !== '-') {
    const derivedPolicyType = autoMapPolicyType(productType || policyName);
    if (derivedPolicyType) {
      // Update the row with derived policy type
      if (row.policyTypeId !== undefined) row.policyTypeId = derivedPolicyType;
      if (row.policy_type_id !== undefined) row.policy_type_id = derivedPolicyType;
    } else {
      notes.push('❌ Policy type could not be derived from policy name');
    }
  }
  
  // Info level notes (✅)
  if (clientId && existingClientIds.includes(clientId)) {
    notes.push('✅ Existing client – client_id retained');
  } else if (clientId) {
    notes.push('✅ New client ID assigned');
  }
  
  // Return appropriate status
  const hasErrors = notes.some(note => note.includes('❌'));
  
  if (hasErrors) {
    return notes.join('<br/>');
  } else if (notes.length > 0) {
    return notes.join('<br/>');
  } else {
    return '✅ Data is clean and complete';
  }
}

/**
 * Generate sequential client ID with gap filling
 * @param {Array} allUsedIds - All currently used client IDs
 * @returns {string} - Next available client ID in C001 format
 */
function generateSequentialClientId(allUsedIds = []) {
  
  // Filter valid C### format IDs and extract numbers
  const validNumbers = allUsedIds
    .filter(id => id && typeof id === 'string' && /^C\d{3}$/.test(id))
    .map(id => parseInt(id.substring(1), 10))
    .filter(num => !isNaN(num))
    .sort((a, b) => a - b);
  
  
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
  return newId;
}

/**
 * Main client ID generation function - handles all scenarios
 * @param {string} fullName - Client's full name
 * @param {string} nric - Client's NRIC for deduplication
 * @param {string} existingClientId - Client ID from Excel (if any)
 * @param {Array} usedIds - Array of used client IDs from props
 * @param {Array} clientDb - Database of existing clients
 * @param {Array} processedRows - Already processed rows in current batch
 * @returns {string} - Final client ID to use
 */
function generateSmartClientId(fullName, nric, existingClientId, usedIds = [], clientDb = [], processedRows = []) {
  
  // Step 1: Check if client exists in database by NRIC (highest priority)
  if (nric && clientDb.length > 0) {
    const existingInDb = clientDb.find(c => c.nric === nric);
    if (existingInDb && existingInDb.clientId) {
      return existingInDb.clientId;
    }
  }
  
  // Step 2: Check if same NRIC already processed in current batch
  if (nric && processedRows.length > 0) {

    const alreadyProcessed = processedRows.find(p =>
  p.nric && nric && p.nric.trim().toUpperCase() === nric.trim().toUpperCase() && p.clientId
);

    if (alreadyProcessed) {
      return alreadyProcessed.clientId;
    }
  }
  
  // Step 3: If Excel has a clientId written, validate and use it if possible
  if (existingClientId && existingClientId.trim()) {
    const trimmedId = existingClientId.trim();
    
    // Create comprehensive list of all used IDs
    const allUsedIds = [
      ...usedIds,
      ...clientDb.map(c => c.clientId),
      ...processedRows.map(p => p.clientId)
    ].filter(Boolean);
    
    // Check if this ID is already taken by someone else
    const isIdTaken = allUsedIds.includes(trimmedId);
    const isTakenByDifferentNric = clientDb.some(c => 
      c.clientId === trimmedId && c.nric !== nric && c.nric && nric
    );
    
    if (!isIdTaken || !isTakenByDifferentNric) {
      return trimmedId;
    } else {
      console.log(`⚠️  Excel ID ${trimmedId} is taken by someone else, generating new one`);
    }
  }
  
  // Step 4: Generate new sequential ID
  const allUsedIds = [
    ...usedIds,
    ...clientDb.map(c => c.clientId),
    ...processedRows.map(p => p.clientId)
  ].filter(Boolean);
  
  const newId = generateSequentialClientId(allUsedIds);
  return newId;
}

/**
 * Legacy function name for backward compatibility
 * Just calls generateSequentialClientId
 */
function generateNewClientIdSmart(fullName, allUsedIds = []) {
  return generateSequentialClientId(allUsedIds);
}

/**
 * Generate policy ID based on client ID and policy type in C001-PT003 format
 * @param {string} clientId - The client ID (e.g., C001)
 * @param {string} policyTypeId - The policy type ID (e.g., PT003)
 * @param {Array} existingPolicies - Array of existing policies/rows
 * @returns {string} - Generated policy ID in C001-PT003 format
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
 * Apply client-level AI hints for data enrichment
 * @param {Object} row - The data row
 * @param {string[]} existingClientIds - Array of existing client IDs
 * @returns {Object} - Enriched row data
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

// Export all functions
export {
  autoMapPolicyType,
  deriveStatus,
  generateNoteAI,
  generateNewClientIdSmart,
  generateSmartClientId,
  generateSequentialClientId,
  generatePolicyId,
  applyClientLevelAIHints
};