import React, { useState } from 'react';
import axios from 'axios';
import './EditPolicyModal.css';

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

function EditPolicyModal({ policies, onClose, onUpdateSuccess }) {
  const [editedPolicies, setEditedPolicies] = useState([...policies]);
  const [triggerValidation, setTriggerValidation] = useState(false);

  const handleFieldChange = (index, field, value) => {
    const updated = [...editedPolicies];
    updated[index][field] = value;

    if (field === 'productType') {
      updated[index]['policyTypeId'] = policyTypeMap[value] || '';
      if (value !== 'Investment-Linked') {
        updated[index]['fundTypeILP'] = '';
      }
    }

    setEditedPolicies(updated);
  };

  const handleUpdate = async (policyId, updatedPolicy) => {
    const today = new Date().toISOString().slice(0, 10);
    const endDate = updatedPolicy.endDate?.slice(0, 10);
    const autoStatus = endDate >= today ? 'Active' : 'Expired';

    if (updatedPolicy.productType === 'Investment-Linked' && !updatedPolicy.fundTypeILP) {
      setTriggerValidation(true);
      return;
    }

    try {
      await axios.put(`http://localhost:5050/api/policies/${policyId}`, {
        ...updatedPolicy,
        status: autoStatus,
      });
      onUpdateSuccess();
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const handleDelete = async (policyId) => {
    try {
      await axios.delete(`http://localhost:5050/api/policies/${policyId}`);
      onUpdateSuccess();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Edit Policies</h2>
          <button className="close-button" onClick={onClose}>✖</button>
        </div>
        {editedPolicies.sort((a, b) => a.policyId.localeCompare(b.policyId)).map((policy, index) => {
          const today = new Date().toISOString().slice(0, 10);
          const autoStatus = policy.endDate?.slice(0, 10) >= today ? 'Active' : 'Expired';
          const currentType = policy.productType;
          const similarPolicies = policies.filter((p) =>
            p._id !== policy._id &&
            p.clientId === policy.clientId &&
            p.productType === currentType
          );

          return (
            <div key={policy._id} className="policy-edit-card">
              <label className="field-label">Policy ID</label>
              <input className="bold" value={policy.policyId} onChange={(e) => handleFieldChange(index, 'policyId', e.target.value)} />

              <label className="field-label">Product Type</label>
              <select value={policy.productType || ''} onChange={(e) => handleFieldChange(index, 'productType', e.target.value)}>
                <option value="">-- Select --</option>
                {Object.keys(policyTypeMap).map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              {similarPolicies.length > 0 && (
                <div className="warning-banner">⚠️ Another {currentType} policy already exists. Please ensure this is intended.</div>
              )}

              <label className="field-label">Policy Type ID</label>
              <input value={policy.policyTypeId || ''} readOnly placeholder="Policy Type ID" />

              <label className="field-label">Coverage Amount</label>
              <input type="number" value={policy.coverageAmount || ''} onChange={(e) => handleFieldChange(index, 'coverageAmount', e.target.value)} />

              <label className="field-label">Premium Frequency</label>
              <select value={policy.premiumFrequency || ''} onChange={(e) => handleFieldChange(index, 'premiumFrequency', e.target.value)}>
                <option value="">-- Select --</option>
                {premiumFrequencies.map((freq) => (
                  <option key={freq} value={freq}>{freq}</option>
                ))}
              </select>

              {policy.productType === 'Investment-Linked' && (
                <>
                  <label className="field-label">Fund Type for ILP</label>
                  <select value={policy.fundTypeILP || ''} onChange={(e) => handleFieldChange(index, 'fundTypeILP', e.target.value)}>
                    <option value="">-- Select --</option>
                    {fundTypes.map((ft) => (
                      <option key={ft} value={ft}>{ft}</option>
                    ))}
                  </select>
                  {triggerValidation && !policy.fundTypeILP && (
                    <div className="warning-banner">⚠️ Fund Type is required for Investment-Linked policies.</div>
                  )}
                </>
              )}

              <label className="field-label">Start Date</label>
              <input type="date" value={policy.startDate?.slice(0, 10) || ''} onChange={(e) => handleFieldChange(index, 'startDate', e.target.value)} />

              <label className="field-label">Expiry Date</label>
              <input type="date" value={policy.endDate?.slice(0, 10) || ''} onChange={(e) => {
                const newEndDate = e.target.value;
                const newStatus = newEndDate >= today ? 'Active' : 'Expired';
                const updated = [...editedPolicies];
                updated[index]['endDate'] = newEndDate;
                updated[index]['status'] = newStatus;
                setEditedPolicies(updated);
              }} />

              <p className="status-label">
                Status: <strong className={autoStatus === 'Active' ? 'green-status' : 'red-status'}>
                  {autoStatus}
                </strong>
              </p>
              <div className="policy-buttons">
                <button className="save-button" onClick={() => handleUpdate(policy._id, { ...policy, status: autoStatus })}>
                  Save
                </button>
                <button className="delete-button" onClick={() => handleDelete(policy._id)}>
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default EditPolicyModal;
