const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const Policy = sequelize.define('Policy', {
  clientName: DataTypes.STRING,
  clientId: DataTypes.STRING,
  policyId: {
    type: DataTypes.STRING,
    unique: true
  },
  productType: DataTypes.STRING,
  policyTypeId: DataTypes.STRING,
  coverageAmount: DataTypes.FLOAT,
  premiumAmount: DataTypes.FLOAT,
  premiumFrequency: DataTypes.STRING,
  fundTypeILP: DataTypes.STRING,
  startDate: DataTypes.DATE,
  endDate: DataTypes.DATE,
  status: DataTypes.STRING,
  occupation: DataTypes.STRING,
  annualIncome: DataTypes.FLOAT
}, {
  timestamps: false
});

module.exports = Policy;
