const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  clientId: String,
  fullName: String,
  email: String,
  phone: String,
  dob: Date,
  address: String,
  gender: String,
  maritalStatus: String,
  nric: String,
  paymentFrequency: String,
  occupation: String,            
  annualIncome: Number    
});

module.exports = mongoose.model('Client', clientSchema);
