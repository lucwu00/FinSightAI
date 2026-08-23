import React, { useState, useEffect } from 'react';
import './AddEditRowModal.css';
import { 
  autoMapPolicyType
} from '../utils/dataCleanerClient.js';

function EditRowModal({
  rowData,
  onSave,
  onDelete,
  onClose,
  policyTypeMap,
  usedIds = [],
  clientDb = [],
}) {
  const [fieldErrors, setFieldErrors] = useState({});
  const [noteErrors, setNoteErrors] = useState([]);
  const [editedRow, setEditedRow] = useState(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [originalData, setOriginalData] = useState(null); // ✅ ADD THIS LINE
  const [originalNoteFromTable, setOriginalNoteFromTable] = useState('');
const [dirty, setDirty] = useState(false);


  // Enhanced client ID generation with C001 format and gap filling
  const generateSmartClientId = (fullName, existingIds = [], existingClientData = [], currentNric = '') => {
    // First check if this person already exists in database by NRIC
    if (currentNric && currentNric.length > 0) {
      const existingClient = existingClientData.find(c => 
        c.nric && c.nric.toLowerCase() === currentNric.toLowerCase()
      );
      if (existingClient && existingClient.clientId) {
        return existingClient.clientId; // Use existing client's ID
      }
    }
    
    // Get all used IDs from both sources and filter out empty/invalid ones
    const allUsedIds = [
      ...existingIds.filter(id => id && typeof id === 'string'),
      ...existingClientData.map(c => c.clientId).filter(id => id && typeof id === 'string')
    ];
    
    // Parse existing client IDs to find the next available number
    const clientNumbers = allUsedIds
      .filter(id => id && /^C\d{3}$/.test(id))
      .map(id => parseInt(id.substring(1)))
      .filter(num => !isNaN(num))
      .sort((a, b) => a - b);

    // Find the next available number (fill gaps first)
    let nextNumber = 1;
    for (const num of clientNumbers) {
      if (num === nextNumber) {
        nextNumber++;
      } else if (num > nextNumber) {
        break; // Found a gap, use nextNumber
      }
    }

    return `C${nextNumber.toString().padStart(3, '0')}`;
  };

  // Generate policy ID - just return the policy type ID
  // Generate policy ID - just return the policy type ID
const generatePolicyId = (clientId, policyName = '', existingPolicies = []) => {
  // Safety check for inputs
  if (!clientId || !policyName) {
    return ''; // Return empty if missing required data
  }
  
  // 🔧 First try to use the policyTypeMap from the component props
  let policyTypeId = policyTypeMap[policyName];
  
  // 🔧 Fallback to the old autoMapPolicyType function if not found
  if (!policyTypeId) {
    policyTypeId = autoMapPolicyType(policyName);
  }
  
  if (!policyTypeId) {
    return ''; // Can't generate ID without valid policy type
  }
  
  // Return the combined format: C005-PT001
  return `${clientId}-${policyTypeId}`;
};

// Builds the same note text as the table's normalizeRow
const generateCustomNoteAI = (row, policyTypeMapLocal = {}) => {
  const notes = [];

  // Normalize a couple of fields the same way the table does
  const policyNameRaw = row.policyName || row.productType || row.product_type || '';
  let policyName = policyNameRaw;
  if (!policyName || policyName === 'Policy' || policyName === '-' || policyName.trim() === '') {
    policyName = '';
  }

  // ❌ NRIC
  if (!row.nric) {
    notes.push('❌ Missing NRIC');
  } else if (!/^[STFG]\d{7}[A-Z]$/i.test(row.nric)) {
    notes.push('❌ Invalid NRIC format (should be S/T/F/G + 7 digits + letter)');
  }

  // ❌ Contact
  if (!row.email && !row.phone) {
    notes.push('❌ Missing both phone and email — at least one is required');
  } else {
    if (row.email && !/\S+@\S+\.\S+/.test(row.email)) {
      notes.push('❌ Invalid email format');
    }
    if (row.phone && !/^\+65\s?\d{8}$/.test(row.phone)) {
      notes.push('❌ Invalid phone format (should be +65 XXXXXXXX)');
    }
  }

  // ❌ Policy name
  if (!policyName) {
    notes.push('❌ Missing policy name - must select a valid policy from dropdown');
  }

  // Policy type mapping check (same behavior)
  let policyTypeId = '';
  if (policyName) {
    policyTypeId = policyTypeMapLocal[policyName] || autoMapPolicyType(policyName);
    if (!policyTypeId) {
      notes.push('❌ Policy type could not be mapped - invalid policy name');
    }
  }

  // ❌ ILP fund type (critical)
  if (policyName === 'Investment-Linked') {
    const validFundTypes = ['Growth', 'Income', 'Balanced', 'Aggressive'];
    if (!row.fundTypeILP || row.fundTypeILP === '-' || !validFundTypes.includes(row.fundTypeILP)) {
      notes.push('❌ Investment-Linked policies MUST have a fund type (Growth, Income, Balance, or Aggressive)');
    }
  }

  // ❌ Policy ID generation (only if missing)
  if (!row.policyId) {
    if (row.clientId && policyTypeId) {
      // table would auto-generate it; keep note silent here (the table generates on normalize)
    } else {
      notes.push('❌ Policy ID could not be generated');
    }
  }

  // ❌ Coverage / premium / dates
  if (!row.coverageAmount || Number(row.coverageAmount) <= 0) {
    notes.push('❌ Coverage amount must be greater than 0');
  }
  if (!row.premium || Number(row.premium) <= 0) {
    notes.push('❌ Premium amount must be greater than 0');
  }
  if (!row.startDate) notes.push('❌ Start date is required');
  if (!row.endDate) notes.push('❌ End date is required');

  // Final
  if (notes.length > 0) return notes.join('<br/>');
  return '✅ Data is clean and complete';
};


  // Initialize editedRow when rowData changes
  useEffect(() => {
    if (rowData && !editedRow) {
      console.log('Initializing edit modal with data:', rowData);
      
      const allUsedClientIds = [
        ...usedIds,
        ...clientDb.map(c => c.clientId)
      ].filter(Boolean);

      const normalizedData = {
        fullName: rowData.fullName || rowData.full_name || '',
        clientId: rowData.clientId || rowData.client_id || '',
        email: rowData.email || '',
        phone: rowData.phone || '',
        nric: rowData.nric || '',
        policyName: rowData.policyName || rowData.productType || rowData.product_type || '',
        policyTypeId: rowData.policyTypeId || rowData.policy_type_id || '',
        fundTypeILP: rowData.fundTypeILP || rowData.fund_type || '',
        policyId: rowData.policyId || '',
        provider: rowData.provider || 'AIA',
        coverageAmount: rowData.coverageAmount || 100000,
        premium: rowData.premium || rowData.premiumAmount || rowData.premium_amount || '',
        premiumFrequency: rowData.premiumFrequency || rowData.premium_frequency || 'Monthly',
        startDate: rowData.startDate || rowData.start_date || '',
        endDate: rowData.endDate || rowData.end_date || '',
        status: rowData.status || 'Active',
        advisorId: rowData.advisorId || 1,
        recommended: rowData.recommended ?? false,
        note: rowData.note || '',
        aiInsights: rowData.aiInsights || '', 
        rowIndex: rowData.rowIndex ?? -1,
      };

      // Auto-generate clientId if missing or validate existing one
      if (!normalizedData.clientId && normalizedData.fullName) {
        normalizedData.clientId = generateSmartClientId(
          normalizedData.fullName, 
          allUsedClientIds, 
          clientDb, 
          normalizedData.nric
        );
      } else if (normalizedData.clientId && normalizedData.nric) {
        const dbClient = clientDb.find(c => c.nric === normalizedData.nric);
        if (dbClient && dbClient.clientId !== normalizedData.clientId) {
          normalizedData.clientId = dbClient.clientId;
        } else {
          const isIdTaken = clientDb.some(c => c.clientId === normalizedData.clientId && c.nric !== normalizedData.nric);
          if (isIdTaken) {
            normalizedData.clientId = generateSmartClientId(
              normalizedData.fullName, 
              allUsedClientIds, 
              clientDb, 
              normalizedData.nric
            );
          }
        }
      }

      // Auto-generate policyId if missing
      // Auto-generate policyId if missing
if (!normalizedData.policyId && normalizedData.clientId && normalizedData.policyName) {
  const policyTypeId = autoMapPolicyType(normalizedData.policyName);
  if (policyTypeId) {
    normalizedData.policyId = `${normalizedData.clientId}-${policyTypeId}`;
  }
}

      setEditedRow(normalizedData);
      setOriginalData({ ...normalizedData });
      setOriginalNoteFromTable(normalizedData.note || '');
      setHasAttemptedSubmit(false);
    }
  }, [rowData]);

  // Auto-update policyTypeId when policyName changes
useEffect(() => {
  if (editedRow?.policyName && (!editedRow.policyTypeId || editedRow.policyTypeId === '')) {
    // 🔧 First try to use the policyTypeMap from the component props
    let derivedPolicyType = policyTypeMap[editedRow.policyName];
    
    // 🔧 Fallback to the old autoMapPolicyType function if not found
    if (!derivedPolicyType) {
      derivedPolicyType = autoMapPolicyType(editedRow.policyName);
    }
    
    if (derivedPolicyType) {
      setEditedRow(prev => ({ ...prev, policyTypeId: derivedPolicyType }));
    }
  }
}, [editedRow?.policyName, policyTypeMap]); // 🔧 Add policyTypeMap to dependencies

  // Auto-update policyId when policyTypeId changes (removed clientId dependency)
  useEffect(() => {
  if (editedRow?.clientId && editedRow?.policyName) {
    const newPolicyId = generatePolicyId(editedRow.clientId, editedRow.policyName, usedIds);
    if (newPolicyId !== editedRow.policyId) {
      setEditedRow(prev => ({ ...prev, policyId: newPolicyId }));
    }
  }
}, [editedRow?.clientId, editedRow?.policyName, usedIds]);


  // FIXED: Auto-update note and extract field-specific errors using custom validation
  useEffect(() => {
    if (!editedRow) return;

    // If no edits yet, keep the exact table note verbatim
const newNote = dirty
? generateCustomNoteAI(editedRow, policyTypeMap)
: (originalNoteFromTable || '');
    // Extract field-specific errors from note
    const errors = {};
    const noteErrorList = [];
    
    // Always extract errors, not just when hasAttemptedSubmit
    if (newNote.includes('❌ Missing full name')) {
      errors.fullName = 'Full name is required';
      noteErrorList.push('Missing full name');
    }
    if (newNote.includes('❌ Missing NRIC')) {
      errors.nric = 'NRIC is required';
      noteErrorList.push('Missing NRIC');
    }
    if (newNote.includes('❌ Invalid NRIC format')) {
      errors.nric = 'Invalid NRIC format (S/T/F/G + 7 digits + letter)';
      noteErrorList.push('Invalid NRIC format');
    }
    if (newNote.includes('❌ Invalid email format')) {
      errors.email = 'Invalid email format';
      noteErrorList.push('Invalid email format');
    }
    if (newNote.includes('❌ Invalid phone format')) {
      errors.phone = 'Invalid phone format (+65 XXXXXXXX)';
      noteErrorList.push('Invalid phone format');
    }
    if (newNote.includes('❌ Either email or phone is required')) {
      errors.email = 'Either email or phone required';
      errors.phone = 'Either email or phone required';
      noteErrorList.push('Missing contact information');
    }
    if (newNote.includes('❌ Policy name is required')) {
      errors.policyName = 'Policy name is required';
      noteErrorList.push('Policy name missing');
    }
    if (newNote.includes('❌ Premium amount is required')) {
      errors.premium = 'Premium amount is required and must be greater than 0';
      noteErrorList.push('Premium amount missing or invalid');
    }
    if (newNote.includes('❌ Provider is required')) {
      errors.provider = 'Provider is required';
      noteErrorList.push('Provider missing');
    }
    if (newNote.includes('❌ Coverage amount is required')) {
      errors.coverageAmount = 'Coverage amount is required and must be greater than 0';
      noteErrorList.push('Coverage amount missing or invalid');
    }
    if (newNote.includes('❌ Premium frequency is required')) {
      errors.premiumFrequency = 'Premium frequency is required';
      noteErrorList.push('Premium frequency missing');
    }
    if (newNote.includes('❌ Start date is required')) {
      errors.startDate = 'Start date is required';
      noteErrorList.push('Start date missing');
    }
    if (newNote.includes('❌ End date is required')) {
      errors.endDate = 'End date is required';
      noteErrorList.push('End date missing');
    }
    if (newNote.includes('❌ End date must be after start date')) {
      errors.endDate = 'End date must be after start date';
      noteErrorList.push('End date must be after start date');
    }
    if (newNote.includes('❌ Status is required')) {
      errors.status = 'Status is required';
      noteErrorList.push('Status missing');
    }
    if (newNote.includes('❌ Fund type is required for Investment-Linked')) {
      errors.fundTypeILP = 'Fund type required for Investment-Linked';
      noteErrorList.push('Fund type required');
    }

    if (newNote !== editedRow.note) {
  const clean = !newNote.includes('❌');
  setEditedRow(prev => ({ 
    ...prev, 
    note: newNote,
    aiInsights: clean ? '' : prev.aiInsights // drop insight when clean
  }));
}
}, [
dirty,
editedRow?.fullName,
editedRow?.policyName,
editedRow?.nric,
editedRow?.email,
editedRow?.phone,
editedRow?.fundTypeILP,
editedRow?.premium,
editedRow?.coverageAmount,
editedRow?.startDate,
editedRow?.endDate,
policyTypeMap
]);

const calculateStatus = (endDate) => {
  if (!endDate) return 'Active';
  
  const today = new Date();
  const end = new Date(endDate);
  const timeDiff = end.getTime() - today.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  if (daysDiff < 0) {
    return 'Expired';
  } else if (daysDiff <= 30) {
    return 'Expiring Soon';
  } else {
    return 'Active';
  }
};

// Auto-update status when end date changes
useEffect(() => {
  if (editedRow?.endDate) {
    const autoStatus = calculateStatus(editedRow.endDate);
    if (autoStatus !== editedRow.status) {
      setEditedRow(prev => ({ ...prev, status: autoStatus }));
    }
  }
}, [editedRow?.endDate]);

  const handleChange = (field, value) => {
    console.log(`Changing ${field} to:`, value);
    setEditedRow((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
    
    // Clear field-specific errors when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = () => {
  console.log('Submitting edited row:', editedRow);
  
  setHasAttemptedSubmit(true);
  
  // Check if there are any critical errors from the note
  const hasCriticalErrors = noteErrors.length > 0 || editedRow.note?.includes('❌');
  
  if (hasCriticalErrors) {
    console.log('Cannot submit: There are validation errors');
    return;
  }
  
  // Ensure numeric fields are properly formatted
  const finalData = {
    ...editedRow,
    premium: Number(editedRow.premium) || 0,
    coverageAmount: Number(editedRow.coverageAmount) || 0,
    advisorId: Number(editedRow.advisorId) || 1,
    // Ensure strings are trimmed
    fullName: editedRow.fullName?.trim() || '',
    email: editedRow.email?.trim() || '',
    phone: editedRow.phone?.trim() || '',
    nric: editedRow.nric?.trim()?.toUpperCase() || '',
    policyName: editedRow.policyName?.trim() || '',
    provider: editedRow.provider?.trim() || 'AIA',
    status: editedRow.status || 'Active',
    premiumFrequency: editedRow.premiumFrequency || 'Monthly',
  };
  
  console.log('Final edited data being saved:', finalData);
  
  try {
    onSave(finalData);
    onClose();
  } catch (error) {
    console.error('Error saving row:', error);
    setEditedRow(prev => ({ 
      ...prev, 
      note: '❌ Error saving data. Please check all fields and try again.<br>' 
    }));
  }
};

  // Improved handleDelete function in PreviewTable.jsx:

const handleDelete = () => {
  console.error('🚨 DELETE BUTTON CLICKED in EditRowModal');
  console.error('🚨 editedRow.rowIndex:', editedRow.rowIndex);
  
  if (window.confirm('Are you sure you want to delete this row?')) {
    console.error('🚨 DELETE CONFIRMED');
    console.error('🚨 Calling onDelete with index:', editedRow.rowIndex);
    
    try {
      // Close modal first to prevent interference
      onClose();
      
      // Then delete after a small delay to ensure modal is closed
      setTimeout(() => {
        onDelete(editedRow.rowIndex);
        console.error('🚨 onDelete called successfully');
      }, 100);
      
    } catch (error) {
      console.error('❌ Error in onDelete:', error);
    }
  }
};


  const adjustNumber = (field, increment) => {
    const currentValue = Number(editedRow[field]) || 0;
    const newValue = Math.max(0, currentValue + increment);
    handleChange(field, newValue);
  };

  if (!editedRow) {
    return null;
  }

  const hasDataChanged = () => {
  if (!originalData || !editedRow) {
    console.error('❌ No data to compare:', { originalData: !!originalData, editedRow: !!editedRow });
    return false;
  }
  
  // Compare all relevant fields (excluding auto-generated ones and metadata)
  const fieldsToCompare = [
    'fullName', 'email', 'phone', 'nric', 'policyName', 'fundTypeILP',
    'provider', 'coverageAmount', 'premium', 'premiumFrequency', 
    'startDate', 'endDate', 'status', 'recommended'
  ];
  
  console.error('🔍 CHECKING FOR CHANGES...');
  
  const hasChanges = fieldsToCompare.some(field => {
    const original = originalData[field];
    const current = editedRow[field];
    
    // Handle different data types
    let isChanged = false;
    
    if (typeof original === 'boolean' || typeof current === 'boolean') {
      isChanged = Boolean(original) !== Boolean(current);
    } else if (typeof original === 'number' || typeof current === 'number') {
      isChanged = Number(original) !== Number(current);
    } else {
      // Handle strings (trim whitespace for comparison)
      isChanged = String(original || '').trim() !== String(current || '').trim();
    }
    
    if (isChanged) {
      console.error(`🔄 CHANGE DETECTED in ${field}:`, {
        original: original,
        current: current,
        originalType: typeof original,
        currentType: typeof current
      });
    }
    
    return isChanged;
  });
  
  console.error('📊 Change detection result:', hasChanges);
  return hasChanges;
};

  // FIXED: Better logic for determining if client exists
  const isExistingClient = editedRow.nric && editedRow.nric.trim().length > 0 
    ? clientDb.some(c => c.nric && c.nric.toLowerCase() === editedRow.nric.toLowerCase())
    : false;

  const editableFields = [
    { key: 'fullName', label: 'Full Name', type: 'text', required: true },
    { key: 'clientId', label: 'Client ID', type: 'text', required: true, readonly: true },
    { key: 'email', label: 'Email', type: 'email', required: false },
    { key: 'phone', label: 'Phone', type: 'text', required: false },
    { key: 'nric', label: 'NRIC', type: 'text', required: true },
    { key: 'policyName', label: 'Policy Name', type: 'select', required: true },
    { key: 'fundTypeILP', label: 'Fund Type ILP', type: 'select', conditional: 'Investment-Linked', required: true },
    { key: 'policyId', label: 'Policy ID', type: 'text', readonly: true },
    { key: 'provider', label: 'Provider', type: 'select', required: true },
    { key: 'coverageAmount', label: 'Coverage Amount', type: 'stepper', step: 1000, required: true },
    { key: 'premium', label: 'Premium Amount', type: 'stepper', step: 100, required: true },
    { key: 'premiumFrequency', label: 'Premium Frequency', type: 'select', required: true },
    { key: 'startDate', label: 'Start Date', type: 'date', required: true },
    { key: 'endDate', label: 'End Date', type: 'date', required: true },
    { key: 'status', label: 'Status', type: 'text', required: true, readonly: true },
    { key: 'recommended', label: 'Recommended', type: 'checkbox' },
  ];

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Row #{(editedRow.rowIndex || 0) + 1}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="form-grid">
            {editableFields.map((field) => {
              const { key, label, type, required, readonly, conditional, step } = field;
              const value = editedRow[key];
              const hasError = fieldErrors[key];
              
              // Hide conditional fields or show based on policy name
              if (conditional && editedRow.policyName !== conditional) {
                return null;
              }

              // Make Fund Type ILP required when Investment-Linked is selected
              const isConditionalRequired = conditional === 'Investment-Linked' && 
                                          editedRow.policyName === 'Investment-Linked' && 
                                          required;

              if (type === 'checkbox') {
                return (
                  <div className="form-field full-width" key={key}>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={!!value}
                        onChange={(e) => handleChange(key, e.target.checked)}
                        style={{ pointerEvents: 'auto' }}
                      />
                      <span className="checkbox-text">
                        {label} {required && <span className="required">*</span>}
                      </span>
                    </label>
                  </div>
                );
              }

              if (type === 'stepper') {
                return (
                  <div className="form-field" key={key}>
                    <label className="field-label">
                      {label} {required && <span className="required">*</span>}
                    </label>
                    <div className="stepper-container">
                      <button 
                        type="button"
                        className="stepper-btn"
                        onClick={() => adjustNumber(key, -step)}
                        style={{ pointerEvents: 'auto' }}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={value || 0}
                        onChange={(e) => handleChange(key, e.target.value)}
                        className={`field-input stepper-input ${hasError ? 'error' : ''}`}
                        step={step}
                        min="0"
                        style={{ pointerEvents: 'auto' }}
                      />
                      <button 
                        type="button"
                        className="stepper-btn"
                        onClick={() => adjustNumber(key, step)}
                        style={{ pointerEvents: 'auto' }}
                      >
                        +
                      </button>
                    </div>
                    {hasError && <span className="field-error">{hasError}</span>}
                  </div>
                );
              }

              if (type === 'select') {
                let options = [];
                
                if (key === 'policyName') {
                  options = Object.keys(policyTypeMap || {});
                } else if (key === 'provider') {
                  options = ['AIA', 'Prudential', 'AXA', 'Great Eastern', 'NTUC Income', 'Manulife'];
                } else if (key === 'premiumFrequency') {
                  options = ['Monthly', 'Quarterly', 'Semi-Annually', 'Annually'];
                } else if (key === 'status') {
                  options = ['Active', 'Expiring Soon', 'Expired'];
                } else if (key === 'fundTypeILP') {
                  options = ['Growth', 'Balanced', 'Income', 'Conservative'];
                }

                return (
                  <div className="form-field" key={key}>
                    <label className="field-label">
                      {label} {(required || isConditionalRequired) && <span className="required">*</span>}
                    </label>
                    <select
                      value={value || ''}
                      onChange={(e) => handleChange(key, e.target.value)}
                      className={`field-input ${hasError ? 'error' : ''}`}
                      style={{ pointerEvents: 'auto' }}
                    >
                      <option value="">-- Select --</option>
                      {options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {hasError && <span className="field-error">{hasError}</span>}
                  </div>
                );
              }

              return (
                <div className="form-field" key={key}>
                  <label className="field-label">
                    {label} {required && <span className="required">*</span>}
                    {readonly && <span className="auto-generated">(Auto-generated)</span>}
                  </label>
                  <input
                    type={type}
                    value={value || ''}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className={`field-input ${hasError ? 'error' : ''} ${readonly ? 'readonly' : ''}`}
                    readOnly={readonly}
                    placeholder={readonly ? 'Auto-generated' : ''}
                    style={{ pointerEvents: readonly ? 'none' : 'auto' }}
                  />
                  {hasError && <span className="field-error">{hasError}</span>}
                </div>
              );
            })}
          </div>

          {/* Contact Information Note */}
          <div className="contact-info-note">
            <p><strong>Note:</strong> At least one contact method (Email or Phone) is required.</p>
          </div>

          {/* Status indicator */}
          <div className={`status-box ${noteErrors.length > 0 ? 'error' : 'success'}`}>
            <h4>
              {noteErrors.length > 0 ? 'Please fix the errors mentioned in the Note.' : 'Status'}
            </h4>
            <p className="client-status">
              {isExistingClient ? '🔄 Existing Client' : '✨ New Client'}
            </p>
          </div>

          {/* AI Generated Note */}
<div className="note-section">
  <label className="note-label">Validation Note</label>

  {/* exact same formatting as the table's note cell */}
  <div
    className="note-content"
    dangerouslySetInnerHTML={{
      __html: (editedRow.note || '')
        .replace(/•\s?/g, '•&nbsp;')
        .replace(/<br\/>/g, '<br/><br/>')
    }}
  />

{/* show the same 🤖 insight line that appears below the note in the table */}
{/* ✅ FIXED: Show AI insights for ALL enhanced rows */}
{(editedRow.enhancedByAI || editedRow.aiInsights) && (
  <div 
    className="ai-insights-full"
    style={{
      marginTop: '0.5rem',
      padding: '0.5rem',
      backgroundColor: '#e8f4fd',
      border: '1px solid #17a2b8',
      borderRadius: '4px',
      fontSize: '0.9rem',
      color: '#17a2b8'
    }}
  >
    🤖 {editedRow.aiInsights || "Enhanced by AI"}
  </div>
)}
</div>
        </div>

        <div className="modal-actions">
          <button 
            onClick={handleDelete}
            className="btn btn-danger"
            style={{ pointerEvents: 'auto' }}
          >
            Delete
          </button>
          
          <div className="action-group">
            <button 
              onClick={onClose}
              className="btn btn-secondary"
              style={{ pointerEvents: 'auto' }}
            >
              Cancel
            </button>
            <button 
  onClick={handleSubmit}
  className="btn btn-primary"
  disabled={(() => {
    // Check if there are any critical errors
    const hasCriticalErrors = noteErrors.length > 0 || editedRow.note?.includes('❌');
    
    // Check if no changes were made
    const noChanges = !hasDataChanged();
    
    const isDisabled = hasCriticalErrors || noChanges;
    
    console.error('🔘 BUTTON STATE:', {
      hasCriticalErrors,
      noChanges,
      isDisabled,
      noteErrorsLength: noteErrors.length,
      noteHasErrors: editedRow.note?.includes('❌')
    });
    
    return isDisabled;
  })()}
  style={{ pointerEvents: 'auto' }}
>
  Save Changes
</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditRowModal;