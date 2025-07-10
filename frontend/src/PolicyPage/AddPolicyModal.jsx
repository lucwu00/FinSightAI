// src/components/AddPolicyModal.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AddPolicyModal.css';

function AddPolicyModal({ onClose, onAddSuccess, clientId, existingPolicies }) {
  const [formData, setFormData] = useState({
    policyId: '',
    productType: '',
    coverageAmount: '',
    startDate: '',
    endDate: '',
    policyTypeId: '',
    premiumFrequency: '',
    fundTypeILP: ''
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [reminder, setReminder] = useState('');

  const policyTypeMap = {
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

  const premiumFrequencies = ["Monthly", "Quarterly", "Semi-Annually", "Annually", "One-time"];
  const fundTypes = ["Balanced", "Growth", "Income", "Aggressive", "Conservative"];

  const productTypes = Object.keys(policyTypeMap);

  useEffect(() => {
    if (existingPolicies && existingPolicies.length > 0) {
      const usedNumbers = new Set(
        existingPolicies
          .map(p => parseInt(p.policyId.split('-P')[1]))
          .filter(n => !isNaN(n))
      );
  
      // Find the lowest unused number
      let nextNumber = 1;
      while (usedNumbers.has(nextNumber)) {
        nextNumber++;
      }
  
      const nextId = `${clientId.toUpperCase()}-P${String(nextNumber).padStart(2, '0')}`;
      setFormData(prev => ({ ...prev, policyId: nextId }));
    }
  }, [clientId, existingPolicies]);  

  const handleChange = (e) => {
    const { name, value } = e.target;
    const trimmedValue = value.trim();

    if (name === 'productType') {
      const policyTypeId = policyTypeMap[trimmedValue] || '';
      setFormData(prev => ({
        ...prev,
        productType: trimmedValue,
        policyTypeId,
        fundTypeILP: ''
      }));

      const duplicate = existingPolicies.some(p => p.productType === trimmedValue);
      setReminder(duplicate ? `⚠️ Another ${trimmedValue} policy already exists. Please ensure this is intended.` : '');
    } else {
      setFormData(prev => ({ ...prev, [name]: trimmedValue }));
    }

    setFieldErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!formData.productType) newErrors.productType = 'Product type is required.';
    if (!formData.coverageAmount || parseFloat(formData.coverageAmount) <= 0) {
      newErrors.coverageAmount = 'Coverage amount must be a positive number.';
    }
    if (!formData.startDate) newErrors.startDate = 'Start date is required.';
    if (!formData.endDate) newErrors.endDate = 'End date is required.';
    else if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date.';
    }
    if (!formData.premiumFrequency) newErrors.premiumFrequency = 'Premium frequency is required.';
    if (formData.productType === 'Investment-Linked' && !formData.fundTypeILP) {
      newErrors.fundTypeILP = 'Fund type is required for Investment-Linked policies.';
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    const status = new Date(formData.endDate) > new Date() ? 'Active' : 'Expired';
    const payload = {
      clientId: clientId.toUpperCase(),
      policyId: formData.policyId,
      productType: formData.productType,
      policyTypeId: formData.policyTypeId,
      coverageAmount: parseFloat(formData.coverageAmount),
      startDate: formData.startDate,
      endDate: formData.endDate,
      status,
      premiumFrequency: formData.premiumFrequency,
      fundTypeILP: formData.productType === 'Investment-Linked' ? formData.fundTypeILP : '',
    };

    try {
      await axios.post('http://localhost:5050/api/policies', payload);
      onAddSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to add policy: " + (err?.response?.data?.error || err.message));
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 style={{ color: 'green' }}>Add New Policy</h2>
        <form onSubmit={handleSubmit} className="form-row">
          <div className="field-column">
            <input name="policyId" value={formData.policyId} readOnly className="bold-input" />
          </div>

          <div className="field-column">
            <select
              name="productType"
              value={formData.productType}
              onChange={handleChange}
              className={fieldErrors.productType ? 'invalid' : ''}
            >
              <option value="">Select Product Type</option>
              {productTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {fieldErrors.productType && <div className="field-error">{fieldErrors.productType}</div>}
            {reminder && <div className="soft-warning">{reminder}</div>}
          </div>

          <div className="field-column">
            <input name="policyTypeId" value={formData.policyTypeId} readOnly placeholder="Policy Type ID" className="bold-input" />
          </div>

          {formData.productType === 'Investment-Linked' && (
            <div className="field-column">
              <select
                name="fundTypeILP"
                value={formData.fundTypeILP}
                onChange={handleChange}
                className={fieldErrors.fundTypeILP ? 'invalid' : ''}
              >
                <option value="">-- Select Fund Type --</option>
                {fundTypes.map(ft => (
                  <option key={ft} value={ft}>{ft}</option>
                ))}
              </select>
              {fieldErrors.fundTypeILP && <div className="field-error">{fieldErrors.fundTypeILP}</div>}
            </div>
          )}

          <div className="field-column">
            <input
              name="coverageAmount"
              placeholder="$ Coverage Amount"
              type="number"
              value={formData.coverageAmount}
              onChange={handleChange}
              step="100"
              className={fieldErrors.coverageAmount ? 'invalid' : ''}
            />
            {fieldErrors.coverageAmount && <div className="field-error">{fieldErrors.coverageAmount}</div>}
          </div>

          <div className="field-column">
            <select
              name="premiumFrequency"
              value={formData.premiumFrequency}
              onChange={handleChange}
              className={fieldErrors.premiumFrequency ? 'invalid' : ''}
            >
              <option value="">Select Premium Frequency</option>
              {premiumFrequencies.map(freq => (
                <option key={freq} value={freq}>{freq}</option>
              ))}
            </select>
            {fieldErrors.premiumFrequency && <div className="field-error">{fieldErrors.premiumFrequency}</div>}
          </div>

          

          <div className="field-column">
            <input
              name="startDate"
              type="date"
              value={formData.startDate}
              onChange={handleChange}
              className={fieldErrors.startDate ? 'invalid' : ''}
            />
            {fieldErrors.startDate && <div className="field-error">{fieldErrors.startDate}</div>}
          </div>

          <div className="field-column">
            <input
              name="endDate"
              type="date"
              value={formData.endDate}
              onChange={handleChange}
              className={fieldErrors.endDate ? 'invalid' : ''}
            />
            {fieldErrors.endDate && <div className="field-error">{fieldErrors.endDate}</div>}
          </div>

          <div className="modal-actions-centered">
            <button type="submit" className="add-button">Add</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddPolicyModal;