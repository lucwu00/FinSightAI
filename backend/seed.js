const sequelize = require('./sequelize');
const Client  = require('./models/client');
const Policy  = require('./models/policy');

const clients  = require('./data/clients.json');
const policies = require('./data/policies.json');

;(async () => {
  try {
    // Drop & recreate tables
    await sequelize.sync({ force: true });

    // Bulk-insert your JSON data
    await Client.bulkCreate(clients);
    await Policy.bulkCreate(policies);

    console.log('✅ SQLite database seeded successfully.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
})();
