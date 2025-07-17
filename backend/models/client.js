const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const Client = sequelize.define('Client', {
  clientId: {
    type: DataTypes.STRING,
    unique: true
  },
  fullName: DataTypes.STRING,
  email: DataTypes.STRING,
  phone: DataTypes.STRING,
  dob: DataTypes.DATE,
  address: DataTypes.STRING,
  gender: DataTypes.STRING,
  maritalStatus: DataTypes.STRING,
  nric: DataTypes.STRING,
  paymentFrequency: DataTypes.STRING,
  occupation: DataTypes.STRING,
  annualIncome: DataTypes.FLOAT
}, {
  timestamps: false
});

module.exports = Client;
