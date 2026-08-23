import './Import.css';
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { logOnce } from '../utils/logOnce';
import PreviewTable from './PreviewTable';
import { generateNoteAI, autoMapPolicyType, deriveStatus, generateNewClientIdSmart } from '../utils/dataCleanerClient';
import productTypeMap from './productTypeMap';

function Import() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [mappedFields, setMappedFields] = useState(null);
  const [availableFields, setAvailableFields] = useState([]);
  const [cleanData, setCleanData] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [importedRows, setImportedRows] = useState([]);
  const [importWarnings, setImportWarnings] = useState([]);
  const [importComplete, setImportComplete] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [selectedMappings, setSelectedMappings] = useState({});
  const [clientDb, setClientDb] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    logOnce('import-mounted', '📦 Import page mounted');
  }, []);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    const fileExt = selectedFile.name.split('.').pop().toLowerCase();
    if (!['xls', 'xlsx'].includes(fileExt)) {
      setError(`Unsupported file format: .${fileExt}. Only .xls or .xlsx files are supported.`);
      setFile(null);
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/import/parse-headers`, formData);
      const headers = res.data.headers;
      const mappingRes = await sendHeadersToGenAI(headers);

      const initializedMap = {};
      for (const [key, value] of Object.entries(mappingRes.mappings)) {
        initializedMap[key] = { ...value, manuallyCorrected: false };
      }

      setMappedFields(initializedMap);
      setAvailableFields(mappingRes.availableFields);
      setFile(selectedFile);
      setSelectedMappings(initializedMap);

      const uploadForm = new FormData();
      uploadForm.append('file', selectedFile);
      const uploadRes = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/import/upload`, uploadForm);
      setUploadedFileName(uploadRes.data.fileName);

      const dbRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/clients`);
      setClientDb(dbRes.data.map(c => ({ ...c, clientId: c.clientId || c.client_id, fullName: c.fullName || c.full_name })));
      setProgress(100);
    } catch (err) {
      setError('Failed to process the file. Check the file content and columns again.');
    }
  };

  const sendHeadersToGenAI = async (headers) => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/import/map-headers`, { headers });
      return res.data;
    } catch (err) {
      console.error('Mapping failed', err);
      return null;
    }
  };

  const handlePreview = async (fileName) => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/import/preview`, {
        fileName,
        mappedFields: selectedMappings
      });
      const rows = res.data.rows || [];
      setCleanData(rows.map(r => ({
        ...r,
        clientId: r.clientId || r.client_id,
        fullName: r.fullName || r.full_name,
        policyName: r.policyName || r.productType || r.product_type,
        policyTypeId: r.policyTypeId || r.policy_type_id,
        fundTypeILP: r.fundTypeILP || r.fund_type,
        premium: r.premium || r.premiumAmount || r.premium_amount,
        premiumFrequency: r.premiumFrequency || r.premium_frequency,
        startDate: r.startDate || r.start_date,
        endDate: r.endDate || r.end_date,
      })));
      setWarnings(res.data.warnings || []);
    } catch (err) {
      setError('Server error: Failed to enrich data');
    }
  };

  const handleApproveImport = async () => {
    try {
      const formattedData = cleanData.map(row => ({
        clientId: row.clientId || '',
        fullName: row.fullName || '',
        nric: row.nric || '',
        email: row.email || `${row.clientId}@placeholder.com`,
        phone: row.phone || '+65 12345678',
        dob: row.dob || '1990-01-01',
        gender: row.gender || 'Male',
        maritalStatus: row.maritalStatus || 'Single',
        occupation: row.occupation || 'Professional',
        annualIncome: row.annualIncome || 50000,
        paymentFrequency: (row.paymentFrequency || 'monthly').toLowerCase(),
        riskProfile: row.riskProfile || 'Conservative',
        advisorId: row.advisorId || 1,
        policyId: row.policyId || `${row.clientId}-${row.policyTypeId}`,
        policyName: row.policyName || '',
        productType: row.productType || row.policyName || '',
        policyTypeId: row.policyTypeId || '',
        fundTypeILP: row.fundTypeILP || null,
        provider: row.provider || 'AIA',
        coverageAmount: Number(row.coverageAmount) || 100000,
        premium: Number(row.premium) || 0,
        premiumFrequency: row.premiumFrequency || 'Monthly',
        startDate: row.startDate || new Date().toISOString().split('T')[0],
        endDate: row.endDate || '2030-12-31',
        status: row.status || 'Active',
        recommended: row.recommended === 'Yes' || row.recommended === true || row.recommended === 'true',
        note: row.note || '',
        notes: row.note || ''
      }));

      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/import/import-approved-data`, {
        approvedData: formattedData
      });

      if (response.data && (response.data.success || response.status === 200)) {
        navigate('/import/success', {
          state: {
            importedRows: formattedData,
            importWarnings: response.data.results?.importWarnings || warnings,
            user: 'Admin',
            importDateTime: new Date().toLocaleString(),
            totalImported: formattedData.length,
            totalWarnings: response.data.results?.importWarnings?.length || 0,
            previewMode: response.data.previewMode || false
          }
        });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Unknown error';
      setError(`Import failed: ${errorMessage}`);
    }
  };

  // Count low-confidence mappings
  const lowConfidenceCount = mappedFields
    ? Object.values(mappedFields).filter(v => v.confidence < 0.7 && !v.manuallyCorrected).length
    : 0;

  const handleSetCleanData = useCallback((data) => {
  setCleanData(data);
}, []);

  return (
    <div className="import-page">

      {/* ── Upload section ── */}
      {!file && (
        <div className="import-hero-card">
          <h1 className="import-hero-title">Import Client Portfolio</h1>
          <p className="import-hero-subtitle">Upload an Excel file to import client and policy data</p>

          <div className="import-upload-zones">
            <label className="import-upload-zone">
              <input type="file" onChange={handleFileChange} hidden accept=".xls,.xlsx" />
              <span className="import-upload-icon">⬆️</span>
              <span className="import-upload-label">Click to upload</span>
              <span className="import-upload-hint">.xls or .xlsx only</span>
            </label>

            <div
              className="import-upload-zone drop-only"
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                handleFileChange({ target: { files: [e.dataTransfer.files[0]] } });
              }}
            >
              <span className="import-upload-icon">📦</span>
              <span className="import-upload-label">Drop file here</span>
              <span className="import-upload-hint">Drag and drop only</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Error box ── */}
      {error && (
        <div className="import-error-box">
          <h3>Upload Error</h3>
          <p>{error}</p>
          <button className="import-btn import-btn-primary" onClick={() => { setError(''); setFile(null); }}>
            Try Again
          </button>
        </div>
      )}

      {/* ── Column mapping ── */}
      {mappedFields && !cleanData && (
        <div className="import-content">
          <div className="import-step-header">
            <div className="import-step-number">2</div>
            <div>
              <p className="import-step-title">Map Columns</p>
              <p className="import-step-subtitle">
                AI has auto-mapped your Excel columns. Review and correct any uncertain matches.
                {lowConfidenceCount > 0 && (
                  <span style={{ color: '#dc2626', marginLeft: '0.5rem' }}>
                    ⚠️ {lowConfidenceCount} column{lowConfidenceCount > 1 ? 's need' : ' needs'} review
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="import-mapping-card">
            <table className="import-mapping-table">
              <thead>
                <tr>
                  <th>Excel Column</th>
                  <th>Maps To</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(mappedFields).map(([excelHeader, { suggested, confidence, manuallyCorrected }]) => (
                  <tr key={excelHeader}>
                    <td style={{ fontWeight: 500 }}>{excelHeader}</td>
                    <td>
                      <select
                        className={`import-field-select ${confidence < 0.7 && !manuallyCorrected ? 'needs-review' : ''}`}
                        defaultValue={suggested || ''}
                        onChange={e => {
                          const updated = { ...mappedFields };
                          updated[excelHeader] = { ...updated[excelHeader], suggested: e.target.value, manuallyCorrected: true };
                          setMappedFields(updated);
                          setSelectedMappings(updated);
                        }}
                      >
                        <option value="">— Not mapped —</option>
                        {availableFields.map(field => (
                          <option key={field} value={field}>{field.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {manuallyCorrected ? (
                        <span className="import-confidence high">✓ Manual</span>
                      ) : confidence >= 0.7 ? (
                        <span className="import-confidence high">✓ Auto-matched</span>
                      ) : (
                        <span className="import-confidence low">⚠ Needs review</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="import-action-bar">
              <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>
                {Object.keys(mappedFields).length} columns detected
              </span>
              <button
                className="import-btn import-btn-primary"
                onClick={() => handlePreview(uploadedFileName)}
              >
                Preview Data →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Preview table ── */}
      {cleanData && (
        <div className="import-content">
          <div className="import-step-header">
            <div className="import-step-number">3</div>
            <div>
              <p className="import-step-title">Review & Import</p>
              <p className="import-step-subtitle">Fix any errors before approving the import</p>
            </div>
          </div>

          <PreviewTable
            previewData={cleanData}
            warnings={warnings}
            usedIds={clientDb.map(c => c.clientId)}
            clientDb={clientDb}
            onEditCell={(rowIndex, field, value) => {
              const updated = [...cleanData];
              updated[rowIndex][field] = value;
              setCleanData(updated);
            }}
            onDeleteRow={index => setCleanData(cleanData.filter((_, i) => i !== index))}
            onAddRow={() => {}}
            onApprove={handleApproveImport}
            setCleanData={handleSetCleanData}
          />
        </div>
      )}

    </div>
  );
}

export default Import;