import React, { useState, useEffect, useRef, useCallback } from 'react';
import './PreviewTable.css';
import { FaWandMagicSparkles } from 'react-icons/fa6';
import {
  generateNoteAI,
  autoMapPolicyType,
  deriveStatus,
  applyClientLevelAIHints,
} from '../utils/dataCleanerClient.js';
import AddRowModal from './AddRowModal';
import EditRowModal from './EditRowModal';
import productTypeMap from './productTypeMap';
import { useNavigate } from 'react-router-dom';

function PreviewTable({ previewData, onEditCell, onDeleteRow, onAddRow, onApprove, setCleanData, usedIds = [], clientDb = [] }) {
  const [selectedRowData, setSelectedRowData] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [enrichedData, setEnrichedData] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [showEditMessage, setShowEditMessage] = useState(false);
  const [showValidationError, setShowValidationError] = useState(false);


  const enrichRows = useCallback(async (data) => {
    const assignedIds = new Set(usedIds);
    const enriched = [];
    const cleanNRIC = (val) => (val || '').trim().toUpperCase();
    const existingIds = new Set(clientDb.map(client => client.clientId || client.client_id));

    const getUnusedClientId = () => {
      for (let i = 1; i <= 999; i++) {
        const id = `C${i.toString().padStart(3, '0')}`;
        if (!existingIds.has(id) && !assignedIds.has(id)) {
          return id;
        }
      }
      return `C${(existingIds.size + 1).toString().padStart(3, '0')}`;
    };

    for (let i = 0; i < data.length; i++) {
      const row = { ...data[i] };
      const noteMessages = [];

      let clientId = row.clientId || row.client_id || '-';
      const nric = cleanNRIC(row.nric || row.NRIC || '');

      const prior = enriched.find(r => cleanNRIC(r.nric) === nric);
      const matchedDb = clientDb.find(client => cleanNRIC(client.nric) === nric);

      if (!nric || nric === '-') {
        noteMessages.push('❌ Missing NRIC — required to assign client ID.');
        clientId = '-';
      } else if (matchedDb) {
        const dbClientId = matchedDb.client_id || matchedDb.clientId;
        if (clientId !== dbClientId) {
          noteMessages.push(`⚠️ Client ID corrected from ${clientId || '-'} to ${dbClientId}`);
          clientId = dbClientId;
        } else {
          noteMessages.push('⚠️ Client ID matched with database');
        }
      } else if (prior) {
        clientId = prior.clientId;
        noteMessages.push(`⚠️ Reused client ID from earlier row: ${clientId}`);
      } else {
        clientId = getUnusedClientId();
        noteMessages.push(`⚠️ New client – assigned ID: ${clientId}`);
      }

      assignedIds.add(clientId);

      const productType = row.productType || row.product_type || '';
      const policyTypeId = autoMapPolicyType(productType);
      const status = deriveStatus(row.startDate, row.endDate);

      if (productType !== 'Investment-Linked') {
        row.fundType = '';
      }

      row.policyTypeId = policyTypeId || row.policyTypeId;

      const aiNotes = generateNoteAI(row, [...assignedIds]);

const splitNotes = [...noteMessages, aiNotes]
  .flatMap(n => n.split(/;\s*/g)) // break every note at semicolons
  .map(n => n.trim())
  .filter(Boolean)
  .map(n => `• ${n}`)
  .join('<br/>');


      enriched.push({
        ...row,
        clientId,
        policyTypeId,
        status,
        note: splitNotes
      });
    }

    return applyClientLevelAIHints(enriched);
  }, [usedIds, clientDb]);

  const hasEnrichedRef = useRef(false);

  useEffect(() => {
    if (Array.isArray(previewData) && !hasEnrichedRef.current) {
      enrichRows(previewData).then((enriched) => {
        setEnrichedData(enriched);
        setCleanData(enriched);
        hasEnrichedRef.current = true;
      });
    }
  }, [previewData, setCleanData, enrichRows]);

  const handleEditClick = (row, index) => {
    setSelectedRowData({ ...row, rowIndex: index });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRowData(null);
  };

  const handleAddRowClick = () => setIsAddModalOpen(true);
  const handleCloseAddModal = () => setIsAddModalOpen(false);

  const handleAddNewRow = async (newRow) => {
    const normalizedRow = {
      clientName: newRow.full_name,
      clientId: newRow.client_id,
      email: newRow.email,
      phone: newRow.phone,
      nric: newRow.nric,
      productType: newRow.product_type,
      fundTypeILP: newRow.fund_type,
      policyTypeId: newRow.policy_type_id,
      startDate: newRow.start_date,
      endDate: newRow.end_date,
      premiumAmount: newRow.premium_amount,
      premiumFrequency: newRow.premium_frequency,
      status: newRow.status,
      occupation: newRow.occupation || '',
      annualIncome: newRow.annualIncome || 0,
      note: newRow.note,
    };

    const newClean = await enrichRows([...enrichedData, normalizedRow]);
    setEnrichedData(newClean);
    setCleanData(newClean);
    setIsAddModalOpen(false);
  };

  const handleDelete = (rowIndexToDelete) => {
    const updatedRows = [...enrichedData];
    updatedRows.splice(rowIndexToDelete, 1);
    setEnrichedData(updatedRows);
  };

  const handleSaveRow = async (updatedRow, rowIndex) => {
    const updatedRows = [...enrichedData];
  
    const normalizedRow = {
      ...enrichedData[rowIndex], // start from original
      ...updatedRow,
      clientName: updatedRow.full_name,
      clientId: updatedRow.client_id,
      email: updatedRow.email,
      phone: updatedRow.phone,
      nric: updatedRow.nric,
      productType: updatedRow.product_type,
      fundTypeILP: updatedRow.fund_type,
      policyTypeId: updatedRow.policy_type_id,
      startDate: updatedRow.start_date,
      endDate: updatedRow.end_date,
      premiumAmount: updatedRow.premium_amount,
      premiumFrequency: updatedRow.premium_frequency,
      status: updatedRow.status,
      note: updatedRow.note
    };
  

    const cleanedRow = { ...normalizedRow };
    delete cleanedRow.full_name;
    delete cleanedRow.client_id;
    delete cleanedRow.product_type;
    delete cleanedRow.fund_type;
    delete cleanedRow.policy_type_id;
    delete cleanedRow.start_date;
    delete cleanedRow.end_date;
    delete cleanedRow.premium_amount;
    delete cleanedRow.premium_frequency;
  
    updatedRows[rowIndex] = cleanedRow;
  

    const enrichedAgain = await enrichRows(updatedRows);
    setEnrichedData(enrichedAgain);
    setCleanData(enrichedAgain);
    setIsModalOpen(false);
    setSelectedRowData(null);
  };  
  

  const navigate = useNavigate();

  const isAllValid = enrichedData.every(
    (row) => row.note && !row.note.includes('❌')
  );  

  const handleApproveAndImport = () => {
    if (!isAllValid) {
      console.log("⛔ Not valid! Rendering error message.");
      setShowValidationError(true);
      setTimeout(() => {
        const errorBox = document.querySelector('.validation-error-message');
        if (errorBox) {
          errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return;
    }
    onApprove();
    navigate('/import/success');
  };  

  const visibleFields = Object.keys(enrichedData[0] || {}).filter(
    key => !['client_id', 'policy_type_id', 'fund_type', 'rowIndex', 'full_name'].includes(key)
  );  

  if (!Array.isArray(enrichedData) || enrichedData.length === 0) {
    return <p>No data to preview.</p>;
  }

  return (
    <div className="preview-table-container">
      <div className="ai-check-header">
        <h2>Preview and Clean Data</h2>
        <div className="ai-badge">
          <FaWandMagicSparkles /> Auto-assisted with AI ✨
        </div>
        {showEditMessage && (
          <div className="edit-mode-toast">
            ✏️ Edit Mode Activated — click the row you want to edit.
          </div>
        )}
      </div>

      <div className="row-action-buttons">
        <button className="add-button" onClick={handleAddRowClick}>➕ Add Row</button>
        <button
          className="edit-button"
          onClick={() => {
            setEditMode(true);
            setShowEditMessage(true);
            setTimeout(() => setShowEditMessage(false), 3000);
          }}
        >
          ✏️ Edit Row
        </button>
      </div>

      <table className="preview-table">
        <thead>
          <tr>
            <th>No.</th>
            {visibleFields.map((key) => (
              <th key={key}>{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {enrichedData.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              onClick={() => editMode && handleEditClick(row, rowIndex)}
            >
              <td>{rowIndex + 1}</td>
              {visibleFields.map((key) => (
                <td key={key}>
                {key === 'note' ? (
                  <span
                    style={{
                      color: 'orange',
                      fontWeight: 'normal',
                      textAlign: 'left',
                      display: 'block',
                      whiteSpace: 'normal',
                    }}
                    dangerouslySetInnerHTML={{ __html: row[key]?.replace(/•\s?/g, '•&nbsp;').replace(/<br\/>/g, '<br/><br/>') }}
                  />
                ) : (
                  row[key] || '-'
                )}
              </td>                   
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="table-actions">
      <div
  onClick={() => {
    if (!isAllValid) {
      console.log("⛔ Not valid! Rendering error message.");
      setShowValidationError(true);
      setTimeout(() => {
        const errorBox = document.querySelector('.validation-error-message');
        if (errorBox) {
          errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }}
>
  <button
    className="approve-button"
    onClick={handleApproveAndImport}
    disabled={!isAllValid}
  >
    Approve and Import
  </button>
</div>

        {showValidationError && (
  <div className="validation-error-message" style={{ backgroundColor: '#ffe6e6', padding: '1rem', marginTop: '1rem', border: '1px solid #b30000', position: 'relative' }}>
    <button
      onClick={() => setShowValidationError(false)}
      style={{
        position: 'absolute',
        top: '8px',
        right: '12px',
        background: 'transparent',
        border: 'none',
        fontSize: '18px',
        fontWeight: 'bold',
        cursor: 'pointer',
        color: '#b30000',
      }}
    >
      ❌
    </button>
    <span style={{ fontWeight: 'bold', color: '#b30000', fontSize: '16px' }}>
      ❌ Some rows contain critical errors (e.g., Missing NRIC or invalid format).<br />
      Please fix them before importing.
    </span>
  </div>
)}

    
  </div>
  
      {isAddModalOpen && (
        <AddRowModal
          onAdd={handleAddNewRow}
          onClose={handleCloseAddModal}
          productTypeMap={productTypeMap}
          generateNoteAI={generateNoteAI}
          usedIds={[...new Set([...usedIds, ...enrichedData.map(row => row.clientId)])]}
          clientDb={clientDb}
        />
      )}

      {isModalOpen && selectedRowData && (
        <EditRowModal
          rowData={selectedRowData}
          onSave={handleSaveRow}
          onDelete={handleDelete}
          onClose={handleCloseModal}
          productTypeMap={productTypeMap}
          generateNoteAI={generateNoteAI}
          usedIds={usedIds}
        />
      )}
    </div>
  );
}

export default PreviewTable;
