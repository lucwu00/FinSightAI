const { Sequelize } = require('sequelize');

// Create a Sequelize instance
const sequelize = new Sequelize({
  dialect: 'sqlite',                     // or 'mysql' / 'postgres'
  storage: './data/database.sqlite',     // adjust path if needed
  logging: false
});

module.exports = sequelize;
