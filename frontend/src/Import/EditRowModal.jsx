// src/Import/EditRowModal.jsx
import React, { useState, useEffect } from 'react';
import './AddEditRowModal.css';
import { validateFormInline } from '../utils/ImportCRUDValidation';

function EditRowModal({ rowData, onSave, onDelete, onClose, productTypeMap, generateNoteAI, usedIds }) {
  const [formData, setFormData] = useState(() => ({
    full_name: rowData.full_name || rowData.clientName || '',
    client_id: rowData.client_id || rowData.clientId || '',
    email: rowData.email || '',
    phone: rowData.phone || '',
    nric: rowData.nric || '',
    product_type: rowData.product_type || rowData.productType || '',
    policy_type_id: rowData.policy_type_id || rowData.policyTypeId || '',
    fund_type: rowData.fund_type || rowData.fundTypeILP || '',
    start_date: rowData.start_date || rowData.startDate || '',
    end_date: rowData.end_date || rowData.endDate || '',
    premium_amount: rowData.premium_amount || rowData.premiumAmount || '',
    premium_frequency: rowData.premium_frequency || rowData.premiumFrequency || '',
    status: '', 
    note: '',   
    rowIndex: rowData.rowIndex,
  }));  

  const [errorMessages, setErrorMessages] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      const parts = dateStr.split(/[-/]/);
      if (parts[0].length === 4) return new Date(dateStr);
      if (parts.length === 3) {
        const [day, month, year] = parts;
        return new Date(`${year}-${month}-${day}`);
      }
      return new Date(dateStr);
    };

    const endDate = parseDate(formData.end_date);
    const isActive = endDate && endDate > new Date();

    setFormData((prev) => ({
      ...prev,
      status: isActive ? 'Active' : 'Expired',
    }));
  }, [formData.end_date]);

  useEffect(() => {
    if (!formData.policy_type_id && formData.product_type && productTypeMap[formData.product_type]) {
      setFormData(prev => ({
        ...prev,
        policy_type_id: productTypeMap[formData.product_type]
      }));
    }
  }, [formData.product_type, formData.policy_type_id, productTypeMap]);



  useEffect(() => {
    const rawNote = generateNoteAI(formData, usedIds);
    const splitNotes = rawNote
      .split(/;\s*/)
      .map(n => n.trim())
      .filter(Boolean)
      .map(n => `• ${n}`)
      .join('\n');
    setFormData(prev => ({ ...prev, note: splitNotes }));
  }, [formData, generateNoteAI, usedIds]);
  
  
  const handleChange = (key, value) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        [key]: value,
        ...(key === 'product_type' && {
          policy_type_id: productTypeMap[value] || '',
          fund_type: value === 'Investment-Linked Plan' ? prev.fund_type : '',
        })
      };
      setFieldErrors(validateFormInline(updated));
      const rawNote = generateNoteAI(updated, usedIds);
const splitNote = rawNote
  .split(/;\s*/)
  .map(n => n.trim())
  .filter(Boolean)
  .map(n => `• ${n}`)
  .join('\n');
