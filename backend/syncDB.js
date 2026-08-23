const db = require('./models');

db.sequelize.sync({ force: true }).then(() => {
  console.log("✅ All models synced (tables dropped and recreated).");
  process.exit();
}).catch((error) => {
  console.error("❌ Error syncing models:", error);
  process.exit(1);
});
