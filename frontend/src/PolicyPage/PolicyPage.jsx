import './PolicyPage.css';
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Layout from '../Layout/Layout';
import AddPolicyModal from './AddPolicyModal';
import EditPolicyModal from './EditPolicyModal';
import { FaSearch } from 'react-icons/fa';

const policyTypeMap = {
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

const policyNamesPattern = Object.keys(policyTypeMap)
  .sort((a, b) => b.length - a.length) // longest first to avoid partial match
  .join('|')
  .replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'); // escape special characters


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


  const sortedPolicies = [...policies]
    .filter(p => typeof p.policyId === 'string' && p.policyId.includes('-P'))
    .sort((a, b) => {
      const aSplit = a.policyId.split('-P');
      const bSplit = b.policyId.split('-P');

      const aNum = parseInt(aSplit[1], 10);
      const bNum = parseInt(bSplit[1], 10);

      // Fallback if parsing fails
      if (isNaN(aNum) || isNaN(bNum)) return 0;

      return aNum - bNum;
    });

  const generateAISummary = async (policies, client) => {
    if (!client || policies.length === 0) return '';
    try {
      const res = await axios.post('http://localhost:5050/api/genai/client-summary', {
        clientName: client.clientName || client.fullName,
        policies: policies,
      });
      return res.data.summary;
    } catch (err) {
      console.error('AI Summary generation failed:', err);
      return '';
    }
  };


  useEffect(() => {
    axios.get('http://localhost:5050/api/clients')
      .then(res => {
        setClients(res.data);
      })
      .catch(console.error);
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

      const res = await axios.get(`http://localhost:5050/api/policies/client/${searchClientId.toUpperCase()}`);
      const fetchedPolicies = res.data;

      const updatedPolicies = await Promise.all(
        fetchedPolicies.map(async (policy) => {
          if (!policy.policyTypeId && policy.productType) {
            const newTypeId = policyTypeMap[policy.productType];
            if (newTypeId) {
              try {
                await axios.put(`http://localhost:5050/api/policies/${policy._id}`, {
                  policyTypeId: newTypeId
                });
                return { ...policy, policyTypeId: newTypeId };
              } catch (err) {
                console.error(`❌ Failed to update policyTypeId for ${policy._id}:`, err.response?.data || err.message);
                return policy;
              }
            }
          }
          return policy;
        })
      );

      setPolicies(updatedPolicies);

   let currentClients = clients;
      if (clients.length === 0) {
        const clientRes = await axios.get('http://localhost:5050/api/clients');
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
      
      setTimeout(async () => {
        if (matchedClient) {
          const summary = await generateAISummary(updatedPolicies, matchedClient);
          setAiSummary(summary);
          console.log('Sending client to recommendation API:', matchedClient);

          try {
            const matchedPolicies = updatedPolicies.filter(p => p.clientId === matchedClient.clientId);

const recommendationRes = await axios.post('http://localhost:5050/api/genai/recommendation', {
  client: matchedClient,
  policies: matchedPolicies
});
            setAiRecommendation(recommendationRes.data.recommendation);
            console.log('AI Recommendation:', recommendationRes.data.recommendation);
          } catch (recErr) {
            console.error('Failed to generate AI recommendation:', recErr);
          }
        }
      }, 0);

    } catch (err) {
      console.error('❌ Search failed:', err.response?.data || err.message);
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
  
    const expired = policies.filter(p => new Date(p.endDate) < now);
    const expiring = policies.filter(p => {
      const end = new Date(p.endDate);
      return end >= now && end <= oneYearFromNow;
    });
    return {
      expiredPolicies: expired,
      expiringSoonPolicies: expiring,
    };
  }, [policies]);
  
  return (
    <Layout>
      {!searchCompleted && (
        <div className="welcome-box" style={{ marginTop: '40px' }}>
          <h2>Policy & Coverage By AIA</h2>
          <h1>AIA</h1>
        </div>
      )}

      {searchCompleted && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <h2>Policy & Coverage By AIA</h2>
        </div>
      )}

      <div className="search-box">
        <FaSearch onClick={handleSearch} className="search-icon" />
        <input
          type="text"
          placeholder="Search by Client ID"
          value={searchClientId}
          onChange={(e) => setSearchClientId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch}>Search</button>
      </div>

      {searchCompleted && selectedClient && (
        <div className="search-actions">
          <button className="add-button" onClick={() => setShowAddModal(true)}>+ Add</button>
          <button className="edit-button" onClick={() => setShowEditModal(true)}>✏️ Edit</button>
        </div>
      )}

      {loading && (
        <div className="loading-spinner" style={{ textAlign: 'center', marginTop: '20px', color: '#888' }}>
          Loading policies...
        </div>
      )}

      {hasSearched && (
        <div className="results-container">

          {hasSearched && selectedClient && (
            <div className="client-title-box">
              <h2>
                Policy & Coverage of {selectedClient.clientName || selectedClient.fullName || '-'} ({selectedClient.clientId})
              </h2>
            </div>
          )}

          {aiSummary && (
  <div className="ai-summary-box">
    ✨ <strong>AI Summary:</strong>
    <ul style={{ marginTop: '10px', paddingLeft: '20px', textAlign: 'left' }}>
      {aiSummary
        .split(/\d+\.\s|\n•\s*/g)
        .filter(line => line && line.trim() !== '')
        .slice(0, -1)
        .map((point, index) => (
          <li key={index} style={{ marginBottom: '8px' }}>
            <span
              dangerouslySetInnerHTML={{
                __html: point
                  .replace(
                    /\b(has )?(expired|expiring|will expire|missing|not covered)([^.,;]*)?/gi,
                    match =>
                      `<strong style="color: red; font-weight: bold;">${match.trim()}</strong>`
                  )
                  .replace(
                    /(no duplicates?|duplicates?[^.]*)/gi,
                    '<u style="text-decoration: underline; color: black;">$1</u>'
                  )
              }}
            />
          </li>
        ))}
      <li style={{ marginBottom: '8px' }}>
        <span
          dangerouslySetInnerHTML={{
            __html: `
              There are <strong style="color: red; font-weight: bold;">${expiredPolicies.length}</strong> expired policies: 
              <em>${expiredPolicies.map(p => p.productType).join(', ') || 'None'}</em>.<br/>
              There are <strong style="color: red; font-weight: bold;">${expiringSoonPolicies.length}</strong> expiring policies: 
              <em>${expiringSoonPolicies.map(p => p.productType).join(', ') || 'None'}</em>.
            `
          }}
        />
      </li>
    </ul>

    {/* 🧠 AI Recommendation */}
    {aiRecommendation && (
      <div
        style={{
          marginTop: '20px',
          backgroundColor: '#fffef5',
          border: '1px solid #f0fc0b',
          borderRadius: '12px',
          padding: '15px 20px',
          fontSize: '15px',
          lineHeight: '1.6',
          color: '#444',
          boxShadow: '0 1px 5px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '16px' }}>🧠 AI Recommendation:</div>
        <div className="policy-recommendation">
          <ol style={{ paddingLeft: '20px' }}>
            {aiRecommendation
              .split(/\n|\*/)
              .map(line => line.trim())
              .filter(line =>
                line !== '' &&
                !/^\d+[\.\)]\s*$/.test(line) &&
                line !== '-' && line !== '–'
              )
              .map((line, index) => {
                // Clean dashes/numbering
                const cleanedLine = line.replace(/^\s*[-–•]?\s*/, '').replace(/^\d+[\.\)]\s*/, '');

                // Split into title and body
                const [titleRaw, ...rest] = cleanedLine.split(':');
                const body = rest.join(':').trim();

                // Policy name highlight in blue
                const styledTitle = titleRaw.replace(
                  new RegExp(`\\b(${policyNamesPattern})\\b`, 'gi'),
                  '<strong style="color: #1a73e8; font-weight: bold;">$1</strong>'
                );

                // Red highlight for missing/expired/etc
                const styledBody = body.replace(
                  /\b(has )?(expired|expiring|missing|not covered|will expire)([^.,;]*)?/gi,
                  match =>
                    `<strong style="color: red; font-weight: bold;">${match.trim()}</strong>`
                );

                return (
                  <li key={index} style={{ marginBottom: '10px' }}>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: `${styledTitle}${body ? '<br/>' + styledBody : ''}`
                      }}
                    />
                  </li>
                );
              })}
          </ol>
        </div>
      </div>
    )}
  </div>
)}


            
        
        </div>
      )}

      {policies.length > 0 ? (
        <table className="policy-table">
          <thead>
            <tr>
              <th>Policy ID</th>
              <th>Product Type</th>
              <th>Policy Type ID</th>
              <th>Coverage Amount</th>
              <th>Premium Amount</th>
              <th>Premium Frequency</th>
              <th>Fund Type for ILP</th>
              <th>Start Date</th>
              <th>Expiry Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {sortedPolicies.map((policy) => (
              <tr key={policy._id}>
                <td><strong>{policy.policyId}</strong></td>
                <td>{policy.productType || '-'}</td>
                <td>{policy.policyTypeId || '-'}</td>
                <td>${policy.coverageAmount?.toLocaleString() || '-'}</td>
                <td>${policy.premiumAmount?.toLocaleString() || '-'}</td> 
                <td>{policy.premiumFrequency || '-'}</td>
                <td>
                  {policy.productType === 'Investment-Linked'
                    ? (policy.fundTypeILP || '-')
                    : '-'}
                </td>
                <td>{policy.startDate?.slice(0, 10) || '-'}</td>
                <td>{policy.endDate?.slice(0, 10) || '-'}</td>
                <td>{policy.status || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="no-results">
          No policies found for client ID: <strong>{searchClientId}</strong>
        </p>
      )}

      {selectedClient && (
        <div className="client-profile-container">
          <div className="client-profile-card">
            <h3>Client Profile</h3>
            <ul>
              <li><strong>Name:</strong> {selectedClient.clientName || selectedClient.fullName || '-'}</li>
              <li><strong>Client ID:</strong> {selectedClient.clientId || '-'}</li>
              <li><strong>Date of Birth:</strong> {selectedClient.dob?.slice(0, 10) || '-'}</li>
              <li><strong>Occupation:</strong> {selectedClient.occupation || '-'}</li>
              <li><strong>Annual Income:</strong> {selectedClient.annualIncome !== undefined ? `$${selectedClient.annualIncome.toLocaleString()}` : '-'}</li>
            </ul>
          </div>
        </div>
      )}

{showAddModal && (
    <AddPolicyModal
      clientId={searchClientId}
      existingPolicies={policies}
      onClose={() => setShowAddModal(false)}
      onAddSuccess={() => {
        setShowAddModal(false);
        handleSearch();  // no timeout
      }}
    />
  )
}

{
  showEditModal && (
    <EditPolicyModal
      policies={policies}
      onClose={() => setShowEditModal(false)}
      onUpdateSuccess={() => {
        setShowEditModal(false);
        handleSearch();
      }}
    />
  )}
    </Layout >
  );
}





export default PolicyPage;