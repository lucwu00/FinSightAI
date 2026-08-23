import React, { useState, useEffect, useCallback, useRef } from 'react';
import '../Import/Import.css';
import { FaRobot } from 'react-icons/fa6';
import { generateNoteAI, autoMapPolicyType, generateSmartClientId } from '../utils/dataCleanerClient.js';
import AddRowModal from './AddRowModal';
import EditRowModal from './EditRowModal';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function PreviewTable({ previewData, onEditCell, onDeleteRow, onAddRow, onApprove, setCleanData, usedIds = [], clientDb = [], warnings = [] }) {
  const [selectedRowData, setSelectedRowData] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showEditMessage, setShowEditMessage] = useState(false);
  const [showValidationError, setShowValidationError] = useState(false);
  const [localData, setLocalData] = useState([]);
  const hasUnsavedData = localData.length > 0;
  const [policyTypeMap, setPolicyTypeMap] = useState({});
  const [aiEnhancementMode, setAiEnhancementMode] = useState(false);
  const [enhancingRows, setEnhancingRows] = useState(new Set());
  const [enhancedRows, setEnhancedRows] = useState(new Set());
  const beforeUnloadRef = useRef(null);
  const popStateRef = useRef(null);
  const clickGuardRef = useRef(null);
  const navigate = useNavigate();

  // Fetch policy types
  useEffect(() => {
  const fetchPolicyTypes = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/policies/store/policies`);
      const storePolicies = await response.json();
      const typeMap = {};
      storePolicies.forEach(p => { 
  const name = p.name || p.policyName || p.productName;
  const id = p.policyId || p.id || p.policyTypeId;
  if (name && id) typeMap[name] = id; 
});
      setPolicyTypeMap(typeMap);
    } catch (err) {
      console.error('Failed to fetch policy types:', err); // ADD THIS
      setPolicyTypeMap({});
    }
  };
  fetchPolicyTypes();
}, []);

  const refreshPolicyTypes = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/policies/store/policies`);
      const storePolicies = await response.json();
      const typeMap = {};
      storePolicies.forEach(p => { typeMap[p.name] = p.policyId; });
      setPolicyTypeMap(typeMap);
    } catch {}
  };

  const normalizeRow = (row, processedRows = []) => {
    const normalized = {
      ...row,
      clientId: row.clientId || row.client_id || '',
      fullName: row.fullName || row.full_name || '',
      policyName: row.policyName || row.productType || row.product_type || '',
      policyTypeId: row.policyTypeId || row.policy_type_id || '',
      fundTypeILP: row.fundTypeILP || row.fund_type || '',
      premium: row.premium || row.premiumAmount || row.premium_amount || '',
      premiumFrequency: row.premiumFrequency || row.premium_frequency || '',
      startDate: row.startDate || row.start_date || '',
      endDate: row.endDate || row.end_date || '',
      policyId: row.policyId || '',
      provider: row.provider || 'AIA',
      coverageAmount: row.coverageAmount || 100000,
      status: row.status || 'Active',
      advisorId: row.advisorId || 1,
      note: row.note || '',
      nric: row.nric || '',
      email: row.email || '',
      phone: row.phone || '',
      recommended: (() => {
        const v = row.recommended;
        if (v === true || v === 'true' || (typeof v === 'string' && v.toLowerCase() === 'yes')) return 'Yes';
        if (v === false || v === 'false' || (typeof v === 'string' && v.toLowerCase() === 'no')) return 'No';
        return '';
      })(),
    };

    if (normalized.fullName) {
      normalized.clientId = generateSmartClientId(normalized.fullName, normalized.nric, normalized.clientId, usedIds, clientDb, processedRows);
    }

    const notes = [];
if (!normalized.nric) notes.push('❌ Missing NRIC');
else if (!/^[STFG]\d{7}[A-Z]$/i.test(normalized.nric)) notes.push('❌ Invalid NRIC format');
else {
  // Check duplicate NRIC in database with different name
  const dbMatch = clientDb.find(c => c.nric && c.nric.toUpperCase() === normalized.nric.toUpperCase());
  if (dbMatch && dbMatch.fullName && normalized.fullName &&
      dbMatch.fullName.trim().toLowerCase() !== normalized.fullName.trim().toLowerCase()) {
    notes.push(`❌ NRIC ${normalized.nric} already belongs to ${dbMatch.fullName} in database`);
  }
  // Check duplicate NRIC in current import batch with different name
  const batchMatch = processedRows.find(p =>
    p.nric && p.nric.toUpperCase() === normalized.nric.toUpperCase() &&
    p.fullName && normalized.fullName &&
    p.fullName.trim().toLowerCase() !== normalized.fullName.trim().toLowerCase()
  );
  if (batchMatch) {
    notes.push(`❌ NRIC ${normalized.nric} conflicts with ${batchMatch.fullName} in this import`);
  }
}

if (!normalized.email && !normalized.phone) notes.push('❌ Missing both phone and email');
else {
  if (normalized.email && !/\S+@\S+\.\S+/.test(normalized.email)) notes.push('❌ Invalid email format');
  if (normalized.phone && !/^\+65\s?\d{8}$/.test(normalized.phone)) notes.push('❌ Invalid phone format');
}

if (!normalized.policyName || normalized.policyName === 'Policy' || !normalized.policyName.trim()) {
  normalized.policyName = '';
  notes.push('❌ Missing policy name');
}
if (normalized.policyName && normalized.policyName !== 'Policy' && normalized.policyName.trim()) {
  normalized.policyTypeId = policyTypeMap[normalized.policyName] || autoMapPolicyType(normalized.policyName);
  if (!normalized.policyTypeId) notes.push('❌ Policy type could not be mapped');
} else {
  normalized.policyTypeId = '';
}
if (normalized.policyName === 'Investment-Linked') {
  if (!normalized.fundTypeILP || !['Growth','Income','Balanced','Aggressive'].includes(normalized.fundTypeILP)) {
    notes.push('❌ Investment-Linked requires a fund type');
  }
}
if (!normalized.policyId && normalized.clientId && normalized.policyTypeId) {
  normalized.policyId = `${normalized.clientId}-${normalized.policyTypeId}`;
}
if (!normalized.coverageAmount || normalized.coverageAmount <= 0) notes.push('❌ Coverage amount must be > 0');
if (!normalized.premium || normalized.premium <= 0) notes.push('❌ Premium must be > 0');
if (!normalized.startDate) notes.push('❌ Start date required');
if (!normalized.endDate) notes.push('❌ End date required');

normalized.note = notes.length > 0 ? notes.join('<br/>') : (row.note || '✅ Data is clean and complete');
return normalized;
  };



  

  const enhanceRowWithAI = async (rowIndex) => {
    const row = localData[rowIndex];
    if (!row || enhancingRows.has(rowIndex)) return;
    setEnhancingRows(prev => new Set([...prev, rowIndex]));
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/import/enhance-row`, {
        rowData: row,
        existingClientIds: [...usedIds, ...localData.map(r => r.clientId)]
      });
      const { enhancedNote, aiInsights } = response.data;
      const insight = (!aiInsights || aiInsights.includes('algorithmic')) ? 'Validated using smart algorithms' : aiInsights;
      const update = prev => {
        const next = [...prev];
        if (!next[rowIndex]) return prev;
        next[rowIndex] = { ...next[rowIndex], note: enhancedNote, aiInsights: insight, enhancedByAI: true };
        return next;
      };
      setLocalData(update);
      setCleanData(update);
      setEnhancedRows(prev => new Set([...prev, rowIndex]));
    } catch {
      const update = prev => {
        const next = [...prev];
        if (!next[rowIndex]) return prev;
        next[rowIndex] = { ...next[rowIndex], note: (next[rowIndex].note || '') + '<br/>🤖 AI enhancement unavailable', aiInsights: 'Algorithmic validation applied', enhancedByAI: true };
        return next;
      };
      setLocalData(update);
      setCleanData(update);
    }
    setEnhancingRows(prev => { const s = new Set(prev); s.delete(rowIndex); return s; });
  };

  const enhanceAllWarningRows = async () => {
    const indices = localData.map((r,i) => ({ r, i })).filter(({ r }) => r.note?.includes('❌')).map(({ i }) => i);
    if (!indices.length) { alert('No rows with errors to enhance.'); return; }
    setAiEnhancementMode(true);
    for (let i = 0; i < indices.length; i += 3) {
      await Promise.all(indices.slice(i, i+3).map(idx => enhanceRowWithAI(idx)));
      if (i + 3 < indices.length) await new Promise(r => setTimeout(r, 1000));
    }
    setAiEnhancementMode(false);
  };

  useEffect(() => {
  if (!previewData || !Array.isArray(previewData) || previewData.length === 0) return;
  const processedRows = [];
  for (const row of previewData) {
    processedRows.push({ ...normalizeRow(row, [...processedRows]) });
  }
  setLocalData(processedRows);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [previewData]);

  const handleEditClick = (row, index) => {
    setSelectedRowData({ ...row, rowIndex: index });
    setIsModalOpen(true);
    setEditMode(false);
  };

  const handleSaveEdit = (editedRow) => {
  const updated = [...localData];
  const saved = { ...editedRow };
  delete saved.rowIndex;
  updated[editedRow.rowIndex] = saved;
  setLocalData(updated);
  setCleanData(updated);
  setIsModalOpen(false);
  setSelectedRowData(null);
};

  const handleDelete = (rowIndex) => {
  const updated = localData.filter((_, i) => i !== rowIndex);
  setLocalData(updated);
  setCleanData(updated);
};

  const handleAdd = (newRow) => {
  setLocalData(prev => {
    const dbMatch = clientDb.find(c => c.nric && newRow.nric &&
      c.nric.toUpperCase() === newRow.nric.toUpperCase() &&
      c.fullName?.trim().toLowerCase() !== newRow.fullName?.trim().toLowerCase()
    );
    const batchMatch = prev.find(p => p.nric && newRow.nric &&
      p.nric.toUpperCase() === newRow.nric.toUpperCase() &&
      p.fullName?.trim().toLowerCase() !== newRow.fullName?.trim().toLowerCase()
    );
    let note = newRow.note || '✅ Data is clean and complete';
    if (dbMatch) note = `❌ NRIC ${newRow.nric} already belongs to ${dbMatch.fullName} in database`;
    else if (batchMatch) note = `❌ NRIC ${newRow.nric} conflicts with ${batchMatch.fullName} in this import`;
    return [...prev, { ...newRow, note }];
  });
  setCleanData(prev => typeof prev === 'function' ? prev : [...(prev || []), newRow]);
  setIsAddModalOpen(false);
};

  const isAllValid = localData.every(r => r.note && !r.note.includes('❌'));
  const criticalErrorCount = localData.filter(r => r.note?.includes('❌')).length;

  const handleApproveAndImport = async () => {
    if (!isAllValid) {
      setShowValidationError(true);
      setTimeout(() => document.querySelector('.import-validation-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
      return;
    }
    try {
      const validatedData = localData.map(row => ({
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
        recommended: row.recommended === 'Yes' || row.recommended === true,
        note: row.note || '',
        notes: row.note || ''
      }));

      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/import/import-approved-data`, { approvedData: validatedData });
      if (response.data && (response.data.success || response.status === 200)) {
        setLocalData([]);
        sessionStorage.removeItem('importProgress');
        sessionStorage.setItem('importResults', JSON.stringify({
          importedRows: validatedData, importWarnings: [], user: 'Admin',
          importDateTime: new Date().toLocaleString(), totalImported: validatedData.length,
          totalWarnings: 0, previewMode: response.data.previewMode || false
        }));
        window.location.href = '/import/success';
      }
    } catch (error) {
      alert(`Import failed: ${error.response?.data?.message || error.message}`);
    }
  };

  const fieldLabels = {
    clientId: 'Client ID', fullName: 'Full Name', nric: 'NRIC', email: 'Email', phone: 'Phone',
    policyName: 'Policy Name', fundTypeILP: 'Fund Type', policyId: 'Policy ID', provider: 'Provider',
    coverageAmount: 'Coverage', premium: 'Premium', premiumFrequency: 'Frequency',
    startDate: 'Start Date', endDate: 'End Date', status: 'Status', recommended: 'Recommended', note: 'Validation Notes'
  };

  const columnOrder = ['clientId','fullName','nric','email','phone','policyName','fundTypeILP','policyId','provider','coverageAmount','premium','premiumFrequency','startDate','endDate','status','recommended','note'];
  const visibleFields = columnOrder.filter(key => fieldLabels[key] && localData.length > 0 && localData[0].hasOwnProperty(key));

  if (!Array.isArray(localData)) return <p>Loading data…</p>;

  return (
    <div className="import-preview-card">

      {/* Controls */}
      <div className="import-preview-controls">
        <div className="import-preview-stats">
          <span className="import-stat-pill clean">✅ Clean: {localData.length - criticalErrorCount}</span>
          <span className="import-stat-pill errors">❌ Errors: {criticalErrorCount}</span>
          <span className="import-stat-pill enhanced">🤖 Enhanced: {enhancedRows.size}</span>
        </div>

        <div className="import-preview-actions">
          {hasUnsavedData && (
            <span className="import-unsaved-banner" style={{ fontSize: '0.78rem', padding: '3px 10px' }}>
              ⚠️ {localData.length} rows unsaved
            </span>
          )}
          <button className="import-btn import-btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }} onClick={refreshPolicyTypes}>🔄 Refresh</button>
          <button className="import-btn import-btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }} onClick={() => setIsAddModalOpen(true)}>+ Add Row</button>
          <button className="import-btn import-btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }} onClick={() => { setEditMode(true); setShowEditMessage(true); setTimeout(() => setShowEditMessage(false), 3000); }}>✏️ Edit Row</button>
          {criticalErrorCount > 0 && (
            <button className="import-btn" style={{ background: '#0ea5e9', color: 'white', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }} onClick={enhanceAllWarningRows} disabled={aiEnhancementMode}>
              <FaRobot style={{ marginRight: 4 }} />{aiEnhancementMode ? 'Enhancing…' : `AI Fix ${criticalErrorCount} Errors`}
            </button>
          )}
        </div>
      </div>

      {showEditMessage && <div className="import-edit-toast" style={{ margin: '0 1.25rem 0.75rem' }}>✏️ Edit mode — click any row to edit it.</div>}

      {/* Table */}
      <div className="import-table-wrapper">
        {localData.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280', fontSize: '0.9rem' }}>
            No data. Use "+ Add Row" to add entries.
          </div>
        ) : (
          <table className="import-preview-table">
            <thead>
              <tr>
                <th style={{ minWidth: 40 }}>No.</th>
                <th style={{ minWidth: 40 }}>AI</th>
                {visibleFields.map(key => <th key={key}>{fieldLabels[key]}</th>)}
              </tr>
            </thead>
            <tbody>
              {localData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`${row.note?.includes('❌') ? 'row-error' : ''} ${row.enhancedByAI ? 'row-enhanced' : ''} ${editMode ? 'row-edit-mode' : ''}`}
                  onClick={() => editMode && handleEditClick(row, rowIndex)}
                >
                  <td>{rowIndex + 1}</td>
                  <td style={{ textAlign: 'center' }}>
                    {enhancingRows.has(rowIndex) ? '🔄' :
                      (row.enhancedByAI || enhancedRows.has(rowIndex)) ? <span title="AI Enhanced">🤖</span> :
                      row.note?.includes('❌') ? (
                        <button onClick={e => { e.stopPropagation(); enhanceRowWithAI(rowIndex); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }} title="Fix with AI">🧠</button>
                      ) : <span title="Clean">✅</span>}
                  </td>
                  {visibleFields.map(key => (
                    <td key={key} style={{ maxWidth: 180 }}>
                      {key === 'note' ? (
                        <div>
                          <div
                            className={row.note?.includes('❌') ? 'import-note-error' : 'import-note-ok'}
                            style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            title={row[key]}
                            dangerouslySetInnerHTML={{ __html: row[key] }}
                          />
                          {(row.enhancedByAI || row.aiInsights) && (
                            <div className="import-ai-insight">🤖 {row.aiInsights || 'Enhanced by AI'}</div>
                          )}
                        </div>
                      ) : key === 'recommended' ? (
                        (() => { const v = row[key]; return v === true || v === 'true' || String(v).toLowerCase() === 'yes' ? '✅ Yes' : v === false || v === 'false' || String(v).toLowerCase() === 'no' ? '❌ No' : '-'; })()
                      ) : key === 'premium' || key === 'coverageAmount' ? (
                        row[key] ? `$${Number(row[key]).toLocaleString()}` : '-'
                      ) : (
                        <div style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row[key]}>
                          {row[key] || '-'}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Approve section */}
      <div className="import-approve-section">
        <button
          className="import-btn import-btn-success"
          onClick={handleApproveAndImport}
          disabled={!isAllValid}
          style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
        >
          Approve & Import ({localData.length} rows)
        </button>

        <div className={`import-guide-box ${criticalErrorCount > 0 ? 'has-errors' : 'all-clear'}`} style={{ maxWidth: 700, width: '100%' }}>
          {criticalErrorCount > 0 ? (
            <>
              <div className="import-guide-title">⚠️ {criticalErrorCount} row{criticalErrorCount > 1 ? 's have' : ' has'} errors</div>
              <ul>
                <li>Click 🧠 on individual rows or use "AI Fix" to auto-resolve errors</li>
                <li>Or click ✏️ Edit Row to manually correct data</li>
                <li>All errors must be resolved before importing</li>
              </ul>
            </>
          ) : (
            <>
              <div className="import-guide-title">✅ All {localData.length} rows are ready to import</div>
              <ul>
                <li>Client IDs (C001, C002…) and Policy IDs have been auto-generated</li>
                <li>Click "Approve & Import" to proceed</li>
              </ul>
            </>
          )}
        </div>

        {showValidationError && (
          <div className="import-validation-error" style={{ maxWidth: 700, width: '100%' }}>
            ❌ {criticalErrorCount} row{criticalErrorCount > 1 ? 's have' : ' has'} errors — fix them before importing.
            <button className="import-validation-close" onClick={() => setShowValidationError(false)}>×</button>
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <AddRowModal onAdd={handleAdd} onClose={() => setIsAddModalOpen(false)} policyTypeMap={policyTypeMap}
          generateNoteAI={generateNoteAI} usedIds={[...usedIds, ...localData.map(r => r.clientId)]} clientDb={clientDb} />
      )}
      {isModalOpen && selectedRowData && (
        <EditRowModal rowData={selectedRowData} onSave={handleSaveEdit} onDelete={handleDelete}
          onClose={() => { setIsModalOpen(false); setSelectedRowData(null); }} policyTypeMap={policyTypeMap}
          generateNoteAI={generateNoteAI} usedIds={[...usedIds, ...localData.map(r => r.clientId)]} clientDb={clientDb} />
      )}
    </div>
  );
}

export default PreviewTable;