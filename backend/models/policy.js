const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  clientName: String,
  clientId: String,
  policyId: String,
  productType: String,
  policyTypeId: String,
  coverageAmount: Number,
  premiumAmount: String,
  premiumFrequency : String,
  fundTypeILP: String,
  startDate: Date,
  endDate: Date,
  status: String, 
  occupation : String,
  annualIncome: Number,
});

module.exports = mongoose.model('Policy', policySchema);
