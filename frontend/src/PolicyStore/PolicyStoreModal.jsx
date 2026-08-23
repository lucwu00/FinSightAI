import React, { useState, useEffect } from 'react';
import './PolicyStoreModal.css';

const PolicyStoreModal = ({ policy, mode, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    detailedDescription: '',
    coverage: {
      deathBenefit: '',
      cashValue: '',
      premiums: ''
    },
    defaultCoverageAmount: 0,
    defaultPremium: 0,
    defaultFrequency: 'Annually',
    protections: [],
    legalTerms: [],
    eligibility: '',
    exclusions: ''
  });

  const [activeTab, setActiveTab] = useState('overview');
  const [errors, setErrors] = useState({});

const policyCategories = {
  LIFE: "Life Insurance",
  HEALTH: "Health Insurance", 
  PROPERTY: "Property Insurance",
  SPECIALTY: "Specialty Insurance"
};

const premiumFrequencies = ["Monthly", "Quarterly", "Semi-Annually", "Annually", "One-time"];

  useEffect(() => {
    if (policy && mode !== 'add') {
      setFormData({
        name: policy.name || '',
        category: policy.category || '',
        description: policy.description || '',
        detailedDescription: policy.detailedDescription || '',
        coverage: policy.coverage || {
          deathBenefit: '',
          cashValue: '',
          premiums: ''
        },
        defaultCoverageAmount: policy.defaultCoverageAmount || 0,
        defaultPremium: policy.defaultPremium || 0,
        defaultFrequency: policy.defaultFrequency || 'Annually',
        protections: policy.protections || [],
        legalTerms: policy.legalTerms || [],
        eligibility: policy.eligibility || '',
        exclusions: policy.exclusions || ''
      });
    }
  }, [policy, mode]);

  const handleChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleArrayChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Policy name is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.detailedDescription.trim()) newErrors.detailedDescription = 'Detailed description is required';
    if (formData.defaultCoverageAmount <= 0) newErrors.defaultCoverageAmount = 'Coverage amount must be greater than 0';
    if (formData.defaultPremium <= 0) newErrors.defaultPremium = 'Premium must be greater than 0';
    //if (formData.protections.length === 0) newErrors.protections = 'At least one protection must be specified';
    //if (formData.legalTerms.length === 0) newErrors.legalTerms = 'At least one legal term must be specified';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (mode === 'view') return;
    
    if (validateForm()) {
      onSave(formData);
    }
  };

  const isReadOnly = mode === 'view';
  const modalTitle = mode === 'add' ? 'Add New Policy' : 
                   mode === 'edit' ? `Edit Policy: ${policy?.name}` : 
                   `Policy Details: ${policy?.name}`;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="policy-modal-container">
        <div className="policy-modal-header">
          <h2>{modalTitle}</h2>
          <button className="close-btn" onClick={onClose}>✖</button>
        </div>

        <div className="policy-modal-tabs">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab-btn ${activeTab === 'coverage' ? 'active' : ''}`}
            onClick={() => setActiveTab('coverage')}
          >
            Coverage Details
          </button>
          <button 
            className={`tab-btn ${activeTab === 'protections' ? 'active' : ''}`}
            onClick={() => setActiveTab('protections')}
          >
            Protections
          </button>
          <button 
            className={`tab-btn ${activeTab === 'legal' ? 'active' : ''}`}
            onClick={() => setActiveTab('legal')}
          >
            Legal Terms
          </button>
          <button 
            className={`tab-btn ${activeTab === 'eligibility' ? 'active' : ''}`}
            onClick={() => setActiveTab('eligibility')}
          >
            Eligibility
          </button>
        </div>

        <div className="policy-modal-content">
          {activeTab === 'overview' && (
            <div className="tab-content">
              <div className="form-grid">
                <div className="form-field">
                  <label className="field-label">
                    Policy Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className={`field-input ${errors.name ? 'error' : ''}`}
                    readOnly={isReadOnly}
                    placeholder="Enter policy name"
                  />
                  {errors.name && <div className="field-error">{errors.name}</div>}
                </div>

                <div className="form-field">
                  <label className="field-label">
                    Category <span className="required">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className={`field-input ${errors.category ? 'error' : ''}`}
                    disabled={isReadOnly}
                  >
                    <option value="">Select Category</option>
                    {Object.values(policyCategories).map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  {errors.category && <div className="field-error">{errors.category}</div>}
                </div>

                <div className="form-field full-width">
                  <label className="field-label">
                    Short Description <span className="required">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    className={`field-input ${errors.description ? 'error' : ''}`}
                    readOnly={isReadOnly}
                    rows="3"
                    placeholder="Brief description of the policy"
                  />
                  {errors.description && <div className="field-error">{errors.description}</div>}
                </div>

                <div className="form-field full-width">
                  <label className="field-label">
                    Detailed Description <span className="required">*</span>
                  </label>
                  <textarea
                    value={formData.detailedDescription}
                    onChange={(e) => handleChange('detailedDescription', e.target.value)}
                    className={`field-input ${errors.detailedDescription ? 'error' : ''}`}
                    readOnly={isReadOnly}
                    rows="6"
                    placeholder="Comprehensive description including features and benefits"
                  />
                  {errors.detailedDescription && <div className="field-error">{errors.detailedDescription}</div>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'coverage' && (
            <div className="tab-content">
              <div className="form-grid">
                <div className="form-field">
                  <label className="field-label">
                    Default Coverage Amount <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.defaultCoverageAmount}
                    onChange={(e) => handleChange('defaultCoverageAmount', Number(e.target.value))}
                    className={`field-input ${errors.defaultCoverageAmount ? 'error' : ''}`}
                    readOnly={isReadOnly}
                    min="0"
                    step="1000"
                  />
                  {errors.defaultCoverageAmount && <div className="field-error">{errors.defaultCoverageAmount}</div>}
                </div>

                <div className="form-field">
                  <label className="field-label">
                    Default Premium <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.defaultPremium}
                    onChange={(e) => handleChange('defaultPremium', Number(e.target.value))}
                    className={`field-input ${errors.defaultPremium ? 'error' : ''}`}
                    readOnly={isReadOnly}
                    min="0"
                    step="100"
                  />
                  {errors.defaultPremium && <div className="field-error">{errors.defaultPremium}</div>}
                </div>

                <div className="form-field">
                  <label className="field-label">Default Frequency</label>
                  <select
                    value={formData.defaultFrequency}
                    onChange={(e) => handleChange('defaultFrequency', e.target.value)}
                    className="field-input"
                    disabled={isReadOnly}
                  >
                    {premiumFrequencies.map(freq => (
                      <option key={freq} value={freq}>{freq}</option>
                    ))}
                  </select>
                </div>

                <div className="form-section full-width">
                  <h3>Coverage Specifications</h3>
                  <div className="coverage-specs">
                    <div className="form-field">
                      <label className="field-label">Primary Benefit</label>
                      <input
                        type="text"
                        value={formData.coverage.deathBenefit || ''}
                        onChange={(e) => handleChange('coverage.deathBenefit', e.target.value)}
                        className="field-input"
                        readOnly={isReadOnly}
                        placeholder="e.g., Guaranteed death benefit"
                      />
                    </div>
                    <div className="form-field">
                      <label className="field-label">Secondary Benefit</label>
                      <input
                        type="text"
                        value={formData.coverage.cashValue || ''}
                        onChange={(e) => handleChange('coverage.cashValue', e.target.value)}
                        className="field-input"
                        readOnly={isReadOnly}
                        placeholder="e.g., Cash value accumulation"
                      />
                    </div>
                    <div className="form-field">
                      <label className="field-label">Premium Structure</label>
                      <input
                        type="text"
                        value={formData.coverage.premiums || ''}
                        onChange={(e) => handleChange('coverage.premiums', e.target.value)}
                        className="field-input"
                        readOnly={isReadOnly}
                        placeholder="e.g., Level premiums for life"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'protections' && (
            <div className="tab-content">
              <div className="array-section">
                <div className="section-header">
                  <h3>Policy Protections <span className="required">*</span></h3>
                  {!isReadOnly && (
                    <button 
                      type="button"
                      className="add-item-btn"
                      onClick={() => addArrayItem('protections')}
                    >
                      + Add Protection
                    </button>
                  )}
                </div>
                {errors.protections && <div className="field-error">{errors.protections}</div>}
                
                <div className="array-items">
                  {formData.protections.map((protection, index) => (
                    <div key={index} className="array-item">
                      <textarea
                        value={protection}
                        onChange={(e) => handleArrayChange('protections', index, e.target.value)}
                        className="field-input"
                        readOnly={isReadOnly}
                        rows="2"
                        placeholder="Describe what this policy protects against"
                      />
                      {!isReadOnly && (
                        <button
                          type="button"
                          className="remove-item-btn"
                          onClick={() => removeArrayItem('protections', index)}
                        >
                          ✖
                        </button>
                      )}
                    </div>
                  ))}
                  {formData.protections.length === 0 && (
                    <div className="empty-state">
                      No protections defined. {!isReadOnly && 'Click "Add Protection" to add the first one.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'legal' && (
            <div className="tab-content">
              <div className="array-section">
                <div className="section-header">
                  <h3>Legal Terms & Definitions <span className="required">*</span></h3>
                  {!isReadOnly && (
                    <button 
                      type="button"
                      className="add-item-btn"
                      onClick={() => addArrayItem('legalTerms')}
                    >
                      + Add Term
                    </button>
                  )}
                </div>
                {errors.legalTerms && <div className="field-error">{errors.legalTerms}</div>}
                
                <div className="array-items">
                  {formData.legalTerms.map((term, index) => (
                    <div key={index} className="array-item">
                      <textarea
                        value={term}
                        onChange={(e) => handleArrayChange('legalTerms', index, e.target.value)}
                        className="field-input"
                        readOnly={isReadOnly}
                        rows="2"
                        placeholder="Term: Definition (e.g., Death Benefit: The amount paid to beneficiaries)"
                      />
                      {!isReadOnly && (
                        <button
                          type="button"
                          className="remove-item-btn"
                          onClick={() => removeArrayItem('legalTerms', index)}
                        >
                          ✖
                        </button>
                      )}
                    </div>
                  ))}
                  {formData.legalTerms.length === 0 && (
                    <div className="empty-state">
                      No legal terms defined. {!isReadOnly && 'Click "Add Term" to add the first one.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'eligibility' && (
            <div className="tab-content">
              <div className="form-grid">
                <div className="form-field full-width">
                  <label className="field-label">Eligibility Requirements</label>
                  <textarea
                    value={formData.eligibility}
                    onChange={(e) => handleChange('eligibility', e.target.value)}
                    className="field-input"
                    readOnly={isReadOnly}
                    rows="4"
                    placeholder="Describe age limits, health requirements, and other eligibility criteria"
                  />
                </div>

                <div className="form-field full-width">
                  <label className="field-label">Exclusions</label>
                  <textarea
                    value={formData.exclusions}
                    onChange={(e) => handleChange('exclusions', e.target.value)}
                    className="field-input"
                    readOnly={isReadOnly}
                    rows="4"
                    placeholder="List what is not covered by this policy"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="policy-modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            {isReadOnly ? 'Close' : 'Cancel'}
          </button>
          {!isReadOnly && (
            <button className="btn btn-primary" onClick={handleSubmit}>
              {mode === 'add' ? 'Create Policy' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PolicyStoreModal;