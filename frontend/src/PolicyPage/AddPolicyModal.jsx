import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AddEditPolicyModal.css';

function AddPolicyModal({ onClose, onAddSuccess, clientId, existingPolicies, selectedClient }) {
  const [formData, setFormData] = useState({
    clientId: '',
    policyId: '',
    productType: '',
    fundTypeILP: '',
    coverageAmount: '',
    premium: '',
    provider: 'AIA',
    premiumFrequency: '',
    startDate: '',
    endDate: '',
    status: 'Active',
    recommended: false,
    notes: ''
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [reminder, setReminder] = useState('');

  const [policyTypeMap, setPolicyTypeMap] = useState({});
const [productTypes, setProductTypes] = useState([]);

const premiumFrequencies = ["Monthly", "Quarterly", "Semi-Annually", "Annually", "One-time"];
const fundTypes = ["Balanced", "Growth", "Income", "Aggressive", "Conservative"];
const providers = ["AIA", "Prudential", "Great Eastern", "NTUC Income", "Manulife", "AXA"];

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
      // ADD FALLBACK:
      const fallbackMap = {
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
      setPolicyTypeMap(fallbackMap);
      setProductTypes(Object.keys(fallbackMap));
    }
  };
  
  fetchPolicyTypes();
}, []);

  // Initialize client ID and auto-generate policy ID
  useEffect(() => {
    // Set client ID
    setFormData(prev => ({ ...prev, clientId: clientId.toUpperCase() }));
  }, [clientId]);

  // Auto-generate policy ID when product type changes
  useEffect(() => {
    if (formData.productType && formData.clientId) {
      const policyTypeId = policyTypeMap[formData.productType];
      if (policyTypeId) {
        // Simple format: C001-PT003 (no additional numbers)
        const newPolicyId = `${formData.clientId}-${policyTypeId}`;
        setFormData(prev => ({ ...prev, policyId: newPolicyId }));
      }
    }
  }, [formData.productType, formData.clientId]);

  // Auto-adjust status based on end date
