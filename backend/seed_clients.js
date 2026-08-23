const { sequelize, Client, User } = require('./models');

// First create the advisor if not exists
const advisor = {
  username: 'Admin',
  fullName: 'Admin123',
  email: 'admin@example.com',
  password: 'adminpassword',
  status: 'Admin'
};

const sampleClients = [
  {
    clientId: "C001",
    fullName: "Alex Goh Wei Jie",
    nric: "S7022918E",
    email: "alex.goh.wei.jie@gmail.com",
    maritalStatus: "Single", // Fixed field name to match the model
    phone: "+65 82429098",
    dob: "1971-04-29",
    gender: "Male",
    occupation: "Bank Manager",
    incomeBracket: "100k-150k",
    annualIncome: 120000,
    paymentFrequency: "monthly",
    riskProfile: "Balanced",
    advisorId: 1, // Assuming admin user has ID 1
    notes: "Client specifically requested higher whole life coverage due to recent promotion. Mentioned concerns about market volatility affecting retirement planning. Has requested quarterly policy reviews due to changing income structure with bonuses.",
    lastContactedAt: new Date()
  },
  {
    clientId: "C002",
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
    advisorId: 1,
    notes: "Client has irregular income from freelance work in addition to salary. Requested flexible premium payment options. Expressed interest in increasing child education coverage when next bonus is received. Prefers email communication over phone calls.",
    lastContactedAt: new Date()
  }
  // ... you can add more clients following this pattern
];

async function seedClients() {
  try {
    // Make sure we have a fresh connection
    await sequelize.authenticate();
    
    // Sync database
    await sequelize.sync({ force: false });

    // Create advisor first
    const [createdAdvisor] = await User.findOrCreate({
      where: { email: advisor.email },
      defaults: advisor
    });

    console.log('✅ Advisor created successfully with ID:', createdAdvisor.id);

    await Client.destroy({ where: {} });

    // Map clients to use the created advisor's ID
    const clientsToCreate = sampleClients.map(client => ({
      ...client,
      advisorId: createdAdvisor.id,
    }));

    // Insert new clients
    await Client.bulkCreate(clientsToCreate);

    console.log('✅ Sample clients have been inserted!');
  } catch (error) {
    console.error('❌ Error seeding clients:', error);
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

seedClients();
