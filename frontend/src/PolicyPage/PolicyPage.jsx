import './PolicyPage.css';
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import AddPolicyModal from './AddPolicyModal';
import EditPolicyModal from './EditPolicyModal';
import CoverageGapPanel from './CoverageGapPanel';
import ClientSummaryPanel from './ClientSummaryPanel';

const fallbackPolicyTypes = {
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

function PolicyPage() {
  const [clients, setClients] = useState([]);
  const [searchClientId, setSearchClientId] = useState('');
  const [policies, setPolicies] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchCompleted, setSearchCompleted] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [aiRecommendation, setAiRecommendation] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [showEditMessage, setShowEditMessage] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [availablePolicyTypes, setAvailablePolicyTypes] = useState([]);
  const [policyTypesLoading, setPolicyTypesLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const rowRefs = React.useRef({});
  const [highlightId, setHighlightId] = useState(null);

  const policyTypeMap = useMemo(() => {
    const map = {};
    availablePolicyTypes.forEach(policy => {
      if (policy.isActive !== false) {
        map[policy.name] = policy.policyId;
      }
    });
    return map;
  }, [availablePolicyTypes]);

  const scrollToPolicy = (policyId) => {
    const el = rowRefs.current[policyId];
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightId(policyId);
    setTimeout(() => setHighlightId(null), 1600);
  };

  const scrollToFirstExpired = () => {
    if (expiredPolicies[0]) scrollToPolicy(expiredPolicies[0].policyId);
  };

  const scrollToFirstExpiring = () => {
    if (expiringSoonPolicies[0]) scrollToPolicy(expiringSoonPolicies[0].policyId);
  };

  const scrollToFirstByName = (name) => {
    const first = sortedPolicies.find(p => (p.policyName || '').trim() === name);
    if (first) scrollToPolicy(first.policyId);
  };

  const Linkish = ({ onClick, children, title }) => (
    <button onClick={onClick} title={title} className="linkish" type="button">
      {children}
    </button>
  );

  const fieldLabels = {
    policyId: 'Policy ID',
    policyName: 'Policy Name',
    fundTypeILP: 'Fund Type ILP',
    provider: 'Provider',
    coverageAmount: 'Coverage',
    premium: 'Premium',
    premiumFrequency: 'Frequency',
    startDate: 'Start Date',
    endDate: 'End Date',
    status: 'Status',
    recommended: 'Recommended',
    notes: 'Notes'
  };

  const columnOrder = [
    'clientId', 'policyId',
    'policyName', 'fundTypeILP',
    'provider', 'coverageAmount', 'premium', 'premiumFrequency',
    'startDate', 'endDate', 'status', 'recommended', 'notes'
  ];

  const visibleFields = columnOrder.filter(
    key => fieldLabels[key] && !['advisorId', 'rowIndex'].includes(key)
  );

  const sortedPolicies = useMemo(() => {
    const filtered = policies.filter(p =>
      typeof p.policyId === 'string' && p.policyId.length > 0
    );
    return filtered.sort((a, b) => a.policyId.localeCompare(b.policyId));
  }, [policies]);

  const { duplicateNames } = useMemo(() => {
    const map = {};
    for (const p of policies) {
      const name = (p.policyName || '').trim();
      if (!name) continue;
      (map[name] = map[name] || []).push(p);
    }
    const names = Object.keys(map).filter(n => map[n].length > 1).sort();
    return { duplicateNames: names };
  }, [policies]);

  const generateAISummary = async (policies, client) => {
    if (!client || policies.length === 0) return '';
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/genai/client-summary`,
        { clientName: client.fullName, policies }
      );
      return res?.data?.summary ?? res?.data?.content ?? res?.data?.text ?? '';
    } catch {
      return '';
    }
  };

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/clients`);
        setClients(res.data);
      } catch {}
    };
    fetchClients();
  }, []);

  useEffect(() => {
    const fetchAvailablePolicies = async () => {
      try {
        setPolicyTypesLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/policies/store/policies`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const storePolicies = await response.json();
        setAvailablePolicyTypes(storePolicies);
        setUsingFallback(false);
      } catch {
        const fallbackPolicies = Object.entries(fallbackPolicyTypes).map(([name, id]) => ({
          policyId: id, name, isActive: true
        }));
        setAvailablePolicyTypes(fallbackPolicies);
        setUsingFallback(true);
      } finally {
        setPolicyTypesLoading(false);
      }
    };
    fetchAvailablePolicies();
  }, []);

  const handleSearch = async () => {
    if (!searchClientId.trim()) return;
    setLoading(true);
    setHasSearched(false);
    setSearchCompleted(false);
    setSelectedClient(null);
    setPolicies([]);
    setAiSummary('');
    setAiRecommendation('');

    try {
      const url = `${import.meta.env.VITE_API_BASE_URL}/api/policies/client/${searchClientId.toUpperCase()}`;
      const res = await axios.get(url);
      const fetchedPolicies = res.data;

      const processedPolicies = (fetchedPolicies || []).map(policy => ({
        ...policy,
        nric: policy.nric || '-',
        email: policy.email || '-',
        phone: policy.phone || '-',
        notes: policy.notes || '-'
      }));

      setPolicies(processedPolicies);

      let currentClients = clients;
      if (clients.length === 0) {
        const clientRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/clients`);
        currentClients = clientRes.data;
        setClients(currentClients);
      }

      const matchedClient = currentClients.find(
        c => c.clientId.toUpperCase() === searchClientId.toUpperCase()
      );
      setSelectedClient(matchedClient || null);
      setHasSearched(true);
      setSearchCompleted(true);
      setLoading(false);

      if (matchedClient && processedPolicies.length > 0) {
        setTimeout(async () => {
          const summary = await generateAISummary(processedPolicies, matchedClient);
          setAiSummary(summary);
          try {
            const matchedPolicies = processedPolicies.filter(
              p => p.clientId === matchedClient.clientId
            );
            const recRes = await axios.post(
              `${import.meta.env.VITE_API_BASE_URL}/api/genai/recommendation`,
              { client: matchedClient, policies: matchedPolicies }
            );
            setAiRecommendation(
              recRes?.data?.recommendation ?? recRes?.data?.content ?? recRes?.data?.text ?? ''
            );
          } catch {
            setAiRecommendation('');
          }
        }, 1000);
      }
    } catch {
      setPolicies([]);
      setHasSearched(true);
      setSearchCompleted(true);
      setLoading(false);
    }
  };

  const { expiredPolicies, expiringSoonPolicies } = useMemo(() => {
    const now = new Date();
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(now.getFullYear() + 1);
    return {
      expiredPolicies: policies.filter(p => new Date(p.endDate) < now),
      expiringSoonPolicies: policies.filter(p => {
        const end = new Date(p.endDate);
        return end >= now && end <= oneYearFromNow;
      })
    };
  }, [policies]);

  const formatRecommended = (value) => {
    if (value === true || value === 'true' || (typeof value === 'string' && value.toLowerCase() === 'yes')) return '✅ Yes';
    if (value === false || value === 'false' || (typeof value === 'string' && value.toLowerCase() === 'no')) return '❌ No';
    return '-';
  };

  const getDisplayStatus = (row) => {
    const now = new Date();
    const end = new Date(row.endDate);
    if (isNaN(end.getTime())) return 'Active';
    if (end < now) return 'Expired';
    if (end.getFullYear() === now.getFullYear()) return 'Expiring Soon';
    return 'Active';
  };

  const rowBgColorFor = (row) => {
    const s = getDisplayStatus(row);
    if (s === 'Expired') return '#fff1f2';
    if (s === 'Expiring Soon') return '#fffbeb';
    return 'transparent';
  };

  const handleEditClick = (policy, index) => {
    setSelectedPolicy({
      ...policy,
      policyName: policy.policyName || '',
      policyId: policy.policyId || '',
      clientId: policy.clientId || '',
      fundTypeILP: policy.fundTypeILP || '',
      provider: policy.provider || '',
      coverageAmount: policy.coverageAmount || 0,
      premium: policy.premium || 0,
      premiumFrequency: policy.premiumFrequency || '',
      startDate: policy.startDate || '',
      endDate: policy.endDate || '',
      status: policy.status || 'Active',
      recommended: policy.recommended !== undefined ? policy.recommended : false,
      notes: policy.notes || '',
      rowIndex: index
    });
    setShowEditModal(true);
    setEditMode(false);
    setShowEditMessage(false);
  };

  if (policyTypesLoading) {
    return <div className="policy-page"><div className="loading-spinner">Loading policy types…</div></div>;
  }

  return (
    <div className="policy-page">

      {/* ── Search card ── */}
      <div className="policy-search-card">
  <div className="policy-page-hero">
    <h1 className="policy-title">Policy & Coverage</h1>
    <p className="policy-subtitle">Search a client to view their coverage</p>
  </div>
        <div className="search-input-container">
          <input
            type="text"
            placeholder="Search by Client ID"
            value={searchClientId}
            onChange={(e) => setSearchClientId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch}>Search</button>
        </div>
        {usingFallback && (
          <div className="fallback-warning">
            ⚠️ Using offline policy types. Some policies may not be current.
          </div>
        )}
      </div>

      {/* ── Results ── */}
      {searchCompleted && (
        <div className="policy-content">

          {/* Client title + action buttons */}
          {selectedClient && (
            <div className="client-title-box">
              <h2>{selectedClient.fullName} ({selectedClient.clientId})</h2>
              <div className="search-actions">
                <button className="add-button" onClick={() => setShowAddModal(true)}>+ Add</button>
                <button
                  className="edit-button"
                  onClick={() => {
                    setEditMode(true);
                    setShowEditMessage(true);
                    setTimeout(() => setShowEditMessage(false), 3000);
                  }}
                >
                  ✏️ Edit
                </button>
              </div>
            </div>
          )}

          {showEditMessage && (
            <div className="edit-mode-toast">
              ✏️ Edit Mode — click any row in the table to edit that policy.
            </div>
          )}

          {loading && <div className="loading-spinner">Loading policies…</div>}

          {/* AI summary */}
          {aiSummary && (
            <div className="ai-summary-box">
              ✨ <strong>AI Summary</strong>
              <ul>
                <li>
                  There are{' '}
                  <Linkish onClick={scrollToFirstExpired}>
                    <u><strong style={{ color: '#dc2626' }}>{expiredPolicies.length} expired</strong></u>
                  </Linkish>{' '}
                  policies:{' '}
                  {expiredPolicies.length
                    ? expiredPolicies.map((p, i) => (
                        <React.Fragment key={p.policyId}>
                          <Linkish onClick={() => scrollToPolicy(p.policyId)}>
                            <u><em>{p.policyName}</em></u>
                          </Linkish>
                          {i < expiredPolicies.length - 1 ? ', ' : ''}
                        </React.Fragment>
                      ))
                    : 'None'}.
                </li>
                <li>
                  There are{' '}
                  <Linkish onClick={scrollToFirstExpiring}>
                    <u><strong style={{ color: '#d97706' }}>{expiringSoonPolicies.length} expiring</strong></u>
                  </Linkish>{' '}
                  policies:{' '}
                  {expiringSoonPolicies.length
                    ? expiringSoonPolicies.map((p, i) => (
                        <React.Fragment key={p.policyId}>
                          <Linkish onClick={() => scrollToPolicy(p.policyId)}>
                            <u><em>{p.policyName}</em></u>
                          </Linkish>
                          {i < expiringSoonPolicies.length - 1 ? ', ' : ''}
                        </React.Fragment>
                      ))
                    : 'None'}.
                </li>
                {duplicateNames.length > 0 && (
                  <li>
                    There {duplicateNames.length === 1 ? 'is' : 'are'}{' '}
                    <Linkish onClick={() => scrollToFirstByName(duplicateNames[0])}>
                      <u><strong>{duplicateNames.length} duplicate {duplicateNames.length === 1 ? 'type' : 'types'}</strong></u>
                    </Linkish>:{' '}
                    {duplicateNames.map((name, i) => (
                      <React.Fragment key={name}>
                        <Linkish onClick={() => scrollToFirstByName(name)}>
                          <u><em>{name}</em></u>
                        </Linkish>
                        {i < duplicateNames.length - 1 ? ', ' : ''}
                      </React.Fragment>
                    ))}.
                  </li>
                )}
              </ul>

              {aiRecommendation && (
                <div style={{
                  marginTop: '1rem',
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '8px',
                  padding: '1rem',
                  fontSize: '0.875rem',
                  lineHeight: '1.6',
                }}>
                  <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>🧠 AI Recommendation</div>
                  <div dangerouslySetInnerHTML={{
                    __html: (aiRecommendation || '')
                      .replace(/(\d+\.\s)/g, '<br/>$1')
                      .replace(/^<br\/>/, ''),
                  }} />
                </div>
              )}
            </div>
          )}

          {/* Coverage gap panel */}
          {selectedClient && policies.length > 0 && (
            <CoverageGapPanel
              client={selectedClient}
              policies={policies}
              apiBaseUrl={import.meta.env.VITE_API_BASE_URL}
            />
          )}

          {selectedClient && policies.length > 0 && (
  <ClientSummaryPanel
    client={selectedClient}
    policies={policies}
    apiBaseUrl={import.meta.env.VITE_API_BASE_URL}
  />
)}

          {/* Policy table */}
          {policies.length > 0 ? (
            <div className="preview-table-container">
              <div className="table-wrapper">
                <table className="preview-table">
                  <thead>
                    <tr>
                      <th style={{ minWidth: 48 }}>No.</th>
                      {visibleFields.map(key => (
                        <th key={key}>{fieldLabels[key] || key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPolicies.map((row, rowIndex) => (
                      <tr
                        key={row.policyId || rowIndex}
                        ref={el => { if (el) rowRefs.current[row.policyId] = el; }}
                        className={highlightId === row.policyId ? 'row-flash' : ''}
                        onClick={() => editMode && handleEditClick(row, rowIndex)}
                        style={{
                          backgroundColor: editMode ? '#fdf2f8' : rowBgColorFor(row),
                          cursor: editMode ? 'pointer' : 'default',
                        }}
                      >
                        <td>{rowIndex + 1}</td>
                        {visibleFields.map(key => (
                          <td key={key}>
                            {key === 'recommended' ? (
                              formatRecommended(row[key])
                            ) : key === 'premium' || key === 'coverageAmount' ? (
                              row[key] ? `$${Number(row[key]).toLocaleString()}` : '-'
                            ) : key === 'status' ? (
                              (() => {
                                const s = getDisplayStatus(row);
                                const color = s === 'Expired' ? '#dc2626' : s === 'Expiring Soon' ? '#d97706' : '#16a34a';
                                return <span style={{ color, fontWeight: 600 }}>{s}</span>;
                              })()
                            ) : (
                              <div style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row[key]}>
                                {row[key] || '-'}
                              </div>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            !loading && hasSearched && (
              <div className="no-results">
                🔍 No policies found for client ID: <strong>{searchClientId}</strong>
              </div>
            )
          )}

          {/* Client profile */}
          {selectedClient && (
            <div className="client-profile-container">
              <div className="client-profile-card">
                <h3>Client Profile</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 2rem' }}>
                  <ul>
                    <li><strong>Name</strong>{selectedClient.fullName || '-'}</li>
                    <li><strong>Client ID</strong>{selectedClient.clientId || '-'}</li>
                    <li><strong>NRIC</strong>{selectedClient.nric || '-'}</li>
                    <li><strong>Email</strong>{selectedClient.email || '-'}</li>
                    <li><strong>Phone</strong>{selectedClient.phone || '-'}</li>
                    <li><strong>Date of Birth</strong>{selectedClient.dob ? new Date(selectedClient.dob).toLocaleDateString() : '-'}</li>
                    <li><strong>Gender</strong>{selectedClient.gender || '-'}</li>
                    <li><strong>Marital Status</strong>{selectedClient.maritalStatus || '-'}</li>
                  </ul>
                  <ul>
                    <li><strong>Occupation</strong>{selectedClient.occupation || '-'}</li>
                    <li><strong>Annual Income</strong>{selectedClient.annualIncome ? `$${parseFloat(selectedClient.annualIncome).toLocaleString()}` : '-'}</li>
                    <li><strong>Risk Profile</strong>{selectedClient.riskProfile || '-'}</li>
                    <li><strong>Advisor ID</strong>{selectedClient.advisorId || '-'}</li>
                    <li><strong>Last Contacted</strong>{selectedClient.lastContactedAt ? new Date(selectedClient.lastContactedAt).toLocaleDateString() : '-'}</li>
                    <li><strong>Notes</strong>{selectedClient.notes || '-'}</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddPolicyModal
          clientId={searchClientId}
          existingPolicies={policies}
          selectedClient={selectedClient}
          availablePolicyTypes={availablePolicyTypes}
          policyTypeMap={policyTypeMap}
          onClose={() => setShowAddModal(false)}
          onAddSuccess={() => { setShowAddModal(false); handleSearch(); }}
        />
      )}

      {showEditModal && (
        <EditPolicyModal
          policies={selectedPolicy ? [selectedPolicy] : policies}
          selectedPolicy={selectedPolicy}
          onClose={() => { setShowEditModal(false); setSelectedPolicy(null); setEditMode(false); }}
          onUpdateSuccess={() => { setShowEditModal(false); setSelectedPolicy(null); setEditMode(false); handleSearch(); }}
        />
      )}

    </div>
  );
}

export default PolicyPage;