useEffect(() => {
  if (formData.endDate) {
    const currentDate = new Date();
    const endDate = new Date(formData.endDate);
    const currentYear = currentDate.getFullYear();
    const endYear = endDate.getFullYear();

    let autoStatus;
    if (endDate < currentDate) {
      autoStatus = 'Expired';
    } else if (endYear === currentYear) {
      autoStatus = 'Expiring Soon'; 
    } else {
      autoStatus = 'Active'; // Next year or later = Active
    }

    setFormData(prev => ({ ...prev, status: autoStatus }));
  }
}, [formData.endDate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === 'checkbox' ? checked : value;

    if (name === 'productType') {
      setFormData(prev => ({
        ...prev,
        productType: finalValue,
        fundTypeILP: finalValue !== 'Investment-Linked' ? '' : prev.fundTypeILP
      }));

      // Check for duplicate product types
      const duplicate = existingPolicies.some(p => 
        (p.productType === finalValue || p.policyName === finalValue)
      );
      setReminder(duplicate ? `⚠️ Another ${finalValue} policy already exists for this client.` : '');
    } else {
      setFormData(prev => ({ ...prev, [name]: finalValue }));
    }

    // Clear field errors when user starts typing
    setFieldErrors(prev => ({ ...prev, [name]: '' }));
  };

  const adjustNumber = (field, increment) => {
    const currentValue = Number(formData[field]) || 0;
    const newValue = Math.max(0, currentValue + increment);
    setFormData(prev => ({ ...prev, [field]: newValue }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Required field validations
    if (!formData.productType) newErrors.productType = 'Policy type is required.';
    if (!formData.coverageAmount || parseFloat(formData.coverageAmount) <= 0) {
      newErrors.coverageAmount = 'Coverage amount must be a positive number.';
    }
    if (!formData.premium || parseFloat(formData.premium) <= 0) {
      newErrors.premium = 'Premium amount must be a positive number.';
    }
    if (!formData.provider) newErrors.provider = 'Provider is required.';
    if (!formData.premiumFrequency) newErrors.premiumFrequency = 'Premium frequency is required.';
    if (!formData.startDate) newErrors.startDate = 'Start date is required.';
    if (!formData.endDate) newErrors.endDate = 'End date is required.';
    if (!formData.status) newErrors.status = 'Status is required.';
    
    // Recommended field validation - REQUIRED
    if (formData.recommended === null || formData.recommended === undefined) {
      newErrors.recommended = 'Recommended selection is required.';
    }

    // Date validation
    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        newErrors.endDate = 'End date must be after start date.';
      }
    }

    // Investment-Linked specific validation
    if (formData.productType === 'Investment-Linked' && !formData.fundTypeILP) {
      newErrors.fundTypeILP = 'Fund type is required for Investment-Linked policies.';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  console.log('🔍 DEBUG selectedClient:', selectedClient);
  console.log('🔍 DEBUG advisorId:', selectedClient?.advisorId);

  const errors = validateForm();
  if (Object.keys(errors).length > 0) {
    setFieldErrors(errors);
    return;
  }

  // ✅ FIXED: Send both policyName AND productType since both are required in your model
  const payload = {
    clientId: formData.clientId.toUpperCase(),
    policyId: formData.policyId,
    fullName: selectedClient?.fullName || 'Unknown Client',
    policyName: formData.productType,  // ✅ Required field
    productType: formData.productType, // ✅ Also required field  
    policyTypeId: policyTypeMap[formData.productType],
    fundTypeILP: formData.productType === 'Investment-Linked' ? formData.fundTypeILP : '',
    coverageAmount: parseFloat(formData.coverageAmount),
    premium: parseFloat(formData.premium),
    provider: formData.provider,
    premiumFrequency: formData.premiumFrequency,
    startDate: formData.startDate,
    endDate: formData.endDate,
    status: formData.status === 'Expiring Soon' ? 'Active' : formData.status,
    recommended: formData.recommended,
    notes: formData.notes.trim(),
    advisorId: (selectedClient?.advisorId && selectedClient.advisorId !== null) ? selectedClient.advisorId : 1
  };

  console.log('Sending payload:', payload);

  try {
    const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/policies`, payload);
    console.log('Response:', response.data);
    onAddSuccess();
    onClose();
  } catch (err) {
    console.error('Full error:', err);
    console.error('Error response:', err.response?.data);
    alert("Failed to add policy because the name of the policy already exists ");
  }
};

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-container">
        <div className="modal-header">
          <h2>Add New Policy</h2>
          <button className="modal-close" onClick={onClose}>✖</button>
        </div>
        
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              {/* Client ID */}
              <div className="form-field">
                <label className="field-label">
                  Client ID <span className="auto-generated">(auto-generated)</span>
                </label>
                <input 
                  name="clientId" 
                  value={formData.clientId} 
                  readOnly 
                  className="field-input readonly" 
                />
              </div>

              <div className="form-field">
                <label className="field-label">
                  Policy Type <span className="required">*</span>
                </label>
                <select
                  name="productType"
                  value={formData.productType}
                  onChange={handleChange}
                  className={`field-input ${fieldErrors.productType ? 'error' : ''}`}
                >
                  <option value="">Select Policy Type</option>
                  {productTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {fieldErrors.productType && <div className="field-error">{fieldErrors.productType}</div>}
                {reminder && (
                  <div className="status-box error">
                    <div>{reminder}</div>
                  </div>
                )}
              </div>

              {/* Policy ID */}
              <div className="form-field">
                <label className="field-label">
                  Policy ID <span className="auto-generated">(auto-generated)</span>
                </label>
                <input 
                  name="policyId" 
                  value={formData.policyId} 
                  readOnly 
                  placeholder="Select policy type first" 
                  className="field-input readonly" 
                />
              </div>

              {/* Fund Type ILP - only for Investment-Linked */}
              {formData.productType === 'Investment-Linked' && (
                <div className="form-field">
                  <label className="field-label">
                    Fund Type ILP <span className="required">*</span>
                  </label>
                  <select
                    name="fundTypeILP"
                    value={formData.fundTypeILP}
                    onChange={handleChange}
                    className={`field-input ${fieldErrors.fundTypeILP ? 'error' : ''}`}
                  >
                    <option value="">Select Fund Type</option>
                    {fundTypes.map(ft => (
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
                    name="coverageAmount"
                    value={formData.coverageAmount}
                    onChange={handleChange}
                    className={`field-input stepper-input ${fieldErrors.coverageAmount ? 'error' : ''}`}
                    step="1000"
                    min="0"
                    placeholder="0"
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
                    name="premium"
                    value={formData.premium}
                    onChange={handleChange}
                    className={`field-input stepper-input ${fieldErrors.premium ? 'error' : ''}`}
                    step="100"
                    min="0"
                    placeholder="0"
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

              {/* Provider */}
              <div className="form-field">
                <label className="field-label">
                  Provider <span className="required">*</span>
                </label>
                <select
                  name="provider"
                  value={formData.provider}
                  onChange={handleChange}
                  className={`field-input ${fieldErrors.provider ? 'error' : ''}`}
                >
                  <option value="">Select Provider</option>
                  {providers.map(provider => (
                    <option key={provider} value={provider}>{provider}</option>
                  ))}
                </select>
                {fieldErrors.provider && <div className="field-error">{fieldErrors.provider}</div>}
              </div>

              {/* Premium Frequency */}
              <div className="form-field">
                <label className="field-label">
                  Premium Frequency <span className="required">*</span>
                </label>
                <select
                  name="premiumFrequency"
                  value={formData.premiumFrequency}
                  onChange={handleChange}
                  className={`field-input ${fieldErrors.premiumFrequency ? 'error' : ''}`}
                >
                  <option value="">Select Premium Frequency</option>
                  {premiumFrequencies.map(freq => (
                    <option key={freq} value={freq}>{freq}</option>
                  ))}
                </select>
                {fieldErrors.premiumFrequency && <div className="field-error">{fieldErrors.premiumFrequency}</div>}
              </div>

              {/* Start Date */}
              <div className="form-field">
                <label className="field-label">
                  Start Date <span className="required">*</span>
                </label>
                <input
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange}
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
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleChange}
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
                  name="status" 
                  value={formData.status} 
                  readOnly 
                  className="field-input readonly" 
                  style={{
                    color: formData.status === 'Expired' ? '#dc3545' : 
                           formData.status === 'Expiring Soon' ? '#ffc107' : '#28a745',
                    fontWeight: 'bold'
                  }}
                />
              </div>

              {/* Recommended Checkbox - REQUIRED */}
              <div className="form-field full-width">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="recommended"
                    checked={formData.recommended}
                    onChange={handleChange}
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
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="field-input"
                  rows="3"
                  placeholder="Additional notes about this policy..."
                />
              </div>
            </div>
          </form>
        </div>

        <div className="modal-actions">
          <div className="action-group">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" onClick={handleSubmit}>
              Add Policy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddPolicyModal;