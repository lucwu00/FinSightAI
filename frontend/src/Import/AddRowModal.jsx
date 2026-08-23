import React, { useState, useEffect } from 'react';
import './AddEditRowModal.css';
import { 
  generateNoteAI, 
  autoMapPolicyType, 
  generateNewClientIdSmart
} from '../utils/dataCleanerClient.js';

function AddRowModal({
  onAdd,
  onClose,
  policyTypeMap,
  usedIds = [],
  clientDb = [],
}) {
  const [newRow, setNewRow] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [noteErrors, setNoteErrors] = useState([]);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [validationNote, setValidationNote] = useState('Please fill in all required fields (except email/phone - only one needed). Click "Save" to validate and save.');

  const generateSmartClientId = (fullName, existingIds = [], existingClientData = [], currentNric = '') => {
    if (currentNric && currentNric.length > 0) {
      const existingClient = existingClientData.find(c => 
        c.nric && c.nric.toLowerCase() === currentNric.toLowerCase()
      );
      if (existingClient && existingClient.clientId) return existingClient.clientId;
    }
    const allUsedIds = [
      ...existingIds.filter(id => id && typeof id === 'string'),
      ...existingClientData.map(c => c.clientId).filter(id => id && typeof id === 'string')
    ];
    const clientNumbers = allUsedIds
      .filter(id => id && /^C\d{3}$/.test(id))
      .map(id => parseInt(id.substring(1)))
      .filter(num => !isNaN(num))
      .sort((a, b) => a - b);
    let nextNumber = 1;
    for (const num of clientNumbers) {
      if (num === nextNumber) nextNumber++;
      else if (num > nextNumber) break;
    }
    return `C${nextNumber.toString().padStart(3, '0')}`;
  };

  const generatePolicyId = (clientId, policyName = '') => {
    if (!clientId || !policyName) return '';
    let policyTypeId = policyTypeMap && policyTypeMap[policyName];
    if (!policyTypeId) policyTypeId = autoMapPolicyType(policyName);
    if (!policyTypeId) return '';
    return `${clientId}-${policyTypeId}`;
  };

  // Initialize form data
  useEffect(() => {
    setNewRow({
      fullName: '', clientId: '', email: '', phone: '', nric: '',
      policyName: '', policyTypeId: '', fundTypeILP: '', policyId: '',
      provider: 'AIA', coverageAmount: '100000', premium: '',
      premiumFrequency: 'Monthly', startDate: '', endDate: '',
      status: 'Active', advisorId: 1, recommended: false,
    });
    setFieldErrors({});
    setNoteErrors([]);
    setHasAttemptedSubmit(false);
    setValidationNote('Please fill in all required fields (except email/phone - only one needed). Click "Save" to validate and save.');
  }, []);

  // Validation useEffect — writes to validationNote state, NOT newRow
  useEffect(() => {
    if (!newRow || Object.keys(newRow).length === 0) return;

    let note = '';
    const errors = {};
    const noteErrorList = [];
    const showErrors = hasAttemptedSubmit;

    if (!newRow.fullName?.trim()) {
      if (showErrors) { note += '❌ Missing full name<br>'; errors.fullName = 'Full name is required'; }
      noteErrorList.push('Missing full name');
    }

    if (!newRow.nric?.trim()) {
      if (showErrors) { note += '❌ Missing NRIC<br>'; errors.nric = 'NRIC is required'; }
      noteErrorList.push('Missing NRIC');
    } else if (!/^[STFG]\d{7}[A-Z]$/i.test(newRow.nric.trim())) {
      if (showErrors) { note += '❌ Invalid NRIC format (S/T/F/G + 7 digits + letter)<br>'; errors.nric = 'Invalid NRIC format'; }
      noteErrorList.push('Invalid NRIC format');
    }

    if (newRow.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newRow.email.trim())) {
      if (showErrors) { note += '❌ Invalid email format<br>'; errors.email = 'Invalid email format'; }
      noteErrorList.push('Invalid email format');
    }

    if (newRow.phone?.trim() && !/^\+65\s?\d{8}$/.test(newRow.phone.trim())) {
      if (showErrors) { note += '❌ Invalid phone format (+65 XXXXXXXX)<br>'; errors.phone = 'Invalid phone format'; }
      noteErrorList.push('Invalid phone format');
    }

    const hasEmail = !!newRow.email?.trim();
    const hasPhone = !!newRow.phone?.trim();
    if (!hasEmail && !hasPhone) {
      if (showErrors) { note += '❌ Either email or phone is required<br>'; errors.email = 'Either email or phone required'; errors.phone = 'Either email or phone required'; }
      noteErrorList.push('Missing contact information');
    }

    if (!newRow.policyName?.trim()) {
      if (showErrors) { note += '❌ Policy name is required<br>'; errors.policyName = 'Policy name is required'; }
      noteErrorList.push('Policy name missing');
    }

    if (!newRow.premium || Number(newRow.premium) <= 0) {
      if (showErrors) { note += '❌ Premium amount must be greater than 0<br>'; errors.premium = 'Premium amount required'; }
      noteErrorList.push('Premium amount missing or invalid');
    }

    if (!newRow.provider?.trim()) {
      if (showErrors) { note += '❌ Provider is required<br>'; errors.provider = 'Provider is required'; }
      noteErrorList.push('Provider missing');
    }

    if (!newRow.coverageAmount || Number(newRow.coverageAmount) <= 0) {
      if (showErrors) { note += '❌ Coverage amount must be greater than 0<br>'; errors.coverageAmount = 'Coverage amount required'; }
      noteErrorList.push('Coverage amount missing or invalid');
    }

    if (!newRow.premiumFrequency?.trim()) {
      if (showErrors) { note += '❌ Premium frequency is required<br>'; errors.premiumFrequency = 'Premium frequency required'; }
      noteErrorList.push('Premium frequency missing');
    }

    if (!newRow.startDate?.trim()) {
      if (showErrors) { note += '❌ Start date is required<br>'; errors.startDate = 'Start date required'; }
      noteErrorList.push('Start date missing');
    }

    if (!newRow.endDate?.trim()) {
      if (showErrors) { note += '❌ End date is required<br>'; errors.endDate = 'End date required'; }
      noteErrorList.push('End date missing');
    }

    if (newRow.startDate && newRow.endDate && new Date(newRow.endDate) <= new Date(newRow.startDate)) {
      if (showErrors) { note += '❌ End date must be after start date<br>'; errors.endDate = 'End date must be after start date'; }
      noteErrorList.push('End date must be after start date');
    }

    if (newRow.policyName === 'Investment-Linked' && !newRow.fundTypeILP?.trim()) {
      if (showErrors) { note += '❌ Fund type is required for Investment-Linked policies<br>'; errors.fundTypeILP = 'Fund type required'; }
      noteErrorList.push('Fund type required');
    }

    if (newRow.recommended === undefined || newRow.recommended === null || newRow.recommended === '') {
      if (showErrors) { note += '❌ Recommended selection is required<br>'; errors.recommended = 'Recommended required'; }
      noteErrorList.push('Recommended missing');
    }

    setFieldErrors(errors);
    setNoteErrors(noteErrorList);

    if (noteErrorList.length === 0) {
      const requiredFields = ['fullName','nric','policyName','premium','provider','coverageAmount','premiumFrequency','startDate','endDate','status'];
      const allFilled = requiredFields.every(f => {
        const v = newRow[f];
        if (f === 'premium' || f === 'coverageAmount') return v && Number(v) > 0;
        return v && v.toString().trim() !== '';
      });
      const hasContact = hasEmail || hasPhone;
      const hasRecommended = newRow.recommended !== undefined && newRow.recommended !== null && newRow.recommended !== '';
      const hasValidFundType = newRow.policyName !== 'Investment-Linked' || !!newRow.fundTypeILP?.trim();

      if (allFilled && hasContact && hasRecommended && hasValidFundType) {
        setValidationNote('✅ Data is clean and complete');
      } else {
        setValidationNote('Please fill in all required fields (except email/phone - only one needed). Click "Save" to validate and save.');
      }
    } else if (!showErrors) {
      setValidationNote('Please fill in all required fields (except email/phone - only one needed). Click "Save" to validate and save.');
    } else {
      setValidationNote(note);
    }

  }, [
    newRow?.fullName, newRow?.policyName, newRow?.nric, newRow?.email, newRow?.phone,
    newRow?.fundTypeILP, newRow?.premium, newRow?.provider, newRow?.coverageAmount,
    newRow?.premiumFrequency, newRow?.startDate, newRow?.endDate, newRow?.status,
    newRow?.recommended, hasAttemptedSubmit, usedIds, clientDb
  ]);

  const calculateStatus = (endDate) => {
    if (!endDate) return 'Active';
    const today = new Date();
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end - today) / (1000 * 3600 * 24));
    if (daysDiff < 0) return 'Expired';
    if (daysDiff <= 30) return 'Expiring Soon';
    return 'Active';
  };

  useEffect(() => {
    if (newRow?.endDate) {
      const autoStatus = calculateStatus(newRow.endDate);
      if (autoStatus !== newRow.status) {
        setNewRow(prev => ({ ...prev, status: autoStatus }));
      }
    }
  }, [newRow?.endDate]);

  useEffect(() => {
    if (newRow?.fullName?.trim()) {
      const allUsedClientIds = [...usedIds, ...clientDb.map(c => c.clientId)];
      const newClientId = generateSmartClientId(newRow.fullName, allUsedClientIds, clientDb, newRow.nric);
      if (newClientId !== newRow.clientId) {
        setNewRow(prev => ({ ...prev, clientId: newClientId }));
      }
    }
  }, [newRow?.fullName, newRow?.nric, usedIds, clientDb]);

  useEffect(() => {
    if (newRow?.policyName && (!newRow.policyTypeId || newRow.policyTypeId === '')) {
      let derived = policyTypeMap && policyTypeMap[newRow.policyName];
      if (!derived) derived = autoMapPolicyType(newRow.policyName);
      if (derived && derived !== newRow.policyTypeId) {
        setNewRow(prev => ({ ...prev, policyTypeId: derived }));
      }
    }
  }, [newRow?.policyName, policyTypeMap]);

  useEffect(() => {
    if (newRow?.clientId && newRow?.policyName) {
      const newPolicyId = generatePolicyId(newRow.clientId, newRow.policyName);
      if (newPolicyId !== newRow.policyId) {
        setNewRow(prev => ({ ...prev, policyId: newPolicyId }));
      }
    }
  }, [newRow?.clientId, newRow?.policyName, policyTypeMap]);

  const handleChange = (field, value) => {
    if (field === 'phone' && value && !value.startsWith('+65')) {
      if (/^\d{8}$/.test(value.trim())) value = `+65 ${value.trim()}`;
    }
    setNewRow(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors(prev => ({ ...prev, [field]: null }));
    if (field === 'nric' && newRow.fullName) {
      setTimeout(() => {
        const allUsedClientIds = [...usedIds, ...clientDb.map(c => c.clientId)];
        const newClientId = generateSmartClientId(newRow.fullName, allUsedClientIds, clientDb, value);
        setNewRow(prev => ({ ...prev, clientId: newClientId }));
      }, 100);
    }
  };

  const handleSubmit = () => {
    setHasAttemptedSubmit(true);
    const requiredFields = ['fullName','nric','policyName','premium','provider','coverageAmount','premiumFrequency','startDate','endDate','status'];
    const hasEmptyRequired = requiredFields.some(f => !newRow[f] || newRow[f].toString().trim() === '');
    const hasContact = !!(newRow.email?.trim() || newRow.phone?.trim());
    const hasRecommended = newRow.recommended !== undefined && newRow.recommended !== null && newRow.recommended !== '';
    if (hasEmptyRequired || !hasContact || !hasRecommended) return;

    setTimeout(() => {
      if (noteErrors.length > 0 || validationNote?.includes('❌')) return;
      const finalData = {
        ...newRow,
        premium: Number(newRow.premium) || 0,
        coverageAmount: Number(newRow.coverageAmount) || 0,
        advisorId: Number(newRow.advisorId) || 1,
        fullName: newRow.fullName?.trim() || '',
        email: newRow.email?.trim() || '',
        phone: newRow.phone?.trim() || '',
        nric: newRow.nric?.trim()?.toUpperCase() || '',
        policyName: newRow.policyName?.trim() || '',
        provider: newRow.provider?.trim() || 'AIA',
        status: newRow.status || 'Active',
        premiumFrequency: newRow.premiumFrequency || 'Monthly',
        note: validationNote,
      };
      try {
        onAdd(finalData);
        onClose();
      } catch (error) {
        setValidationNote('❌ Error saving data. Please check all fields and try again.');
      }
    }, 100);
  };

  const adjustNumber = (field, increment) => {
    const newValue = Math.max(0, (Number(newRow[field]) || 0) + increment);
    handleChange(field, newValue);
  };

  const isExistingClient = newRow.nric?.trim()
    ? clientDb.some(c => c.nric && c.nric.toLowerCase() === newRow.nric.toLowerCase())
    : false;

  const editableFields = [
    { key: 'fullName', label: 'Full Name', type: 'text', required: true },
    { key: 'clientId', label: 'Client ID', type: 'text', required: true, readonly: true },
    { key: 'email', label: 'Email', type: 'email', required: false },
    { key: 'phone', label: 'Phone', type: 'text', required: false },
    { key: 'nric', label: 'NRIC', type: 'text', required: true },
    { key: 'policyName', label: 'Policy Name', type: 'select', required: true },
    { key: 'policyId', label: 'Policy ID', type: 'text', readonly: true },
    { key: 'fundTypeILP', label: 'Fund Type ILP', type: 'select', conditional: 'Investment-Linked', required: true },
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
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Add New Row</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="form-grid">
            {editableFields.map((field) => {
              const { key, label, type, required, readonly, conditional, step } = field;
              const value = newRow[key];
              const hasError = fieldErrors[key];
              if (conditional && newRow.policyName !== conditional) return null;
              const isConditionalRequired = conditional === 'Investment-Linked' && newRow.policyName === 'Investment-Linked' && required;

              if (type === 'checkbox') {
                return (
                  <div className="form-field full-width" key={key}>
                    <label className="checkbox-label">
                      <input type="checkbox" checked={!!value} onChange={(e) => handleChange(key, e.target.checked)} />
                      <span className="checkbox-text">{label} {required && <span className="required">*</span>}</span>
                    </label>
                  </div>
                );
              }

              if (type === 'stepper') {
                return (
                  <div className="form-field" key={key}>
                    <label className="field-label">{label} {required && <span className="required">*</span>}</label>
                    <div className="stepper-container">
                      <button type="button" className="stepper-btn" onClick={() => adjustNumber(key, -step)}>-</button>
                      <input type="number" value={value || 0} onChange={(e) => handleChange(key, e.target.value)} className={`field-input stepper-input ${hasError ? 'error' : ''}`} step={step} min="0" />
                      <button type="button" className="stepper-btn" onClick={() => adjustNumber(key, step)}>+</button>
                    </div>
                    {hasError && <span className="field-error">{hasError}</span>}
                  </div>
                );
              }

              if (type === 'select') {
                let options = [];
                if (key === 'policyName') {
                  const mapOptions = policyTypeMap ? Object.keys(policyTypeMap) : [];
                  options = mapOptions.length > 0 ? mapOptions : [
                    'Whole Life','Term Life','Investment-Linked','Endowment','Retirement Plan',
                    'Personal Accident','Long-Term Care','Hospitalization','Critical Illness',
                    'Home','Travel','Car','Disability','Child Education','Income Protection','Universal Life'
                  ];
                } else if (key === 'provider') {
                  options = ['AIA','Prudential','AXA','Great Eastern','NTUC Income','Manulife'];
                } else if (key === 'premiumFrequency') {
                  options = ['Monthly','Quarterly','Semi-Annually','Annually'];
                } else if (key === 'status') {
                  options = ['Active','Expiring Soon','Expired'];
                } else if (key === 'fundTypeILP') {
                  options = ['Growth','Balanced','Income','Conservative'];
                } else if (key === 'recommended') {
                  options = ['Yes','No'];
                }
                return (
                  <div className="form-field" key={key}>
                    <label className="field-label">{label} {(required || isConditionalRequired) && <span className="required">*</span>}</label>
                    <select value={value || ''} onChange={(e) => handleChange(key, e.target.value)} className={`field-input ${hasError ? 'error' : ''}`}>
                      <option value="">-- Select --</option>
                      {options.map(o => <option key={o} value={o}>{o}</option>)}
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
                    type={type} value={value || ''}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className={`field-input ${hasError ? 'error' : ''} ${readonly ? 'readonly' : ''}`}
                    readOnly={readonly} placeholder={readonly ? 'Auto-generated' : ''}
                  />
                  {hasError && <span className="field-error">{hasError}</span>}
                </div>
              );
            })}
          </div>

          <div className="contact-info-note">
            <p><strong>Note:</strong> At least one contact method (Email or Phone) is required.</p>
          </div>

          <div className={`status-box ${noteErrors.length > 0 ? 'error' : 'success'}`}>
            <h4>{noteErrors.length > 0 ? 'Please fix the errors mentioned below.' : 'Status'}</h4>
            <p className="client-status">{isExistingClient ? '🔄 Adding Policy to Existing Client' : '✨ New Client'}</p>
          </div>

          <div className="note-section">
            <label className="note-label">Validation Note</label>
            <div className="note-content" dangerouslySetInnerHTML={{ __html: validationNote }} />
          </div>
        </div>

        <div className="modal-actions">
          <div />
          <div className="action-group">
            <button onClick={onClose} className="btn btn-secondary" type="button">Cancel</button>
            <button
              onClick={handleSubmit}
              className="btn btn-primary"
              type="button"
              disabled={(() => {
                if (!hasAttemptedSubmit) return false;
                const requiredFields = ['fullName','nric','policyName','premium','provider','coverageAmount','premiumFrequency','startDate','endDate','status'];
                const hasEmptyRequired = requiredFields.some(f => !newRow[f] || newRow[f].toString().trim() === '');
                const hasContact = !!(newRow.email?.trim() || newRow.phone?.trim());
                const hasRecommended = newRow.recommended !== undefined && newRow.recommended !== null && newRow.recommended !== '';
                return hasEmptyRequired || !hasContact || !hasRecommended || noteErrors.length > 0;
              })()}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddRowModal;