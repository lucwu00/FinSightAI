const { Sequelize } = require('sequelize');

// Creates or connects to a file-based SQLite DB
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database/finsight.sqlite' // creates this file on first run
});

module.exports = sequelize;
