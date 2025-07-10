import React, { useState, useEffect } from 'react';
import './AddEditRowModal.css';
import { validateFormInline } from '../utils/ImportCRUDValidation';
import { generateNewClientIdSmart } from '../utils/dataCleanerClient';

function AddRowModal({ onAdd, onClose, productTypeMap, generateNoteAI, usedIds, clientDb = [] }) {
  const [formData, setFormData] = useState({
    full_name: '',
    client_id: '',
    email: '',
    phone: '',
    nric: '',
    product_type: '',
    policy_type_id: '',
    fund_type: '',
    start_date: '',
    end_date: '',
    premium_amount: 0,
    premium_frequency: '',
    status: '',
    note: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Auto status
  useEffect(() => {
    const parseDate = (dateStr) => {
      const parts = dateStr?.split(/[-/]/);
      if (!parts || parts.length !== 3) return null;
      if (parts[0].length === 4) return new Date(dateStr);
      const [day, month, year] = parts;
      return new Date(`${year}-${month}-${day}`);
    };
    const endDate = parseDate(formData.end_date);
    const isActive = endDate && endDate > new Date();
    setFormData(prev => ({ ...prev, status: isActive ? 'Active' : 'Expired' }));
  }, [formData.end_date]);

  // Auto policy type ID
  useEffect(() => {
    if (!formData.policy_type_id && formData.product_type && productTypeMap[formData.product_type]) {
      setFormData(prev => ({
        ...prev,
        policy_type_id: productTypeMap[formData.product_type]
      }));
    }
  }, [formData.product_type, formData.policy_type_id, productTypeMap]);

  // Auto assign client ID
  useEffect(() => {
    const cleanNRIC = (val) => (val || '').trim().toUpperCase();
    const nric = cleanNRIC(formData.nric);

    if (!nric) return;

    const dbMatch = clientDb.find(client => cleanNRIC(client.nric) === nric);
    const isClientIdAlreadySet = !!formData.client_id;

    const fullUsedSet = new Set([
      ...usedIds,
      ...clientDb.map(c => c.client_id || c.clientId)
    ]);

    if (dbMatch) {
      const dbClientId = dbMatch.client_id || dbMatch.clientId;
      if (!isClientIdAlreadySet || formData.client_id !== dbClientId) {
        setFormData(prev => ({ ...prev, client_id: dbClientId }));
      }
    } else if (!isClientIdAlreadySet) {
      const newId = generateNewClientIdSmart(fullUsedSet);
      setFormData(prev => ({ ...prev, client_id: newId }));
    }
  }, [formData.nric, formData.client_id, usedIds, clientDb]);

  const handleChange = (key, value) => {
    setFormData(prev => {
      const updated = { ...prev, [key]: value };
      setFieldErrors(validateFormInline(updated));
      return updated;
    });
    setTouchedFields(prev => ({ ...prev, [key]: true }));
  };

  const handleAdd = () => {
    setFormSubmitted(true);
    const inlineErrors = validateFormInline(formData);
    setFieldErrors(inlineErrors);
    if (Object.keys(inlineErrors).length > 0) return;
    onAdd(formData);
    onClose();
  };

  const showError = (key) => {
    return (touchedFields[key] || formSubmitted) && fieldErrors[key];
  };

  return (
    <div className="modal-overlay">
      <div className="edit-modal-card">
        <div className="modal-header">
          <h2>Add New Row</h2>
          <button className="close-button" onClick={onClose}>✖</button>
        </div>

        <div className="modal-field">
          <label>Client Name</label>
          <input
            type="text"
            className={showError('full_name') ? 'input-error' : ''}
            value={formData.full_name}
            onChange={(e) => handleChange('full_name', e.target.value)}
          />
          {showError('full_name') && <div className="field-error">{fieldErrors.full_name}</div>}
        </div>

        <div className="modal-field">
          <label>Client ID</label>
          <input type="text" value={formData.client_id} disabled />
        </div>

        <div className="modal-field">
          <label>Email</label>
          <input
            type="email"
            className={showError('email') ? 'input-error' : ''}
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
          />
          {showError('email') && <div className="field-error">{fieldErrors.email}</div>}
        </div>

        <div className="modal-field">
          <label>Phone</label>
          <input
            type="text"
            className={showError('phone') ? 'input-error' : ''}
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
          />
          {showError('phone') && <div className="field-error">{fieldErrors.phone}</div>}
        </div>

        <div className="modal-field">
          <label>NRIC</label>
          <input
            type="text"
            className={showError('nric') ? 'input-error' : ''}
            value={formData.nric}
            onChange={(e) => handleChange('nric', e.target.value)}
          />
          {showError('nric') && <div className="field-error">{fieldErrors.nric}</div>}
        </div>

        <div className="modal-field">
          <label>Product Type</label>
          <select
            className={showError('product_type') ? 'input-error' : ''}
            value={formData.product_type}
            onChange={(e) => handleChange('product_type', e.target.value)}
          >
            <option value="">-- Select Product Type --</option>
            {Object.keys(productTypeMap).map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          {showError('product_type') && <div className="field-error">{fieldErrors.product_type}</div>}
        </div>

        {formData.product_type === 'Investment-Linked' && (
          <div className="modal-field">
            <label>Fund Type</label>
            <select
              className={showError('fund_type') ? 'input-error' : ''}
              value={formData.fund_type}
              onChange={(e) => handleChange('fund_type', e.target.value)}
            >
              <option value="">-- Select Fund Type for ILP--</option>
              <option value="Balance">Balance</option>
              <option value="Growth">Growth</option>
              <option value="Income">Income</option>
              <option value="Aggressive">Aggressive</option>
              <option value="Conservative">Conservative</option>
            </select>
            {showError('fund_type') && <div className="field-error">{fieldErrors.fund_type}</div>}
          </div>
        )}

        <div className="modal-field">
          <label>Policy Type ID</label>
          <input type="text" value={formData.policy_type_id} disabled />
        </div>

        <div className="modal-field">
          <label>Start Date</label>
          <input
            type="date"
            className={showError('start_date') ? 'input-error' : ''}
            value={formData.start_date}
            onChange={(e) => handleChange('start_date', e.target.value)}
          />
          {showError('start_date') && <div className="field-error">{fieldErrors.start_date}</div>}
        </div>

        <div className="modal-field">
          <label>End Date</label>
          <input
            type="date"
            className={showError('end_date') ? 'input-error' : ''}
            value={formData.end_date}
            onChange={(e) => handleChange('end_date', e.target.value)}
          />
          {showError('end_date') && <div className="field-error">{fieldErrors.end_date}</div>}
        </div>

        <div className="modal-field">
  <label>Premium Amount</label>
  <div style={{ display: 'flex', alignItems: 'center' }}>
    <button onClick={() => setFormData(prev => ({ ...prev, premium_amount: Math.max(Number(prev.premium_amount) - 100, 0) }))}>−</button>
    <input
      type="number"
      readOnly
      value={formData.premium_amount}
      className={showError('premium_amount') ? 'input-error' : ''}
      style={{ width: '100px', margin: '0 10px', textAlign: 'center' }}
    />
    <button onClick={() => setFormData(prev => ({ ...prev, premium_amount: Number(prev.premium_amount) + 100 }))}>+</button>
  </div>
  {showError('premium_amount') && <div className="field-error">{fieldErrors.premium_amount}</div>}
</div>


<div className="modal-field">
  <label>Premium Frequency</label>
  <select
    value={formData.premium_frequency}
    onChange={(e) => handleChange('premium_frequency', e.target.value)}
    className={showError('premium_frequency') ? 'input-error' : ''}
  >
    <option value="">-- Select Frequency --</option>
    <option value="Annually">Annually</option>
    <option value="Semi-Annually">Semi-Annually</option>
    <option value="Quarterly">Quarterly</option>
    <option value="Monthly">Monthly</option>
    <option value="One-time">One-time</option>
  </select>
  {showError('premium_frequency') && <div className="field-error">{fieldErrors.premium_frequency}</div>}
</div>

        <div className="modal-field">
          <label>Status</label>
          <input type="text" value={formData.status} disabled />
        </div>

        <div className="modal-buttons">
          <button className="save-button" onClick={handleAdd}>Add</button>
          <button className="cancel-button" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default AddRowModal;
