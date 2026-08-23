const { sequelize, Client, User, Policy } = require('./models');

// Admin/Advisor data
const advisor = {
  username: 'Admin',
  fullName: 'Admin123',
  email: 'admin@example.com',
  password: 'adminpassword',
  status: 'Admin'
};

// Sample clients data
const sampleClients = [
  {
    fullName: "Alex Goh Wei Jie",
    nric: "S7022918E",
    email: "alex.goh.wei.jie@gmail.com",
    maritalStatus: "Single",
    phone: "+65 82429098",
    dob: "1971-04-29",
    gender: "Female",
    occupation: "Bank Manager",
    incomeBracket: "100k-150k",
    annualIncome: 120000,
    paymentFrequency: "monthly",
    riskProfile: "Balanced",
    notes: "Initial client from seed data",
    lastContactedAt: new Date()
  },
  {
    fullName: "Amanda Tan Wei Ling",
    nric: "S7186935D",
    email: "amanda.tan.wei.ling@gmail.com",
    maritalStatus: "Married",
    phone: "+65 89767312",
    dob: "1997-06-10",
    gender: "Female",
    occupation: "Marketing Director",
    incomeBracket: "60k-100k",
    annualIncome: 98000,
    paymentFrequency: "quarterly",
    riskProfile: "Aggressive",
    notes: "Initial client from seed data",
    lastContactedAt: new Date()
  }
];

// Sample policies data
const samplePolicies = [
  {
    policyName: "Whole Life Protection Plus",
    productType: "Life",
    provider: "AIA",
    startDate: "2024-01-01",
    endDate: "2054-01-01",
    premium: 1200.00,
    status: "Active",
    recommended: true,
    notes: "Comprehensive life coverage with investment component",
    clientId: 2
  },
  {
    policyName: "Critical Illness Guard",
    productType: "Health",
    provider: "Prudential",
    startDate: "2024-02-15",
    endDate: "2034-02-15",
    premium: 150.00,
    status: "Active",
    recommended: true,
    notes: "Critical illness coverage with early stage protection",
    clientId: 1
  },
  {
    policyName: "Investment Growth Fund",
    productType: "Investment",
    provider: "AXA",
    startDate: "2024-03-01",
    endDate: "2044-03-01",
    premium: 500.00,
    status: "Active",
    recommended: false,
    notes: "Balanced portfolio with medium risk profile",
    clientId: 1
  },
  {
    policyName: "Personal Accident Shield",
    productType: "Accident",
    provider: "Great Eastern",
    startDate: "2024-01-15",
    endDate: "2025-01-15",
    premium: 80.00,
    status: "Active",
    recommended: true,
    notes: "Comprehensive accident coverage",
    clientId: 2
  },
  {
    policyName: "Hospital Income Protect",
    productType: "Health",
    provider: "NTUC Income",
    startDate: "2024-04-01",
    endDate: "2034-04-01",
    premium: 95.00,
    status: "Active",
    recommended: false,
    notes: "Daily hospital income benefit",
    clientId: 1
  },
  {
    policyName: "Retirement Income Plus",
    productType: "Investment",
    provider: "Manulife",
    startDate: "2024-05-01",
    endDate: "2044-05-01",
    premium: 800.00,
    status: "Active",
    recommended: true,
    notes: "Retirement planning with guaranteed income",
    clientId: 1
  },
  {
    policyName: "Education Savings Plan",
    productType: "Education",
    provider: "AIA",
    startDate: "2024-06-01",
    endDate: "2042-06-01",
    premium: 350.00,
    status: "Active",
    recommended: true,
    notes: "Education savings with guaranteed payout",
    clientId: 2
  },
  {
    policyName: "Travel Insurance Premium",
    productType: "Travel",
    provider: "AXA",
    startDate: "2024-07-01",
    endDate: "2025-07-01",
    premium: 120.00,
    status: "Active",
    recommended: false,
    notes: "Annual travel insurance coverage",
    clientId: 2
  }
];

async function seedDatabase() {
  try {
    // Make sure we have a fresh connection
    await sequelize.authenticate();
    
    // Sync database
    await sequelize.sync({ force: false });

    console.log('Starting seeding process...');

    // Step 1: Create advisor/admin
    const [createdAdvisor] = await User.findOrCreate({
      where: { email: advisor.email },
      defaults: advisor
    });
    console.log('✅ Advisor created successfully with ID:', createdAdvisor.id);

    // Step 2: Clear existing clients and create new ones
    await Client.destroy({ where: {} });
    const createdClients = await Client.bulkCreate(
      sampleClients.map(client => ({
        ...client,
        advisorId: createdAdvisor.id
      }))
    );
    console.log('✅ Sample clients have been inserted!');

    // Step 3: Clear existing policies and create new ones
    await Policy.destroy({ where: {} });
    await Policy.bulkCreate(
      samplePolicies.map(policy => ({
        ...policy,
        advisorId: createdAdvisor.id
      }))
    );
    console.log('✅ Sample policies have been inserted!');

    console.log('✅ Database seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    if (error.parent) {
      console.error('Detailed error:', error.parent);
    }
  } finally {
    try {
      await sequelize.close();
    } catch (closeError) {
      console.error('Error closing database connection:', closeError);
    }
    process.exit();
  }
}

// Run the seed function
seedDatabase();
