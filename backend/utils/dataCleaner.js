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
  
  function generateNoteAI(row, existingClientIds = []) {
    const notes = [];
  
    if (!row.nric) {
      notes.push('Missing NRIC');
    }
  
    if (!row.email && !row.phone) {
      notes.push('Missing both phone and email — at least one is required.');
    }
  
    if (!row.product_type) {
      notes.push('Product type is missing.');
    }
  
    if (!row.policy_type_id && row.product_type) {
      row.policy_type_id = autoMapPolicyType(row.product_type);
    }
  
    if (!row.policy_type_id) {
      notes.push('Policy type not derived from product type');
    }
  
    if (row.product_type === 'Investment-Linked Plan' && !row.fund_type) {
      notes.push('Missing fund type for Investment-Linked Plan');
    }
  
    if (row.client_id && existingClientIds.includes(row.client_id)) {
      notes.push('Existing client – client_id retained');
    }
  
    return notes.length ? `⚠️ ${notes.join('; ')}` : '✅ Clean';
  }
  
  module.exports = {
    autoMapPolicyType,
    deriveStatus,
    generateNoteAI
  };
  