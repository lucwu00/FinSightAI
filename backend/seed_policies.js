const { sequelize, Policy, User, Client } = require('./models');

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

const samplePolicies = [
  // Alex Goh Wei Jie (C001) - Bank Manager, $120k annual income
  {
    clientId: "C001",
    fullName: "Alex Goh Wei Jie",
    policyId: "C001-PT001",
    policyName: "Whole Life",
    productType: "Whole Life",
    coverageAmount: 750000, // 6x annual income
    premiumFrequency: "Monthly",
    premium: 850.00, // Monthly premium for whole life
    startDate: "2020-03-15",
    endDate: "2080-03-15", // Whole life until age 80
    status: "Active",
    provider: 'AIA',
    advisorId: 1
  },
  {
    clientId: "C001",
    fullName: "Alex Goh Wei Jie", 
    policyId: "C001-PT011",
    policyName: "Travel",
    productType: "Travel",
    coverageAmount: 100000, // Travel insurance coverage
    premiumFrequency: "Annually",
    premium: 180.00, // Annual travel insurance
    startDate: "2024-01-01",
    endDate: "2024-12-31", // Annual travel policy
    status: "Active",
    provider: 'AIA',
    advisorId: 1
  },
  {
    clientId: "C001",
    fullName: "Alex Goh Wei Jie",
    policyId: "C001-PT007",
    policyName: "Long-Term Care",
    productType: "Long-Term Care",
    coverageAmount: 200000, // Long-term care coverage
    premiumFrequency: "Quarterly",
    premium: 320.00, // Quarterly premium
    startDate: "2022-06-01",
    endDate: "2072-06-01", // 50-year policy
    status: "Active",
    provider: 'AIA',
    advisorId: 1
  },
  {
    clientId: "C001",
    fullName: "Alex Goh Wei Jie",
    policyId: "C001-PT004",
    policyName: "Endowment",
    productType: "Endowment",
    coverageAmount: 500000, // Endowment maturity value
    premiumFrequency: "Monthly",
    premium: 1250.00, // Higher monthly premium for endowment
    startDate: "2020-07-01",
    endDate: "2025-09-01", // 5-year endowment (recently matured)
    status: "Expiring Soon",
    provider: 'AIA',
    advisorId: 1
  },
  {
    clientId: "C001",
    fullName: "Alex Goh Wei Jie",
    policyId: "C001-PT014",
    policyName: "Universal Life",
    productType: "Universal Life",
    coverageAmount: 600000, // Universal life coverage
    premiumFrequency: "Monthly",
    premium: 420.00, // Flexible premium
    startDate: "2020-02-15",
    endDate: "2025-02-15", // 5-year term (expired)
    status: "Expired",
    provider: 'AIA',
    advisorId: 1
  },
  {
    clientId: "C001",
    fullName: "Alex Goh Wei Jie",
    policyId: "C001-PT003",
    policyName: "Investment-Linked",
    productType: "Investment-Linked",
    fundTypeILP: "Growth",
    coverageAmount: 300000, // ILP coverage
    premiumFrequency: "Monthly",
    premium: 680.00, // Monthly ILP premium
    startDate: "2021-01-01",
    endDate: "2031-01-01", // 10-year ILP
    status: "Active",
    provider: 'AIA',
    advisorId: 1
  },

  // Amanda Tan Wei Ling (C002) - Marketing Executive, moderate income
  {
    clientId: "C002",
    fullName: "Amanda Tan Wei Ling",
    policyId: "C002-PT003",
    policyName: "Investment-Linked",
    productType: "Investment-Linked",
    fundTypeILP: "Income",
    coverageAmount: 250000, // Moderate ILP coverage
    premiumFrequency: "Monthly",
    premium: 450.00, // Monthly ILP premium
    startDate: "2020-04-01",
    endDate: "2023-04-01", // 3-year term (expired)
    status: "Expired",
    provider: 'AIA',
    advisorId: 1
  },
  {
    clientId: "C002",
    fullName: "Amanda Tan Wei Ling",
    policyId: "C002-PT004",
    policyName: "Endowment",
    productType: "Endowment",
    coverageAmount: 150000, // Smaller endowment
    premiumFrequency: "Monthly",
    premium: 380.00, // Monthly endowment premium
    startDate: "2023-01-01",
    endDate: "2028-01-01", // 5-year endowment
    status: "Active",
    provider: 'AIA',
    advisorId: 1
  },
  {
    clientId: "C002",
    fullName: "Amanda Tan Wei Ling",
    policyId: "C002-PT006",
    policyName: "Personal Accident",
    productType: "Personal Accident",
    coverageAmount: 500000, // Accident coverage
    premiumFrequency: "Annually",
    premium: 240.00, // Annual PA premium
    startDate: "2023-07-01",
    endDate: "2028-07-01", // 5-year PA policy
    status: "Active",
    provider: 'AIA',
    advisorId: 1
  },
  {
    clientId: "C002",
    fullName: "Amanda Tan Wei Ling",
    policyId: "C002-PT013",
    policyName: "Child Education",
    productType: "Child Education",
    coverageAmount: 100000, // Education fund
    premiumFrequency: "Monthly",
    premium: 280.00, // Monthly education savings
    startDate: "2022-03-01",
    endDate: "2040-03-01", 
    status: "Active",
    provider: 'AIA',
    advisorId: 1
  },
  {
    clientId: "C002",
    fullName: "Amanda Tan Wei Ling",
    policyId: "C002-PT009",
    policyName: "Critical Illness",
    productType: "Critical Illness",
    coverageAmount: 200000, // CI coverage
    premiumFrequency: "Quarterly",
    premium: 185.00, // Quarterly CI premium
    startDate: "2019-09-01",
    endDate: "2022-09-01", // 3-year term (expired)
    status: "Expired",
    provider: 'AIA',
    advisorId: 1
  },
  {
    clientId: "C002",
    fullName: "Amanda Tan Wei Ling",
    policyId: "C002-PT012",
    policyName: "Car",
    productType: "Car",
    coverageAmount: 80000, // Car value coverage
    premiumFrequency: "Annually",
    premium: 1200.00, // Annual car insurance
    startDate: "2022-09-15",
    endDate: "2025-09-15", // Annual car insurance
    status: "Expired",
    provider: 'AIA',
    advisorId: 1
  }
];

const enrichedPolicies = samplePolicies.map(p => ({
  ...p,
  policyTypeId: policyTypeMap[p.productType] || null,
  policyName: p.policyName, // Keep the specific plan names
  fundTypeILP: p.productType === "Investment-Linked" ? p.fundTypeILP || null : null,
  recommended: true // Changed to true (Yes) for all policies
}));

async function seedPolicies() {
  try {
    // Sync database
    await sequelize.sync({ force: false });

    // Delete existing policies
    await Policy.destroy({ where: {} });

    // Insert new policies
    await Policy.bulkCreate(enrichedPolicies);

    console.log('✅ Sample policies have been inserted successfully!');
  } catch (error) {
    console.error('❌ Error seeding policies:', error);
  } finally {
    process.exit();
  }
}

// Run the seed function
seedPolicies();