return { ...updated, note: splitNote };
    });
  };

  const handleSave = () => {
    const errors = validateFormInline(formData);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMessages(Object.values(errors));
      return;
    }

    const cleanData = {
      full_name: formData.full_name,
      client_id: formData.client_id,
      email: formData.email,
      phone: formData.phone,
      nric: formData.nric,
      product_type: formData.product_type,
      policy_type_id: formData.policy_type_id,
      fund_type: formData.fund_type,
      start_date: formData.start_date,
      end_date: formData.end_date,
      premium_amount: formData.premium_amount,
      premium_frequency: formData.premium_frequency,
      status: formData.status,
      note: formData.note,
      rowIndex: formData.rowIndex
    };
    onSave(cleanData, formData.rowIndex);    
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="edit-modal-card">
        <div className="modal-header">
          <h2>Edit Row</h2>
          <button className="close-button" onClick={onClose}>✖</button>
        </div>

        {errorMessages.length > 0 && (
          <div className="validation-errors">
            <ul>
              {errorMessages.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="modal-field">
          <label>Client Name</label>
          <input type="text" value={formData.full_name} disabled />
        </div>

        <div className="modal-field">
          <label>Client ID</label>
          <input type="text" value={formData.client_id} disabled />
        </div>

        <div className="modal-field">
          <label>Email</label>
          <input type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} />
          {fieldErrors.email && <div className="field-error">{fieldErrors.email}</div>}
        </div>

        <div className="modal-field">
          <label>Phone</label>
          <input type="text" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} />
          {fieldErrors.phone && <div className="field-error">{fieldErrors.phone}</div>}
        </div>

        <div className="modal-field">
          <label>NRIC</label>
          <input type="text" value={formData.nric} onChange={(e) => handleChange('nric', e.target.value)} />
          {fieldErrors.nric && <div className="field-error">{fieldErrors.nric}</div>}
        </div>

        <div className="modal-field">
          <label>Product Type</label>
          <select value={formData.product_type} onChange={(e) => handleChange('product_type', e.target.value)}>
            <option value="">-- Select Product Type --</option>
            {Object.keys(productTypeMap).map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          {fieldErrors.product_type && <div className="field-error">{fieldErrors.product_type}</div>}
        </div>

        {formData.product_type === 'Investment-Linked Plan' && (
          <div className="modal-field">
            <label>Fund Type</label>
            <select value={formData.fund_type} onChange={(e) => handleChange('fund_type', e.target.value)}>
              <option value="">-- Select Fund Type --</option>
              <option value="Balanced">Balanced</option>
              <option value="Growth">Growth</option>
              <option value="Income">Income</option>
              <option value="Aggressive">Aggressive</option>
              <option value="Conservative">Conservative</option>
            </select>
            {fieldErrors.fund_type && <div className="field-error">{fieldErrors.fund_type}</div>}
          </div>
        )}

        <div className="modal-field">
          <label>Policy Type ID</label>
          <input type="text" value={formData.policy_type_id} disabled />
        </div>

        <div className="modal-field">
          <label>Start Date</label>
          <input type="date" value={formData.start_date} onChange={(e) => handleChange('start_date', e.target.value)} />
        </div>

        <div className="modal-field">
          <label>End Date</label>
          <input type="date" value={formData.end_date} onChange={(e) => handleChange('end_date', e.target.value)} />
          {fieldErrors.date && <div className="field-error">{fieldErrors.date}</div>}
        </div>

        <div className="modal-field">
          <label>Premium Amount</label>
          <input type="number" value={formData.premium_amount} onChange={(e) => handleChange('premium_amount', e.target.value)} />
          {fieldErrors.premium_amount && <div className="field-error">{fieldErrors.premium_amount}</div>}
        </div>

        <div className="modal-field">
          <label>Premium Frequency</label>
          <select value={formData.premium_frequency} onChange={(e) => handleChange('premium_frequency', e.target.value)}>
            <option value="">-- Select Frequency --</option>
            <option value="Annually">Annually</option>
            <option value="Quarterly">Quarterly</option>
            <option value="Monthly">Monthly</option>
            <option value="One-time">One-time</option>
          </select>
        </div>

        <div className="modal-field">
          <label>Status</label>
          <input type="text" value={formData.status} disabled />
        </div>

        <div className="modal-field">
          <label>AI Validation Note</label>
          <textarea
  className="note-display"
  value={formData.note}
  readOnly
  rows={4}
  style={{
    backgroundColor: '#fffbe6',
    color: '#b26a00',
    whiteSpace: 'pre-line',
    fontFamily: 'inherit'
  }}
/>
        </div>

        <div className="modal-buttons">
          <button className="save-button" onClick={handleSave}>Save</button>
          <button
            className="delete-button"
            onClick={() => {
              onDelete(formData.rowIndex);
              onClose();
            }}
          >
            Delete
          </button>
          <button className="cancel-button" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default EditRowModal;
