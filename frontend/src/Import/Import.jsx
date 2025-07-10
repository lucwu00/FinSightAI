import React, { useState } from 'react';
import axios from 'axios';
import Layout from '../Layout/Layout';
import PreviewTable from './PreviewTable';
import {
  generateNoteAI,
  autoMapPolicyType,
  deriveStatus,
  generateNewClientIdSmart,
} from '../utils/dataCleanerClient';
import './Import.css';
import productTypeMap from './productTypeMap';
import { useNavigate } from 'react-router-dom';

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

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    const fileExt = selectedFile.name.split('.').pop().toLowerCase();
    const allowedTypes = ['xls', 'xlsx'];
    if (!allowedTypes.includes(fileExt)) {
      setError(`Unsupported file format: .${fileExt}. Only .xls or .xlsx files are supported.`);
      setFile(null);
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await axios.post('http://localhost:5050/api/import/parse-headers', formData);
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
      const uploadRes = await axios.post('http://localhost:5050/api/import/upload', uploadForm);
      setUploadedFileName(uploadRes.data.fileName);

      const dbRes = await axios.get('http://localhost:5050/api/clients');
      setClientDb(dbRes.data);

      setProgress(100);
    } catch (err) {
      setError('Failed to process the file. Check the file content and columns again');
    }
  };

  const sendHeadersToGenAI = async (headers) => {
    try {
      const res = await axios.post('http://localhost:5050/api/import/map-headers', { headers });
      return res.data;
    } catch (err) {
      console.error('Mapping failed', err);
      return null;
    }
  };

  const handlePreview = async (fileName) => {
    try {
      const res = await axios.post('http://localhost:5050/api/import/preview-data', {
        fileName,
        mappedFields: selectedMappings
      });

      const rows = res.data.rows || [];
      setCleanData(rows);
      setWarnings(res.data.warnings || []);
    } catch (err) {
      console.error('Preview failed:', err.response?.data || err.message);
      setError('Server error: Failed to enrich data');
    }
  };

  const handleApproveImport = async () => {
    try {
      await axios.post('http://localhost:5050/api/import/approve-import', {
        clients: [],
        policies: cleanData
      });

      const user = 'Cheryl Lim';
      const importDateTime = new Date().toLocaleString();

      navigate('/import/success', {
        state: {
          importedRows: cleanData,
          importWarnings: warnings,
          user,
          importDateTime
        }
      });

    } catch (error) {
      console.error('Import failed:', error);
      setError('Failed to import data');
    }
  };

  const handleDownloadReport = async () => {
    try {
      const response = await axios.post(
        'http://localhost:5050/api/import/export-report',
        { rows: importedRows, warnings: importWarnings },
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'import-report.csv');
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const handleEditCell = (rowIndex, field, value) => {
    const updated = [...cleanData];
    updated[rowIndex][field] = value;
    updated[rowIndex].note = generateNoteAI(updated[rowIndex], cleanData.map(r => r.clientId));
    setCleanData(updated);
  };

  const handleDeleteRow = (index) => {
    const updated = cleanData.filter((_, i) => i !== index);
    setCleanData(updated);
  };

  const handleAddRow = () => {
    const emptyRow = Object.keys(cleanData[0] || {}).reduce((acc, key) => {
      acc[key] = '';
      return acc;
    }, {});
    setCleanData([...cleanData, emptyRow]);
  };

  const usedIds = [
    ...new Set([
      ...(Array.isArray(cleanData) ? cleanData.map(r => r.clientId) : []),
      ...(clientDb.map(c => c.client_id))
    ])
  ];

  return (
    <Layout>
      <div className="import-container centered">
        {!file && (
          <div className="upload-section-wrapper">
            <h1 className="upload-title">Upload Client Portfolio Excel</h1>
            <div className="upload-section">
              <label className="upload-box">
                <input type="file" onChange={handleFileChange} hidden />
                <div>⬆️ Click to upload</div>
              </label>
              <div
                className="upload-box only-drop"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const droppedFile = e.dataTransfer.files[0];
                  handleFileChange({ target: { files: [droppedFile] } });
                }}
              >
                📦 Drop Excel File here
                <p style={{ fontSize: '12px', color: 'gray' }}>(Clicking not allowed)</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="error-box">
            <h3>Error</h3>
            <p>{error}</p>
            <button onClick={() => setError('')}>Try again</button>
          </div>
        )}

        {mappedFields && !cleanData && (
          <div className="mapping-table" style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.75rem' }}>Map Columns to System Fields</h2>
            <table style={{ margin: 'auto' }}>
              <thead><tr><th>Excel Header</th><th>Suggested Field</th></tr></thead>
              <tbody>
                {Object.entries(mappedFields).map(([excelHeader, { suggested, confidence }]) => (
                  <tr key={excelHeader}>
                    <td>{excelHeader}</td>
                    <td>
                      <select
                        defaultValue={suggested || ''}
                        style={{ border: confidence < 0.7 ? '1px solid red' : undefined }}
                        onChange={(e) => {
                          const updated = { ...mappedFields };
                          updated[excelHeader] = {
                            ...updated[excelHeader],
                            suggested: e.target.value,
                            manuallyCorrected: true
                          };
                          setMappedFields(updated);
                        }}
                      >
                        <option value="">-- Select Field --</option>
                        {availableFields.map((field) => (
                          <option key={field} value={field}>{field}</option>
                        ))}
                      </select>
                      {confidence < 0.7 && (
                        <small style={{ color: 'red', display: 'block' }}>⚠️ Needs manual mapping</small>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8rem', marginTop: '2rem' }}>
              <button className="next-button" onClick={() => handlePreview(uploadedFileName)}>Next</button>
              <div className="sparkle-placeholder"></div>
            </div>
          </div>
        )}

        {cleanData && (
          <PreviewTable
            previewData={cleanData}
            warnings={warnings}
            usedIds={usedIds}
            clientDb={clientDb}
            onEditCell={handleEditCell}
            onDeleteRow={handleDeleteRow}
            onAddRow={handleAddRow}
            onApprove={handleApproveImport}
            setCleanData={setCleanData}
          />
        )}

        {importComplete && (
          <div className="summary-box">
            <h3>Import Complete ✔️</h3>
            <p>{importedRows.length} records imported successfully.</p>
            <button onClick={handleDownloadReport}>Download Import Report</button>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Import;