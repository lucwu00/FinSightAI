import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../Import/Import.css';
import { FaDownload } from 'react-icons/fa';

function ImportSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isConfirming, setIsConfirming] = useState(false);

  const initialData = useMemo(() => {
    if (location.state) return location.state;
    try {
      const raw = sessionStorage.getItem('importResults');
      if (raw) return JSON.parse(raw);
    } catch {}
    return { importedRows: [], importWarnings: [], user: 'Admin', importDateTime: new Date().toLocaleString(), totalImported: 0, totalWarnings: 0, previewMode: false };
  }, [location.state]);

  const [importData, setImportData] = useState(initialData);

  useEffect(() => {
    if (location.state) {
      try { sessionStorage.setItem('importResults', JSON.stringify(location.state)); } catch {}
      setImportData(location.state);
    }
  }, [location.state]);

  const { importedRows = [], importWarnings = [], user = 'Admin', importDateTime = '', totalImported = 0, totalWarnings = 0, previewMode = false } = importData || {};

  const uniqueClientsCount = useMemo(() => {
    return new Set(importedRows.filter(r => r.clientId).map(r => r.clientId)).size;
  }, [importedRows]);

  const downloadReport = () => {
    const headers = ['clientId','fullName','nric','email','phone','policyName','policyTypeId','fundTypeILP','provider','coverageAmount','premium','premiumFrequency','startDate','endDate','status','recommended','note'];
    const labels = ['Client ID','Full Name','NRIC','Email','Phone','Policy Name','Policy Type ID','Fund Type','Provider','Coverage','Premium','Frequency','Start Date','End Date','Status','Recommended','Notes'];
    const meta = [['Imported By', user], ['Date', importDateTime], ['Total Rows', totalImported], ['Unique Clients', uniqueClientsCount], [], labels];
    const rows = importedRows.map(row => headers.map(h => {
      let v = row[h] ?? '';
      if (h === 'recommended') v = v === true || v === 'true' || String(v).toLowerCase() === 'yes' ? 'Yes' : 'No';
      if (h === 'note') v = String(v).replace(/<[^>]*>/g, '').replace(/\|/g, ',');
      if (String(v).includes(',')) v = `"${String(v).replace(/"/g, '""')}"`;
      return v;
    }));
    const csv = [...meta, ...rows].map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `import_report_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  const handleConfirmImport = async () => {
    setIsConfirming(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/import/confirm-import`);
      navigate('/dashboard');
    } catch { alert('Error confirming import. Please try again.'); }
    finally { setIsConfirming(false); }
  };

  const handleCancelImport = async () => {
    setIsConfirming(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/import/cancel-preview`);
      navigate('/dashboard');
    } catch { alert('Error cancelling import. Please try again.'); }
    finally { setIsConfirming(false); }
  };

  return (
    <div className="import-success-page">
      {previewMode && (
        <div className="import-preview-banner" style={{ maxWidth: 600, width: '100%', marginBottom: '1rem' }}>
          ⚠️ <strong>Preview Mode</strong> — Data is temporarily saved. Confirm to save permanently or cancel to remove.
        </div>
      )}

      <div className="import-success-card">
        <div className="import-success-icon">🎉</div>
        <h1 className="import-success-title">Import Complete</h1>
        <p className="import-success-msg">
          Data successfully imported{previewMode ? ' (Preview Mode)' : ''} on {importDateTime}
        </p>

        <div className="import-success-stats">
          <div className="import-success-stat">
            <div className="import-success-stat-value">{totalImported}</div>
            <div className="import-success-stat-label">Rows imported</div>
          </div>
          <div className="import-success-stat">
            <div className="import-success-stat-value">{uniqueClientsCount}</div>
            <div className="import-success-stat-label">Clients</div>
          </div>
          <div className="import-success-stat">
            <div className="import-success-stat-value">{totalWarnings}</div>
            <div className="import-success-stat-label">Warnings</div>
          </div>
        </div>

        <div className="import-success-actions">
          <button className="import-btn import-btn-secondary" onClick={downloadReport}>
            <FaDownload style={{ marginRight: 6 }} /> Download Report
          </button>

          {previewMode ? (
            <>
              <button className="import-btn import-btn-success" onClick={handleConfirmImport} disabled={isConfirming}>
                {isConfirming ? '⏳ Processing…' : '✅ Confirm Import'}
              </button>
              <button className="import-btn import-btn-danger" onClick={handleCancelImport} disabled={isConfirming}>
                {isConfirming ? '⏳ Processing…' : '❌ Cancel'}
              </button>
            </>
          ) : (
            <button className="import-btn import-btn-primary" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ImportSuccess;