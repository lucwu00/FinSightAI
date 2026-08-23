import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AddEditPolicyModal.css';

const premiumFrequencies = ["Monthly", "Quarterly", "Semi-Annually", "Annually", "One-time"];
const fundTypes = ["Balanced", "Growth", "Income", "Aggressive", "Conservative"];
const providers = ["AIA", "Prudential", "Great Eastern", "NTUC Income", "Manulife", "AXA"];
const statusOptions = ["Active", "Pending", "Expired"];

// Individual Policy Edit Form
function PolicyEditForm({ policy, existingPolicies = [], onSave, onDelete, onClose }) {
  const [editedPolicy, setEditedPolicy] = useState({ ...policy });
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [originalPolicy, setOriginalPolicy] = useState({ ...policy });
  const [hasChanges, setHasChanges] = useState(false);
  const [reminder, setReminder] = useState("");
  const [policyTypeMap, setPolicyTypeMap] = useState({});
const [productTypes, setProductTypes] = useState([]);

// Add this useEffect to fetch from Policy Store
useEffect(() => {
  const fetchPolicyTypes = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/policies/store/policies`);
      const storePolicies = await response.json();
      
      const typeMap = {};
      storePolicies.forEach(policy => {
        typeMap[policy.name] = policy.policyId;
      });
      
      setPolicyTypeMap(typeMap);
      setProductTypes(Object.keys(typeMap));
    } catch (error) {
      console.error('Failed to fetch policy types:', error);
      // Fallback to hardcoded if needed
    }
  };
  
  fetchPolicyTypes();
}, []);


  // Debug the initial policy data
  useEffect(() => {
    console.log('🔍 PolicyEditForm received policy:', policy);
    
    // Use policyName consistently instead of productType
    const processedPolicy = {
      ...policy,
      // Use policyName as the main field
      policyName: policy.policyName || policy.productType || '',
      // Ensure we have all required fields
      policyId: policy.policyId || '',
      clientId: policy.clientId || '',
      fundTypeILP: policy.fundTypeILP || '',
      provider: policy.provider || '',
      coverageAmount: policy.coverageAmount || 0,
      premium: policy.premium || 0,
      premiumFrequency: policy.premiumFrequency || '',
      startDate: policy.startDate || '',
      endDate: policy.endDate || '',
      status: policy.status || 'Active',
      recommended: policy.recommended !== undefined ? policy.recommended : false,
      notes: policy.notes || ''
    };
    
    console.log('🔍 Processed policy for editing:', processedPolicy);
    setEditedPolicy(processedPolicy);
    setOriginalPolicy(processedPolicy);
    
    // Check for duplicates on initial load
    const name = (processedPolicy.policyName || '').trim();
    if (name) {
      const dup = existingPolicies.some(
  p => {
    console.log('🔍 DEBUG: Comparing policy:', p.policyId, 'vs originalPolicy:', originalPolicy.policyId, 'policyName:', p.policyName || p.productType);
    return p.policyId !== originalPolicy.policyId &&
           ((p.policyName || p.productType || '').trim() === name);
  }
);
console.log('🔍 DEBUG: Duplicate found:', dup);
setReminder(
  dup
    ? `⚠️ Another ${name} policy already exists for this client. Please ensure this is intended.`
    : ''
);
    } else {
      setReminder('');
    }
  }, [policy, existingPolicies]);

  useEffect(() => {
    const checkForChanges = () => {
      const fieldsToCheck = ['policyName', 'coverageAmount', 'premium', 'provider', 'premiumFrequency', 'startDate', 'endDate', 'fundTypeILP', 'recommended', 'notes'];
      
      const changed = fieldsToCheck.some(field => {
        const original = originalPolicy[field];
        const current = editedPolicy[field];
        
        if (typeof original === 'boolean' || typeof current === 'boolean') {
          return Boolean(original) !== Boolean(current);
        }
        if (typeof original === 'number' || typeof current === 'number') {
          return Number(original) !== Number(current);
        }
        return String(original || '').trim() !== String(current || '').trim();
      });
      
      setHasChanges(changed);
    };
    
    checkForChanges();
  }, [editedPolicy, originalPolicy]);

  const handleChange = (field, value) => {
  console.log(`🔄 Changing field ${field} to:`, value);

  setEditedPolicy(prev => {
    const updated = { ...prev, [field]: value };

    // When policy type changes…
    if (field === 'policyName') {
      // Get the new policy type ID from the map
      const newPolicyTypeId = policyTypeMap[value] || '';
      updated.policyTypeId = newPolicyTypeId;

      // Regenerate policyId with the NEW policy type ID
      if (updated.clientId && newPolicyTypeId) {
        updated.policyId = `${updated.clientId}-${newPolicyTypeId}`;
        console.log(`🆔 Generated new policyId: ${updated.policyId}`);
      }

      // Reset ILP fund when not ILP
      if (value !== 'Investment-Linked') {
        updated.fundTypeILP = '';
      }

      // Clear field error
      if (fieldErrors.policyName) {
        setFieldErrors(prevErr => ({ ...prevErr, policyName: null }));
      }

      // Duplicate warning (exclude current policyId using ORIGINAL policy ID)
      const name = (value || '').trim();
      console.log('🔍 DEBUG: Checking duplicates for:', name);
      console.log('🔍 DEBUG: existingPolicies:', existingPolicies);
      console.log('🔍 DEBUG: originalPolicy.policyId:', originalPolicy.policyId);
      
      if (name) {
        const dup = existingPolicies.some(p => {
          console.log('🔍 DEBUG: Comparing policy:', p.policyId, 'vs originalPolicy:', originalPolicy.policyId, 'policyName:', p.policyName || p.productType);
          return p.policyId !== originalPolicy.policyId &&
                 ((p.policyName || p.productType || '').trim() === name);
        });
        console.log('🔍 DEBUG: Duplicate found:', dup);
        setReminder(dup ? `⚠️ Another ${name} policy already exists for this client. Please ensure this is intended.` : '');
        console.log('🔍 DEBUG: Reminder state set to:', dup ? `⚠️ Another ${name} policy already exists for this client. Please ensure this is intended.` : '(empty)');
      } else {
        setReminder('');
      }
    }

    // Auto-adjust status when endDate changes
    if (field === 'endDate') {
      const currentDate = new Date();
      const endDate = new Date(value);
      const currentYear = currentDate.getFullYear();
      const endYear = endDate.getFullYear();

      let autoStatus;
      if (endDate < currentDate) autoStatus = 'Expired';
      else if (endYear === currentYear) autoStatus = 'Expiring Soon';
      else autoStatus = 'Active';

      updated.status = autoStatus;
    }

    console.log('🔄 Updated policy state:', updated);
    return updated;
  });

  // Clear any other field error once user edits
  if (fieldErrors[field]) {
    setFieldErrors(prev => ({ ...prev, [field]: null }));
  }
};


  const validateForm = () => {
    const errors = {};
    
    // Required field validations
    if (!editedPolicy.policyName) errors.policyName = 'Policy type is required';
    if (!editedPolicy.coverageAmount || Number(editedPolicy.coverageAmount) <= 0) {
      errors.coverageAmount = 'Coverage amount must be greater than 0';
    }
    if (!editedPolicy.premium || Number(editedPolicy.premium) <= 0) {
      errors.premium = 'Premium must be greater than 0';
    }
    if (!editedPolicy.provider) errors.provider = 'Provider is required';
    if (!editedPolicy.startDate) errors.startDate = 'Start date is required';
    if (!editedPolicy.endDate) errors.endDate = 'End date is required';
    if (!editedPolicy.premiumFrequency) errors.premiumFrequency = 'Premium frequency is required';
    
    // Date validation
    if (editedPolicy.startDate && editedPolicy.endDate && 
        new Date(editedPolicy.startDate) >= new Date(editedPolicy.endDate)) {
      errors.endDate = 'End date must be after start date';
    }
    
    // Investment-Linked specific validation
    if (editedPolicy.policyName === 'Investment-Linked' && !editedPolicy.fundTypeILP) {
      errors.fundTypeILP = 'Fund type is required for Investment-Linked policies';
    }

    // Recommended field validation
    if (editedPolicy.recommended === null || editedPolicy.recommended === undefined) {
      errors.recommended = 'Recommended selection is required';
    }

    return errors;
  };

  const handleSubmit = async () => {
    console.log('🚀 Submit clicked, editedPolicy:', editedPolicy);
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      console.log('❌ Validation errors:', errors);
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
  try {
    // Prepare payload using policyName consistently
    const payload = {
      ...editedPolicy,
      // CRITICAL: Use originalPolicyId for the API endpoint
      originalPolicyId: originalPolicy.policyId,
      // Use policyName as the main field
      policyName: editedPolicy.policyName,
      // Ensure policyTypeId is correctly set
      policyTypeId: policyTypeMap[editedPolicy.policyName] || editedPolicy.policyTypeId,
      // Use the NEW policy ID (this will be different if policy type changed)
      policyId: editedPolicy.policyId,
      status: editedPolicy.status === 'Expiring Soon' ? 'Active' : editedPolicy.status,
      fundTypeILP: editedPolicy.policyName === 'Investment-Linked' ? editedPolicy.fundTypeILP : '',
      notes: editedPolicy.notes?.trim() || '',
      _id: editedPolicy._id || editedPolicy.id
    };
    
    console.log('📤 Sending payload:', payload);
    console.log('🔑 API endpoint will use originalPolicyId:', payload.originalPolicyId);
    console.log('🆔 New policyId in payload:', payload.policyId);
    
    await onSave(payload);
    onClose();
  } catch (error) {
    console.error('❌ Save failed:', error);
    alert('Failed to save policy: ' + (error?.response?.data?.error || error.message));
  } finally {
    setIsSubmitting(false);
  }
};

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this policy? This action cannot be undone.')) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onDelete(editedPolicy.policyId);
      onClose();
    } catch (error) {
      console.error('❌ Delete failed:', error);
      alert('Failed to delete policy: ' + (error?.response?.data?.error || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const adjustNumber = (field, increment) => {
    const currentValue = Number(editedPolicy[field]) || 0;
    const newValue = Math.max(0, currentValue + increment);
    handleChange(field, newValue);
  };

  const handleClose = () => {
    console.log('🚪 Close button clicked');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) {
        console.log('🚪 Overlay clicked - closing modal');
        onClose();
      }
    }}>
      <div className="modal-container">
        <div className="modal-header">
          <h2>Edit Policy: {editedPolicy.policyId}</h2>
          <button className="modal-close" onClick={handleClose}>✖</button>
        </div>
        
        <div className="modal-body">
          <div className="form-grid">
            {/* Client ID - Read only */}
            <div className="form-field">
              <label className="field-label">Client ID</label>
              <input 
                value={editedPolicy.clientId || ''} 
                readOnly 
                className="field-input readonly"
              />
            </div>

            {/* Policy ID - Read only */}
            <div className="form-field">
              <label className="field-label">
                Policy ID <span className="auto-generated">(auto-generated)</span>
              </label>
              <input 
                value={editedPolicy.policyId || ''} 
                readOnly 
                className="field-input readonly"
              />
            </div>

            {/* Policy Type */}
            <div className="form-field">
              <label className="field-label">
                Policy Type <span className="required">*</span>
              </label>
              <select 
                value={editedPolicy.policyName || ''}
                onChange={(e) => handleChange('policyName', e.target.value)}
                className={`field-input ${fieldErrors.policyName ? 'error' : ''}`}
              >
                <option value="">-- Select --</option>
                {Object.keys(policyTypeMap).map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {fieldErrors.policyName && <div className="field-error">{fieldErrors.policyName}</div>}
              {reminder && (
                console.log('🔍 DEBUG: Rendering reminder:', reminder) ||
                <div className="status-box error" style={{ 
                  marginTop: '0.5rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffeaa7',
                  borderRadius: '4px',
                  color: '#856404',
                  fontSize: '0.875rem'
                }}>
                  {reminder}
                </div>
              )}
            </div>

            {/* Fund Type ILP - only for Investment-Linked */}
            {editedPolicy.policyName === 'Investment-Linked' && (
              <div className="form-field">
                <label className="field-label">
                  Fund Type ILP <span className="required">*</span>
                </label>
                <select 
                  value={editedPolicy.fundTypeILP || ''} 
                  onChange={(e) => handleChange('fundTypeILP', e.target.value)}
                  className={`field-input ${fieldErrors.fundTypeILP ? 'error' : ''}`}
                >
                  <option value="">-- Select --</option>
                  {fundTypes.map((ft) => (
                    <option key={ft} value={ft}>{ft}</option>
                  ))}
                </select>
                {fieldErrors.fundTypeILP && <div className="field-error">{fieldErrors.fundTypeILP}</div>}
              </div>
            )}

            {/* Coverage Amount with Stepper */}
            <div className="form-field">
              <label className="field-label">
                Coverage Amount <span className="required">*</span>
              </label>
              <div className="stepper-container">
                <button 
                  type="button"
                  className="stepper-btn"
                  onClick={() => adjustNumber('coverageAmount', -1000)}
                >
                  -
                </button>
                <input
                  type="number"
                  value={editedPolicy.coverageAmount || 0}
                  onChange={(e) => handleChange('coverageAmount', e.target.value)}
                  className={`field-input stepper-input ${fieldErrors.coverageAmount ? 'error' : ''}`}
                  step="1000"
                  min="0"
                />
                <button 
                  type="button"
                  className="stepper-btn"
                  onClick={() => adjustNumber('coverageAmount', 1000)}
                >
                  +
                </button>
              </div>
              {fieldErrors.coverageAmount && <div className="field-error">{fieldErrors.coverageAmount}</div>}
            </div>

            {/* Premium Amount with Stepper */}
            <div className="form-field">
              <label className="field-label">
                Premium Amount <span className="required">*</span>
              </label>
              <div className="stepper-container">
                <button 
                  type="button"
                  className="stepper-btn"
                  onClick={() => adjustNumber('premium', -100)}
                >
                  -
                </button>
                <input
                  type="number"
                  value={editedPolicy.premium || 0}
                  onChange={(e) => handleChange('premium', e.target.value)}
                  className={`field-input stepper-input ${fieldErrors.premium ? 'error' : ''}`}
                  step="100"
                  min="0"
                />
                <button 
                  type="button"
                  className="stepper-btn"
                  onClick={() => adjustNumber('premium', 100)}
                >
                  +
                </button>
              </div>
              {fieldErrors.premium && <div className="field-error">{fieldErrors.premium}</div>}
            </div>

            {/* Premium Frequency */}
            <div className="form-field">
              <label className="field-label">
                Premium Frequency <span className="required">*</span>
              </label>
              <select 
                value={editedPolicy.premiumFrequency || ''} 
                onChange={(e) => handleChange('premiumFrequency', e.target.value)}
                className={`field-input ${fieldErrors.premiumFrequency ? 'error' : ''}`}
              >
                <option value="">-- Select --</option>
                {premiumFrequencies.map((freq) => (
                  <option key={freq} value={freq}>{freq}</option>
                ))}
              </select>
              {fieldErrors.premiumFrequency && <div className="field-error">{fieldErrors.premiumFrequency}</div>}
            </div>

            {/* Provider */}
            <div className="form-field">
              <label className="field-label">
                Provider <span className="required">*</span>
              </label>
              <select 
                value={editedPolicy.provider || ''} 
                onChange={(e) => handleChange('provider', e.target.value)}
                className={`field-input ${fieldErrors.provider ? 'error' : ''}`}
              >
                <option value="">-- Select --</option>
                {providers.map((provider) => (
                  <option key={provider} value={provider}>{provider}</option>
                ))}
              </select>
              {fieldErrors.provider && <div className="field-error">{fieldErrors.provider}</div>}
            </div>

            {/* Start Date */}
            <div className="form-field">
              <label className="field-label">
                Start Date <span className="required">*</span>
              </label>
              <input 
                type="date" 
                value={editedPolicy.startDate?.slice(0, 10) || ''} 
                onChange={(e) => handleChange('startDate', e.target.value)}
                className={`field-input ${fieldErrors.startDate ? 'error' : ''}`}
              />
              {fieldErrors.startDate && <div className="field-error">{fieldErrors.startDate}</div>}
            </div>

            {/* End Date */}
            <div className="form-field">
              <label className="field-label">
                End Date <span className="required">*</span>
              </label>
              <input 
                type="date" 
                value={editedPolicy.endDate?.slice(0, 10) || ''} 
                onChange={(e) => handleChange('endDate', e.target.value)}
                className={`field-input ${fieldErrors.endDate ? 'error' : ''}`}
              />
              {fieldErrors.endDate && <div className="field-error">{fieldErrors.endDate}</div>}
            </div>

            {/* Status - Auto-generated but visible */}
            <div className="form-field">
              <label className="field-label">
                Status <span className="auto-generated">(auto-generated)</span>
              </label>
              <input 
                value={editedPolicy.status || ''} 
                readOnly 
                className="field-input readonly" 
                style={{
                  color: editedPolicy.status === 'Expired' ? '#dc3545' : 
                         editedPolicy.status === 'Expiring Soon' ? '#ffc107' : '#28a745',
                  fontWeight: 'bold'
                }}
              />
            </div>

            {/* Recommended Checkbox */}
            <div className="form-field full-width">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={!!editedPolicy.recommended}
                  onChange={(e) => handleChange('recommended', e.target.checked)}
                />
                <span className="checkbox-text">
                  Recommended Policy <span className="required">*</span>
                </span>
              </label>
              {fieldErrors.recommended && <div className="field-error">{fieldErrors.recommended}</div>}
            </div>

            {/* Notes */}
            <div className="form-field full-width">
              <label className="field-label">Notes</label>
              <textarea
                value={editedPolicy.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
                className="field-input"
                rows="3"
                placeholder="Additional notes about this policy..."
              />
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button 
            onClick={handleDelete}
            className="btn btn-danger"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Deleting...' : 'Delete'}
          </button>
          
          <div className="action-group">
            <button 
              onClick={handleClose}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              className="btn btn-primary"
              disabled={isSubmitting || !hasChanges}
              style={{ 
                opacity: (!hasChanges || isSubmitting) ? 0.5 : 1 
              }}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Edit Policy Modal
function EditPolicyModal({ policies, selectedPolicy: initialPolicy, onClose, onUpdateSuccess }) {
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showEditMessage, setShowEditMessage] = useState(false);

  useEffect(() => {
    console.log('🔍 EditPolicyModal props:', { policies, initialPolicy });
    if (initialPolicy) {
      setSelectedPolicy(initialPolicy);
    }
  }, [initialPolicy]);

  const handleSavePolicy = async (updatedPolicy) => {
    console.log('💾 Saving policy:', updatedPolicy);
    try {
      const targetId = updatedPolicy.originalPolicyId || updatedPolicy.policyId;
      const response = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/api/policies/${encodeURIComponent(targetId)}`,
        updatedPolicy
      );
      console.log('✅ Policy saved successfully:', response.data);
      onUpdateSuccess();
    } catch (error) {
      console.error('❌ Save policy error:', error.response?.data || error);
      throw error;
    }
  };

  const handleDeletePolicy = async (policyId) => {
    console.log('🗑️ Deleting policy:', policyId);
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/policies/${policyId}`);
      console.log('✅ Policy deleted successfully');
      onUpdateSuccess();
    } catch (error) {
      console.error('❌ Delete policy error:', error.response?.data || error);
      throw error;
    }
  };

  const handleEditClick = (policy, index) => {
    console.log('🚨 EDIT CLICKED for policy:', policy.policyId, 'index:', index);
    setSelectedPolicy({ ...policy, rowIndex: index });
    setEditMode(false);
    setShowEditMessage(false);
  };

  const handleModalClose = () => {
    console.log('🚪 Modal closing');
    setSelectedPolicy(null);
    onClose();
  };

  const sortedPolicies = [...policies].sort((a, b) => a.policyId.localeCompare(b.policyId));

  if (selectedPolicy || initialPolicy) {
    const activePolicy = selectedPolicy || initialPolicy;
    const siblingPolicies = (policies || []).filter(
  p => p.clientId === activePolicy.clientId && p.policyId !== activePolicy.policyId
);

// ADD THESE DEBUG LOGS:
console.log('🔍 DEBUG: All policies:', policies);
console.log('🔍 DEBUG: activePolicy.clientId:', activePolicy.clientId);
console.log('🔍 DEBUG: activePolicy.policyId:', activePolicy.policyId);
console.log('🔍 DEBUG: Filtered siblingPolicies:', siblingPolicies);
console.log('🔍 DEBUG: All policies for this client:', policies.filter(p => p.clientId === activePolicy.clientId));

    return (
      <PolicyEditForm
        policy={activePolicy}
        existingPolicies={siblingPolicies}
        onSave={handleSavePolicy}
        onDelete={handleDeletePolicy}
        onClose={handleModalClose}
      />
    );
  }

  // Otherwise show the policy list
  return (
    <div className="modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) {
        console.log('🚪 Overlay clicked - closing modal');
        onClose();
      }
    }}>
      <div className="modal-container" style={{ maxWidth: '1100px' }}>
        <div className="modal-header">
          <h2>Edit Policy Data</h2>
          <button className="modal-close" onClick={onClose}>✖</button>
        </div>
        
        <div className="modal-body">
          <div className="enhanced-controls" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            padding: '1rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <div className="row-action-buttons">
              <button
                className="edit-button"
                onClick={() => {
                  console.log('🚨 EDIT MODE ACTIVATED');
                  setEditMode(true);
                  setShowEditMessage(true);
                  setTimeout(() => setShowEditMessage(false), 3000);
                }}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                ✏️ Edit Policy
              </button>
            </div>

            <div className="validation-summary" style={{
              display: 'flex',
              gap: '1rem',
              fontSize: '14px'
            }}>
              <span className="summary-item" style={{ color: '#28a745' }}>
                📋 Total Policies: {policies.length}
              </span>
              <span className="summary-item" style={{ color: '#17a2b8' }}>
                📊 Click "Edit Policy" then click any row to edit
              </span>
            </div>
          </div>

          {showEditMessage && (
            <div style={{
              backgroundColor: '#e3f2fd',
              color: '#1976d2',
              padding: '0.75rem 1rem',
              borderRadius: '4px',
              fontSize: '14px',
              textAlign: 'center',
              marginBottom: '1rem',
              border: '1px solid #1976d2'
            }}>
              ✏️ Edit Mode Activated — click any row in the table to edit that specific policy.
            </div>
          )}

          <div className="policy-table-container">
            <table className="policy-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>No.</th>
                  <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>Policy ID</th>
                  <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>Policy Type</th>
                  <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>Fund Type</th>
                  <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>Coverage</th>
                  <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>Premium</th>
                  <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>End Date</th>
                </tr>
              </thead>
              <tbody>
                {sortedPolicies.map((policy, index) => {
                  const isExpired = new Date(policy.endDate) < new Date();
                  const isExpiringSoon = new Date(policy.endDate) <= new Date(Date.now() + 365*24*60*60*1000);
                  
                  return (
                    <tr 
                      key={policy._id || index}
                      onClick={() => editMode && handleEditClick(policy, index)}
                      style={{
                        backgroundColor: editMode ? '#f0f8ff' :
                                       isExpired ? '#fff5f5' : 
                                       isExpiringSoon ? '#fffbf0' : 'white',
                        cursor: editMode ? 'pointer' : 'default',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (editMode) {
                          e.target.parentElement.style.backgroundColor = '#e3f2fd';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (editMode) {
                          e.target.parentElement.style.backgroundColor = '#f0f8ff';
                        } else {
                          e.target.parentElement.style.backgroundColor = isExpired ? '#fff5f5' : 
                                                                         isExpiringSoon ? '#fffbf0' : 'white';
                        }
                      }}
                    >
                      <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                        {index + 1}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                        {policy.policyId}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                        {policy.policyName}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                        {policy.fundTypeILP || '-'}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                        ${Number(policy.coverageAmount || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                        ${Number(policy.premium || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                        <span style={{
                          color: policy.status === 'Expired' ? '#dc3545' : 
                                 policy.status === 'Active' ? '#28a745' : '#6c757d',
                          fontWeight: 'bold'
                        }}>
                          {policy.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                        {policy.endDate ? new Date(policy.endDate).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {policies.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '2rem', 
              color: '#6c757d' 
            }}>
              No policies found to edit.
            </div>
          )}

          <div className="user-guide-box" style={{
            marginTop: '1rem',
            padding: '1.5rem',
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            fontSize: '0.9rem',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>📋</span>
              <strong style={{ color: '#495057', fontSize: '1rem' }}>Edit Policy User Guide</strong>
            </div>
            
            <div style={{ color: '#6c757d', textAlign: 'left' }}>
              <p style={{ margin: '0 0 0.5rem 0' }}>
                <strong>✏️ How to Edit:</strong> Click the "Edit Policy" button to activate edit mode, then click on any row in the table to edit that specific policy.
              </p>
              <p style={{ margin: '0 0 0.5rem 0' }}>
                <strong>🎯 Features:</strong> Edit all policy details, auto-generate policy type IDs, validate Investment-Linked fund types, and delete policies if needed.
              </p>
              <p style={{ margin: 0 }}>
                <strong>🔄 Auto-Updates:</strong> Status automatically updates based on end date, and policy type IDs are generated when you change the product type.
              </p>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <div className="action-group">
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditPolicyModal;