import React, { useState, useEffect } from 'react';
import PolicyStoreModal from './PolicyStoreModal';
import AuthModal from './AuthModal';
import './PolicyStorePage.css';

// Fallback categories in case API fails
const fallbackCategories = {
  LIFE: "Life Insurance",
  HEALTH: "Health Insurance", 
  PROPERTY: "Property Insurance",
  SPECIALTY: "Specialty Insurance"
};

const PolicyStorePage = () => {
  const [policies, setPolicies] = useState([]);
  const [filteredPolicies, setFilteredPolicies] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('view');
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authCallback, setAuthCallback] = useState(null);
  const [categories, setCategories] = useState(fallbackCategories);
  const [usingFallback, setUsingFallback] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
  console.log('🏪 PolicyStorePage mounted');
  console.log('📍 Current URL:', window.location.pathname);
  console.log('🌐 API Base URL:', import.meta.env.VITE_API_BASE_URL);
}, []);

  // Fetch store policies from database
  useEffect(() => {
    const fetchStorePolicies = async () => {
      try {
        setLoading(true);
        console.log('🔍 Fetching store policies from database...');
        
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/policies/store/policies`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const storePolicies = await response.json();
        console.log('📦 Raw store policies from database:', storePolicies);
        
        // Convert database data to frontend format
        const formattedPolicies = storePolicies.map(policy => ({
  id: policy.policyId,
  typeId: policy.policyId,
  name: policy.name,
  description: policy.description,
  detailedDescription: policy.detailedDescription,  // ✅ ADD THIS LINE
  category: policy.category,
  defaultCoverageAmount: policy.defaultCoverageAmount,
  defaultPremium: policy.defaultPremium,
  defaultFrequency: policy.defaultFrequency,
  protections: policy.protections || [],
  legalTerms: policy.legalTerms || [],  // ✅ ADD THIS LINE TOO
  eligibility: policy.eligibility || '',  // ✅ ADD THIS LINE TOO
  exclusions: policy.exclusions || '',   // ✅ ADD THIS LINE TOO
  coverage: policy.coverage || {},       // ✅ ADD THIS LINE TOO
  provider: 'AIA',
  isActive: policy.isActive,
  createdDate: policy.createdAt,
  lastModified: policy.updatedAt
}));
        
        setPolicies(formattedPolicies);
        setFilteredPolicies(formattedPolicies);
        setUsingFallback(false);
        
      } catch (error) {
        console.error('❌ Failed to fetch store policies:', error);
        // Use empty array instead of config fallback for now
        setPolicies([]);
        setFilteredPolicies([]);
        setUsingFallback(true);
        alert('Failed to load policies from database. Please check your backend connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchStorePolicies();
  }, []);

  // Filter policies based on category and search
  useEffect(() => {
    let filtered = [...policies];

    if (selectedCategory !== 'ALL') {
      filtered = policies.filter(policy => policy.category === selectedCategory);
    }

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(policy =>
        (policy.name && policy.name.toLowerCase().includes(searchLower)) ||
        (policy.description && policy.description.toLowerCase().includes(searchLower)) ||
        (policy.typeId && policy.typeId.toLowerCase().includes(searchLower)) ||
        (policy.id && policy.id.toLowerCase().includes(searchLower))
      );
    }

    setFilteredPolicies(filtered);
  }, [policies, selectedCategory, searchTerm]);

  const authenticateAdmin = () => {
    return new Promise((resolve) => {
      setAuthCallback(() => resolve);
      setShowAuthModal(true);
    });
  };

  const handleAuthentication = (isValid) => {
    if (authCallback) {
      authCallback(isValid);
      setAuthCallback(null);
    }
    setShowAuthModal(false);
  };

  const handleViewPolicy = (policy) => {
    setSelectedPolicy(policy);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleAddPolicy = async () => {
    const isAuthenticated = await authenticateAdmin();
    if (isAuthenticated) {
      setSelectedPolicy(null);
      setModalMode('add');
      setIsModalOpen(true);
    } else {
      alert('Authentication failed. Cannot add new policy.');
    }
  };

  const handleEditPolicy = (policy) => {
    setSelectedPolicy(policy);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const getNextPolicyId = () => {
    const existingIds = policies.map(p => p.id);
    let counter = 1;
    let newId;
    
    do {
      newId = `PT${String(counter).padStart(3, '0')}`;
      counter++;
    } while (existingIds.includes(newId));
    
    return newId;
  };

  const handleSavePolicy = async (policyData) => {
    if (modalMode === 'add') {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/policies/store/policies`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: policyData.name,
            category: policyData.category || 'Life Insurance',
            description: policyData.description || '',
            detailedDescription: policyData.detailedDescription,  // ✅ ADD THIS
  coverage: policyData.coverage,                        // ✅ ADD THIS
  legalTerms: policyData.legalTerms,                   // ✅ ADD THIS
  eligibility: policyData.eligibility,                 // ✅ ADD THIS
  exclusions: policyData.exclusions, 
            defaultCoverageAmount: policyData.defaultCoverageAmount || 0,
            defaultPremium: policyData.defaultPremium || 0,
            defaultFrequency: policyData.defaultFrequency || 'Annually',
            protections: policyData.protections || []
          }),
        });

        if (response.ok) {
          // Refresh the policies list
          const refreshResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/policies/store/policies`);
          const updatedPolicies = await refreshResponse.json();
          
          const formattedPolicies = updatedPolicies.map(policy => ({
            id: policy.policyId,
            typeId: policy.policyId,
            name: policy.name,
            description: policy.description,
            detailedDescription: policy.detailedDescription, 
            category: policy.category,
            defaultCoverageAmount: policy.defaultCoverageAmount,
            defaultPremium: policy.defaultPremium,
            defaultFrequency: policy.defaultFrequency,
            protections: policy.protections || [],
            legalTerms: policy.legalTerms || [],  // ✅ ADD THIS LINE TOO
  eligibility: policy.eligibility || '',  // ✅ ADD THIS LINE TOO
  exclusions: policy.exclusions || '',   // ✅ ADD THIS LINE TOO
  coverage: policy.coverage || {},    
            provider: 'AIA',
            isActive: policy.isActive,
            createdDate: policy.createdAt,
            lastModified: policy.updatedAt
          }));
          
          setPolicies(formattedPolicies);
          setFilteredPolicies(formattedPolicies);
          alert('Policy added successfully!');
        } else {
          alert('Failed to add policy to server');
        }
      } catch (error) {
        console.error('Error adding policy:', error);
        alert('Error adding policy');
      }
    } else if (modalMode === 'edit') {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/policies/store/policies/${selectedPolicy.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: policyData.name,
            category: policyData.category,
            description: policyData.description,
            detailedDescription: policyData.detailedDescription,  // ✅ ADD THIS
  coverage: policyData.coverage,                        // ✅ ADD THIS
  legalTerms: policyData.legalTerms,                   // ✅ ADD THIS
  eligibility: policyData.eligibility,                 // ✅ ADD THIS
  exclusions: policyData.exclusions, 
            defaultCoverageAmount: policyData.defaultCoverageAmount,
            defaultPremium: policyData.defaultPremium,
            defaultFrequency: policyData.defaultFrequency,
            protections: policyData.protections
          }),
        });

        if (response.ok) {
          // Refresh the policies list
          const refreshResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/policies/store/policies`);
          const updatedPolicies = await refreshResponse.json();
          
          const formattedPolicies = updatedPolicies.map(policy => ({
            id: policy.policyId,
            typeId: policy.policyId,
            name: policy.name,
            description: policy.description,
            detailedDescription: policy.detailedDescription, 
            category: policy.category,
            defaultCoverageAmount: policy.defaultCoverageAmount,
            defaultPremium: policy.defaultPremium,
            defaultFrequency: policy.defaultFrequency,
            protections: policy.protections || [],
            legalTerms: policy.legalTerms || [],  // ✅ ADD THIS LINE TOO
  eligibility: policy.eligibility || '',  // ✅ ADD THIS LINE TOO
  exclusions: policy.exclusions || '',   // ✅ ADD THIS LINE TOO
  coverage: policy.coverage || {},    
            provider: 'AIA',
            isActive: policy.isActive,
            createdDate: policy.createdAt,
            lastModified: policy.updatedAt
          }));
          
          setPolicies(formattedPolicies);
          setFilteredPolicies(formattedPolicies);
          alert('Policy updated successfully!');
        } else {
          alert('Failed to update policy on server');
        }
      } catch (error) {
        console.error('Error updating policy:', error);
        alert('Error updating policy');
      }
    }
    setIsModalOpen(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPolicy(null);
  };

  const handleDeletePolicy = async (policyId) => {
    if (window.confirm('Are you sure you want to delete this policy? This action cannot be undone.')) {
      const isAuthenticated = await authenticateAdmin();
      if (isAuthenticated) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/policies/store/policies/${policyId}`, {
            method: 'DELETE',
          });
          
          if (response.ok) {
            setPolicies(prev => prev.filter(policy => policy.id !== policyId));
            setFilteredPolicies(prev => prev.filter(policy => policy.id !== policyId));
            alert('Policy deleted successfully');
          } else {
            alert('Failed to delete policy from server');
          }
        } catch (error) {
          console.error('Error deleting policy:', error);
          alert('Error deleting policy');
        }
      } else {
        alert('Authentication failed. Policy not deleted.');
      }
    }
  };

  const getCategoryCount = (category) => {
    if (category === 'ALL') return policies.length;
    return policies.filter(policy => policy.category === category).length;
  };

  if (loading) {
    return (
      <div className="policy-store-loading">
        <div className="loading-spinner"></div>
        <p>Loading Policy Store...</p>
      </div>
    );
  }

  return (
    <div className="policy-store-page">
      <div className="policy-store-header">
        <div className="header-content">
          <h1>Policy Store</h1>
          <p>Comprehensive catalog of available insurance policies</p>
          {usingFallback && (
            <div style={{ color: '#d73527', fontSize: '14px', marginTop: '8px' }}>
              ⚠️ Database connection failed. Please check your backend.
            </div>
          )}
        </div>
        <button className="add-policy-btn" onClick={handleAddPolicy}>
          <span className="btn-icon">+</span>
          Add New Policy
        </button>
      </div>

      <div className="policy-store-controls">
        <div className="search-section">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search policies by name, description, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
        </div>

        <div className="category-filters">
          <button
            className={`category-btn ${selectedCategory === 'ALL' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('ALL')}
          >
            All Policies ({getCategoryCount('ALL')})
          </button>
          {Object.values(categories).map(category => (
            <button
              key={category}
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category} ({getCategoryCount(category)})
            </button>
          ))}
        </div>
      </div>

      <div className="policies-summary">
        <div className="summary-stats">
          <div className="stat-card">
            <h3>{policies.length}</h3>
            <p>Total Policies</p>
          </div>
          <div className="stat-card">
            <h3>{Object.keys(categories).length}</h3>
            <p>Categories</p>
          </div>
          <div className="stat-card">
            <h3>{policies.filter(p => p.isActive !== false).length}</h3>
            <p>Active Policies</p>
          </div>
        </div>
      </div>

      <div className="policies-grid">
        {filteredPolicies.length === 0 ? (
          <div className="no-policies">
            <div className="no-policies-icon">📋</div>
            <h3>No policies found</h3>
            <p>Try adjusting your search criteria or add a new policy</p>
          </div>
        ) : (
          filteredPolicies.map(policy => (
            <div key={policy.id} className="policy-card">
              <div className="policy-card-header">
                <div className="policy-type-badge">
                  {policy.typeId}
                </div>
                <div className="policy-category">
                  {policy.category}
                </div>
              </div>

              <div className="policy-card-content">
                <h3 className="policy-name">{policy.name}</h3>
                <p className="policy-description">{policy.description}</p>

                <div className="policy-coverage-info">
                  <div className="coverage-item">
                    <span className="coverage-label">Default Coverage:</span>
                    <span className="coverage-value">
                      ${policy.defaultCoverageAmount?.toLocaleString() || 'N/A'}
                    </span>
                  </div>
                  <div className="coverage-item">
                    <span className="coverage-label">Default Premium:</span>
                    <span className="coverage-value">
                      ${policy.defaultPremium?.toLocaleString() || 'N/A'}
                    </span>
                  </div>
                  <div className="coverage-item">
                    <span className="coverage-label">Frequency:</span>
                    <span className="coverage-value">
                      {policy.defaultFrequency || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="policy-protections">
                  <h4>Key Protections:</h4>
                  <ul>
                    {policy.protections?.slice(0, 3).map((protection, index) => (
                      <li key={index}>{protection}</li>
                    ))}
                    {policy.protections?.length > 3 && (
                      <li className="more-protections">
                        +{policy.protections.length - 3} more protections
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="policy-card-actions">
                <button 
                  className="action-btn view-btn"
                  onClick={() => handleViewPolicy(policy)}
                >
                  View Details
                </button>
                <button 
                  className="action-btn edit-btn"
                  onClick={() => handleEditPolicy(policy)}
                >
                  Edit
                </button>
                <button 
                  className="action-btn delete-btn"
                  onClick={() => handleDeletePolicy(policy.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <PolicyStoreModal
          policy={selectedPolicy}
          mode={modalMode}
          onSave={handleSavePolicy}
          onClose={handleCloseModal}
        />
      )}
      
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          if (authCallback) {
            authCallback(false);
            setAuthCallback(null);
          }
        }}
        onAuthenticate={handleAuthentication}
      />
    </div>
  );
};

export default PolicyStorePage;