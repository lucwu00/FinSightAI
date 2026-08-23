const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './data/database.sqlite', // adjust if needed
  logging: false
});

(async () => {
  try {
    await sequelize.query(`
      ALTER TABLE policies ADD COLUMN fullName TEXT NOT NULL DEFAULT 'Unnamed';
    `);
    console.log("✅ Column 'fullName' added successfully.");
  } catch (error) {
    console.error("❌ Failed to add column:", error.message);
  } finally {
    await sequelize.close();
  }
})();
