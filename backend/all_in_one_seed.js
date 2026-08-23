// all_in_one_seed.js - creates tables + seeds data in one go
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'data', 'database.sqlite');
fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
console.log('Using database at:', dbPath);

const db = new Database(dbPath);
db.pragma('foreign_keys = OFF');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(255) NOT NULL UNIQUE,
    fullName VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    status VARCHAR(255) DEFAULT 'User',
    layoutPreferences TEXT,
    lastLogin DATETIME,
    createdAt DATETIME,
    updatedAt DATETIME,
    profilePicture TEXT
  );
  CREATE TABLE IF NOT EXISTS clients (
    clientId VARCHAR(255) NOT NULL PRIMARY KEY,
    fullName VARCHAR(255) NOT NULL,
    nric VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(255) NOT NULL,
    dob DATETIME NOT NULL,
    gender VARCHAR(255) NOT NULL,
    maritalStatus VARCHAR(255),
    occupation VARCHAR(255) NOT NULL,
    incomeBracket VARCHAR(255),
    annualIncome FLOAT NOT NULL,
    paymentFrequency VARCHAR(255) NOT NULL,
    riskProfile VARCHAR(255),
    advisorId INTEGER NOT NULL,
    notes TEXT,
    lastContactedAt DATETIME
  );
  CREATE TABLE IF NOT EXISTS policies (
    policyId VARCHAR(255) PRIMARY KEY,
    clientId VARCHAR(255) NOT NULL,
    fullName VARCHAR(255) NOT NULL,
    policyName VARCHAR(255) NOT NULL,
    productType VARCHAR(255) NOT NULL,
    fundTypeILP VARCHAR(255),
    coverageAmount DECIMAL(12,2) NOT NULL,
    premiumFrequency VARCHAR(255) NOT NULL,
    startDate DATE NOT NULL,
    endDate DATE NOT NULL,
    premium DECIMAL(10,2) NOT NULL,
    policyTypeId VARCHAR(255) NOT NULL,
    provider VARCHAR(255) NOT NULL,
    status VARCHAR(255) NOT NULL DEFAULT 'Active',
    recommended TINYINT(1) NOT NULL DEFAULT 0,
    notes TEXT,
    advisorId INTEGER NOT NULL
  );
