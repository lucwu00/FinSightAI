CREATE TABLE IF NOT EXISTS PolicyStore (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  policyId TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  detailedDescription TEXT,
  defaultCoverageAmount REAL,
  defaultPremium REAL,
  defaultFrequency TEXT,
  protections TEXT,
  legalTerms TEXT,
  coverage TEXT,
  eligibility TEXT,
  exclusions TEXT,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS PolicyCategories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  categoryKey TEXT UNIQUE NOT NULL,
  categoryName TEXT NOT NULL,
  description TEXT,
  createdAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS PolicyProviders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  providerName TEXT UNIQUE NOT NULL,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO PolicyCategories (categoryKey, categoryName, description) VALUES
('LIFE', 'Life Insurance', 'Life insurance policies providing death benefits and savings'),
('HEALTH', 'Health Insurance', 'Health and medical insurance policies'),
('PROPERTY', 'Property Insurance', 'Insurance for property and assets'),
('SPECIALTY', 'Specialty Insurance', 'Specialized insurance products');

INSERT OR IGNORE INTO PolicyProviders (providerName) VALUES
('AIA'),
('Prudential'),
('Great Eastern'),
('NTUC Income'),
('Manulife'),
('AXA');

CREATE INDEX IF NOT EXISTS idx_policy_store_category ON PolicyStore(category);
CREATE INDEX IF NOT EXISTS idx_policy_store_active ON PolicyStore(isActive);
CREATE INDEX IF NOT EXISTS idx_policy_store_policyId ON PolicyStore(policyId);