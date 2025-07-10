// src/Import/ImportSuccess.jsx
import React from 'react';
import Layout from '../Layout/Layout';
import { useNavigate, useLocation } from 'react-router-dom';
import './ImportSuccess.css';
import {
  FaCheckCircle,
  FaStar,
  FaExclamationTriangle,
  FaDownload
} from 'react-icons/fa';

function ImportSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    importedRows = [],
    importWarnings = [],
    user = 'Anonymous',
    importDateTime = new Date().toLocaleString()
  } = location.state || {};

  const totalRows = importedRows.length;
  const autoFilled = importedRows.filter(row =>
    row.note?.toLowerCase().includes('auto-filled')
  ).length;
  const skipped = importWarnings.length;

  const downloadReport = () => {
    const metadata = [
      ['Imported By', user],
      ['Date', importDateTime],
      ['Total Rows Imported', totalRows],
      ['Fields Auto-filled', autoFilled],
      ['Errors Skipped', skipped],
      [],
      ['--- Imported Data ---']
    ];

    // Exclude policy_type_id column
    const previewHeaders = Object.keys(importedRows[0] || {}).filter(h => h !== 'policy_type_id');
    const previewRows = importedRows.map(row =>
      previewHeaders.map(h => row[h] ?? '')
    );

    metadata.push(previewHeaders, ...previewRows);

    // Conditionally include warning section
    if (importWarnings.length > 0) {
      metadata.push([], ['--- Issues Found ---'], ['Client ID', 'Email', 'Issue']);
      const warningRows = importWarnings.map(w => [
        w.clientId || '-',
        w.email || '-',
        w.issue || 'Unknown'
      ]);
      metadata.push(...warningRows);
    }

    const csv = metadata.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import_report.csv`;
    a.click();
  };

  return (
    <Layout>
      <div className="import-summary-page">
        <h1>Import Summary</h1>
        <p className="success-msg">
          <FaCheckCircle color="green" /> Data successfully imported
        </p>

        <table className="summary-table">
          <tbody>
            <tr>
              <td>Total Rows Imported</td>
              <td>{totalRows}</td>
            </tr>
            <tr>
              <td>Fields Auto-filled</td>
              <td>
                {autoFilled} <FaStar color="gold" />
              </td>
            </tr>
            <tr>
              <td>Errors Skipped</td>
              <td>
                {skipped} <FaExclamationTriangle color="orange" />
              </td>
            </tr>
          </tbody>
        </table>

        <div className="import-actions">
          <button className="download-btn" onClick={downloadReport}>
            <FaDownload /> Download Import Report (.csv/.pdf)
          </button>

          <button className="go-dashboard-btn" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </button>
        </div>
      </div>
    </Layout>
  );
}

export default ImportSuccess;