`);
console.log('Tables ready');

try {
  let user = db.prepare("SELECT id FROM users LIMIT 1").get();
  if (!user) {
    db.prepare("INSERT INTO users (username,fullName,email,password,status,createdAt,updatedAt) VALUES ('Admin','Admin','admin@example.com','adminpassword','Admin',datetime('now'),datetime('now'))").run();
    user = db.prepare("SELECT id FROM users LIMIT 1").get();
    console.log('Created user ID:', user.id);
  } else {
    console.log('Found user ID:', user.id);
  }
  const aid = user.id;

  db.prepare("DELETE FROM clients").run();
  db.prepare("INSERT INTO clients (clientId,fullName,nric,email,phone,dob,gender,maritalStatus,occupation,incomeBracket,annualIncome,paymentFrequency,riskProfile,advisorId,notes,lastContactedAt) VALUES ('C001','Alex Goh Wei Jie','S7022918E','alex.goh@gmail.com','+65 82429098','1971-04-29 00:00:00','Male','Single','Bank Manager','100k-150k',120000,'monthly','Balanced'," + aid + ",'Senior client','2026-01-01'),('C002','Amanda Tan Wei Ling','S7186935D','amanda.tan@gmail.com','+65 89767312','1997-06-10 00:00:00','Female','Married','Marketing Director','60k-100k',98000,'quarterly','Aggressive'," + aid + ",'Sample client','2026-01-01')").run();
  console.log('Clients inserted');

  db.prepare("DELETE FROM policies").run();
  const ins = db.prepare("INSERT INTO policies (policyId,clientId,fullName,policyName,productType,fundTypeILP,coverageAmount,premiumFrequency,startDate,endDate,premium,policyTypeId,provider,status,recommended,advisorId) VALUES (@policyId,@clientId,@fullName,@policyName,@productType,@fundTypeILP,@coverageAmount,@premiumFrequency,@startDate,@endDate,@premium,@policyTypeId,@provider,@status,@recommended,@advisorId)");
  const policies = [
    {policyId:'C001-PT001',clientId:'C001',fullName:'Alex Goh Wei Jie',policyName:'Whole Life',productType:'Whole Life',fundTypeILP:null,coverageAmount:750000,premiumFrequency:'Monthly',startDate:'2020-03-15',endDate:'2080-03-15',premium:850,policyTypeId:'PT001',provider:'AIA',status:'Active',recommended:1,advisorId:aid},
    {policyId:'C001-PT007',clientId:'C001',fullName:'Alex Goh Wei Jie',policyName:'Long-Term Care',productType:'Long-Term Care',fundTypeILP:null,coverageAmount:200000,premiumFrequency:'Quarterly',startDate:'2022-06-01',endDate:'2072-06-01',premium:320,policyTypeId:'PT007',provider:'AIA',status:'Active',recommended:1,advisorId:aid},
    {policyId:'C001-PT004',clientId:'C001',fullName:'Alex Goh Wei Jie',policyName:'Endowment',productType:'Endowment',fundTypeILP:null,coverageAmount:500000,premiumFrequency:'Monthly',startDate:'2020-07-01',endDate:'2025-09-01',premium:1250,policyTypeId:'PT004',provider:'AIA',status:'Active',recommended:1,advisorId:aid},
    {policyId:'C001-PT003',clientId:'C001',fullName:'Alex Goh Wei Jie',policyName:'Investment-Linked',productType:'Investment-Linked',fundTypeILP:'Growth',coverageAmount:300000,premiumFrequency:'Monthly',startDate:'2021-01-01',endDate:'2031-01-01',premium:680,policyTypeId:'PT003',provider:'AIA',status:'Active',recommended:1,advisorId:aid},
    {policyId:'C001-PT009',clientId:'C001',fullName:'Alex Goh Wei Jie',policyName:'Critical Illness',productType:'Critical Illness',fundTypeILP:null,coverageAmount:400000,premiumFrequency:'Monthly',startDate:'2021-03-01',endDate:'2051-03-01',premium:520,policyTypeId:'PT009',provider:'AIA',status:'Active',recommended:1,advisorId:aid},
    {policyId:'C001-PT006',clientId:'C001',fullName:'Alex Goh Wei Jie',policyName:'Personal Accident',productType:'Personal Accident',fundTypeILP:null,coverageAmount:300000,premiumFrequency:'Annually',startDate:'2021-06-01',endDate:'2031-06-01',premium:240,policyTypeId:'PT006',provider:'AIA',status:'Active',recommended:1,advisorId:aid},
    {policyId:'C002-PT002',clientId:'C002',fullName:'Amanda Tan Wei Ling',policyName:'Term Life',productType:'Term Life',fundTypeILP:null,coverageAmount:500000,premiumFrequency:'Monthly',startDate:'2020-01-01',endDate:'2040-01-01',premium:350,policyTypeId:'PT002',provider:'AIA',status:'Active',recommended:1,advisorId:aid},
    {policyId:'C002-PT004',clientId:'C002',fullName:'Amanda Tan Wei Ling',policyName:'Endowment',productType:'Endowment',fundTypeILP:null,coverageAmount:150000,premiumFrequency:'Monthly',startDate:'2023-01-01',endDate:'2028-01-01',premium:380,policyTypeId:'PT004',provider:'AIA',status:'Active',recommended:1,advisorId:aid},
    {policyId:'C002-PT006',clientId:'C002',fullName:'Amanda Tan Wei Ling',policyName:'Personal Accident',productType:'Personal Accident',fundTypeILP:null,coverageAmount:500000,premiumFrequency:'Annually',startDate:'2023-07-01',endDate:'2028-07-01',premium:240,policyTypeId:'PT006',provider:'AIA',status:'Active',recommended:1,advisorId:aid},
    {policyId:'C002-PT009',clientId:'C002',fullName:'Amanda Tan Wei Ling',policyName:'Critical Illness',productType:'Critical Illness',fundTypeILP:null,coverageAmount:200000,premiumFrequency:'Quarterly',startDate:'2022-01-01',endDate:'2032-01-01',premium:185,policyTypeId:'PT009',provider:'AIA',status:'Active',recommended:1,advisorId:aid},
  ];
  db.transaction((list) => { for (const p of list) ins.run(p); })(policies);
  console.log('Policies inserted:', policies.length);
} catch (err) {
  console.error('Error:', err.message);
}

db.pragma('foreign_keys = ON');
db.close();
console.log('Done! Search C001 or C002 in the browser.');