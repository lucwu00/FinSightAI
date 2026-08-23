const stringSimilarity = require('string-similarity');
const path = require('path');
const { parseExcel, applyMapping, validateRow } = require('../utils/excelParser');
const { enrichData } = require('../utils/dataCleaner'); 
const { Policy, Client } = require('../models');
const db = require('../models'); 

exports.previewData = async (req, res) => {
  try {
    const { fileName, mappedFields } = req.body;
    console.log("📥 Received mappedFields:", req.body.mappedFields);
    
    const filePath = path.join(__dirname, '..', 'uploads', fileName);
    const rawRows = parseExcel(filePath);
    const cleanedRows = applyMapping(rawRows, mappedFields);
    
    const existingClients = await Client.findAll({
      attributes: ['clientId'],
      raw: true
    });
    const existingClientIds = existingClients.map(client => client.clientId);
    
    const enrichedRows = await enrichData(cleanedRows, existingClientIds);
    
    const warnings = [];
    enrichedRows.forEach((row, index) => {
      const rowWarnings = validateRow(row);
      rowWarnings.forEach(w => {
        warnings.push({ row: index, ...w });
      });
    });

    return res.json({ 
      rows: enrichedRows, 
      warnings 
    });
    
  } catch (err) {
    console.error('Preview generation error:', err);
    return res.status(500).json({ 
      error: 'Failed to enrich data',
      details: err.message 
    });
  }
};

exports.mapHeaders = async (req, res) => {
  const { headers } = req.body;

  const policyFields = Object.keys(Policy.rawAttributes);
  const clientFields = Object.keys(Client.rawAttributes);
  const availableFields = [...new Set([...policyFields, ...clientFields])];

  // Try AI first
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.development') });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are a data mapping assistant for an insurance CRM system.

Map each Excel column header to the most likely database field from this exact list:
${availableFields.join(', ')}

Key synonyms to know:
- "Customer Full Name", "Customer Name", "Client Name" → fullName
- "IC Number", "IC No", "ID No", "Identity Number" → nric
- "Email Address" → email
- "Mobile No.", "Mobile", "Phone Number", "Contact No.", "Handphone", "HP No." → phone
- "Insurance Plan", "Policy Type", "Product Name", "Plan" → policyName
- "Fund Category", "Fund Type", "ILP Fund" → fundTypeILP
- "Sum Assured", "Sum Assured ($)", "Coverage Amount", "Coverage", "SA" → coverageAmount
- "Monthly Premium", "Annual Premium", "Premium Amount" → premium
- "Payment Mode", "Payment Frequency", "Billing Mode" → premiumFrequency
- "Policy Start", "Commencement Date", "Start" → startDate
- "Policy Expiry", "Maturity Date", "Expiry Date", "End" → endDate
- "Insurer", "Insurance Company", "Company" → provider
- "Advised?", "Recommended?", "Advisor Recommended" → recommended
- "Branch Code", "Agent ID", "Client Tier", "Tier", "Last Review Date", "Region" → "" (no match, return empty string)

Rules:
- Only map to fields that exist in the provided list
- If genuinely no match exists, return empty string ""
- Return ONLY raw JSON with no markdown, no backticks, no explanation

Return this exact format:
{"mappings":{"Header1":{"suggested":"fieldName","confidence":0.95},"Header2":{"suggested":"","confidence":0.1}}}

Headers to map: ${JSON.stringify(headers)}`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    const forceMap = {
  'Mobile No.': 'phone',
  'Sum Assured ($)': 'coverageAmount', 
  'Advised?': 'recommended',
  'Client Tier': '',
  'Branch Code': '',
  'Agent ID': '',
  'Last Review Date': '',
};

for (const [header, field] of Object.entries(forceMap)) {
  if (parsed.mappings[header] !== undefined) {
    parsed.mappings[header] = { 
      suggested: field, 
      confidence: field ? 0.95 : 0.1 
    };
  }
}

    console.log('✅ AI mapped headers:', parsed.mappings);
    return res.json({ mappings: parsed.mappings, availableFields });

  } catch (err) {
    console.error('⚠️ AI mapping failed, falling back to string similarity:', err.message);
  }

  // Fallback: string similarity (original logic)
  const normalize = (str) => str.toLowerCase().replace(/[-_ ]/g, '').trim();

  const aliases = {
    customerfullname: 'fullName', fullname: 'fullName', clientname: 'fullName', name: 'fullName',
    icnumber: 'nric', icno: 'nric', idnumber: 'nric', nric: 'nric',
    emailaddress: 'email', email: 'email',
    mobileno: 'phone', mobile: 'phone', phonenumber: 'phone', phone: 'phone',
    insuranceplan: 'policyName', policytype: 'policyName', product: 'policyName', policyname: 'policyName',
    fundcategory: 'fundTypeILP', fundtype: 'fundTypeILP',
    sumassureds: 'coverageAmount', sumassured: 'coverageAmount', coverage: 'coverageAmount',
    monthlypremium: 'premium', premium: 'premium', annualpremium: 'premium',
    paymentmode: 'premiumFrequency', premiumfrequency: 'premiumFrequency', frequency: 'premiumFrequency',
    policystart: 'startDate', startdate: 'startDate', commencementdate: 'startDate',
    policyexpiry: 'endDate', expirydate: 'endDate', enddate: 'endDate', maturitydate: 'endDate',
    insurer: 'provider', provider: 'provider', company: 'provider',
    advised: 'recommended', recommended: 'recommended',
  };

  const mappings = {};
  headers.forEach((header) => {
    const normalizedHeader = normalize(header);
    if (aliases[normalizedHeader]) {
      mappings[header] = { suggested: aliases[normalizedHeader], confidence: 1.0 };
      return;
    }
    const normalizedFields = availableFields.map(f => normalize(f));
    const matches = stringSimilarity.findBestMatch(normalizedHeader, normalizedFields);
    const best = availableFields[matches.bestMatchIndex];
    const score = matches.bestMatch.rating;
    mappings[header] = { suggested: score >= 0.7 ? best : '', confidence: score };
  });

  return res.json({ mappings, availableFields });
};


exports.uploadFile = (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  return res.json({ fileName: req.file.filename });
};

exports.importApprovedData = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { approvedData } = req.body;
    console.log('🚀 Starting import process...');
    console.log('📦 Importing approved data:', approvedData?.length || 0, 'rows');
    console.log('📋 Sample row data:', approvedData?.[0]);

    if (!approvedData || !Array.isArray(approvedData)) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        error: 'No approved data provided or invalid format',
        expectedFormat: 'Array of objects with client and policy data'
      });
    }

    const importResults = {
      importedRows: [],
      importWarnings: [],
      skippedRows: []
    };

    let clientsCreated = 0;
    let policiesCreated = 0;

    for (let i = 0; i < approvedData.length; i++) {
      const row = approvedData[i];
      console.log(`\n📝 Processing row ${i + 1}/${approvedData.length}:`);
      console.log(`   Client: ${row.fullName} (${row.clientId})`);
      console.log(`   Policy: ${row.policyName} (${row.policyId})`);
      
      try {
        console.log(`   🔍 Finding/Creating client with NRIC: ${row.nric}`);
        
        const [client, clientCreated] = await Client.findOrCreate({
          where: { nric: row.nric },
          defaults: {
            clientId: row.clientId,
            fullName: row.fullName,
            email: row.email || `${row.clientId}@placeholder.com`,
            phone: row.phone || '+65 12345678',
            nric: row.nric,
            dob: row.dob || '1990-01-01',
            gender: row.gender || 'Male',
            maritalStatus: row.maritalStatus || 'Single',
            occupation: row.occupation || 'Professional',
            annualIncome: Number(row.annualIncome) || 50000,
            paymentFrequency: (row.paymentFrequency || 'monthly').toLowerCase(),
            riskProfile: row.riskProfile || 'Conservative',
            advisorId: Number(row.advisorId) || 1,
            notes: row.note || null
          },
          transaction
        });

        if (clientCreated) {
          clientsCreated++;
          console.log(`   ✅ Client created: ${client.clientId}`);
        } else {
          console.log(`   ⚠️ Client already exists, updating: ${client.clientId}`);
          await client.update({
            fullName: row.fullName,
            email: row.email || client.email,
            phone: row.phone || client.phone,
            advisorId: Number(row.advisorId) || client.advisorId
          }, { transaction });
        }

        const policyId = row.policyId || `${row.clientId}-${row.policyTypeId}`;
        console.log(`   🏛️ Creating policy: ${policyId}`);
        
        const existingPolicy = await Policy.findByPk(policyId, { transaction });
        
        if (existingPolicy) {
          console.log(`   ⚠️ Policy already exists, updating: ${policyId}`);
          await existingPolicy.update({
            fullName: row.fullName,
            policyName: row.policyName,
            productType: row.policyName, 
            policyTypeId: row.policyTypeId,
            fundTypeILP: row.fundTypeILP || null,
            provider: row.provider || 'AIA',
            coverageAmount: Number(row.coverageAmount) || 100000,
            premium: Number(row.premium) || 0,
            premiumFrequency: row.premiumFrequency || 'Monthly',
            startDate: row.startDate || new Date().toISOString().split('T')[0],
            endDate: row.endDate || '2030-12-31',
            status: row.status || 'Active',
            recommended: row.recommended === 'Yes' || row.recommended === true || row.recommended === 'true',
            notes: row.note || null,
            advisorId: Number(row.advisorId) || 1
          }, { transaction });
        } else {
          const policy = await Policy.create({
            policyId: policyId,
            clientId: row.clientId,
            fullName: row.fullName,
            policyName: row.policyName,
            productType: row.policyName, 
            policyTypeId: row.policyTypeId,
            fundTypeILP: row.fundTypeILP || null,
            provider: row.provider || 'AIA',
            coverageAmount: Number(row.coverageAmount) || 100000,
            premium: Number(row.premium) || 0,
            premiumFrequency: row.premiumFrequency || 'Monthly',
            startDate: row.startDate || new Date().toISOString().split('T')[0],
            endDate: row.endDate || '2030-12-31',
            status: row.status || 'Active',
            recommended: row.recommended === 'Yes' || row.recommended === true || row.recommended === 'true',
            notes: row.note || null,
            advisorId: Number(row.advisorId) || 1
          }, { transaction });
          
          policiesCreated++;
          console.log(`   ✅ Policy created: ${policy.policyId}`);
        }

        importResults.importedRows.push({
          ...row,
          imported: true,
          clientCreated: clientCreated,
          policyCreated: !existingPolicy
        });

        console.log(`   ✅ Row ${i + 1} processed successfully`);

      } catch (error) {
        console.error(`   ❌ Failed to import row ${i + 1}:`, error);
        console.error(`   ❌ Error details:`, error.message);
        
        importResults.importWarnings.push({
          rowIndex: i,
          clientId: row.clientId,
          fullName: row.fullName,
          policyId: row.policyId,
          issue: error.message,
          sqlError: error.original?.message || null
        });
        
        importResults.skippedRows.push(row);
      }
    }

    await transaction.commit();
    console.log('\n🎉 Transaction committed successfully!');
    console.log(`📊 Import Summary:`);
    console.log(`   Total rows processed: ${approvedData.length}`);
    console.log(`   Clients created: ${clientsCreated}`);
    console.log(`   Policies created: ${policiesCreated}`);
    console.log(`   Warnings: ${importResults.importWarnings.length}`);
    console.log(`   Skipped: ${importResults.skippedRows.length}`);

    return res.json({
      success: true,
      message: `Import completed! ${importResults.importedRows.length} rows imported successfully.`,
      results: importResults,
      totalImported: importResults.importedRows.length,
      totalWarnings: importResults.importWarnings.length,
      clientsCreated: clientsCreated,
      policiesCreated: policiesCreated,
      previewMode: false
    });
    
  } catch (err) {
    console.error('❌ Import failed:', err);
    console.error('❌ Error stack:', err.stack);
    
    try {
      await transaction.rollback();
      console.log('🔄 Transaction rolled back successfully');
    } catch (rollbackErr) {
      console.error('❌ Rollback failed:', rollbackErr);
    }
    
    return res.status(500).json({ 
      success: false,
      error: 'Import failed',
      details: err.message,
      sqlError: err.original?.message || null
    });
  }
};


exports.approveImport = async (req, res) => {
  console.log('🔄 Using alternative import endpoint...');
  console.log('📦 Request body:', req.body);
  
  try {
    const { clients = [], policies = [] } = req.body;
    
    if (!Array.isArray(policies) || policies.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No policies data provided'
      });
    }
    
    const approvedData = policies.map(policy => ({
      clientId: policy.clientId,
      fullName: policy.fullName,
      nric: policy.nric,
      email: policy.email,
      phone: policy.phone,
      dob: policy.dob || '1990-01-01',
      gender: policy.gender || 'Male',
      maritalStatus: policy.maritalStatus || 'Single',
      occupation: policy.occupation || 'Professional',
      annualIncome: policy.annualIncome || 50000,
      paymentFrequency: policy.paymentFrequency || 'monthly',
      riskProfile: policy.riskProfile || 'Conservative',
      advisorId: policy.advisorId || 1,
      policyId: policy.policyId,
      policyName: policy.policyName,
      productType: policy.productType || policy.policyName,
      policyTypeId: policy.policyTypeId,
      fundTypeILP: policy.fundTypeILP,
      provider: policy.provider || 'AIA',
      coverageAmount: policy.coverageAmount,
      premium: policy.premium,
      premiumFrequency: policy.premiumFrequency,
      startDate: policy.startDate,
      endDate: policy.endDate,
      status: policy.status || 'Active',
      recommended: policy.recommended,
      note: policy.note
    }));
    
    req.body = { approvedData };
    return exports.importApprovedData(req, res);
    
  } catch (error) {
    console.error('❌ Alternative import failed:', error);
    res.status(500).json({
      success: false,
      error: 'Import failed',
      details: error.message
    });
  }
};

exports.cancelPreview = async (req, res) => {
  try {
    if (req.session && req.session.previewTransaction) {
      await req.session.previewTransaction.rollback();
      req.session.previewTransaction = null;
      console.log('🔄 Preview transaction rolled back');
    }
    res.json({ success: true, message: 'Preview cancelled' });
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    res.status(500).json({ error: 'Rollback failed' });
  }
};

exports.confirmImport = async (req, res) => {
  try {
    if (req.session && req.session.previewTransaction) {
      await req.session.previewTransaction.commit();
      req.session.previewTransaction = null;
      console.log('✅ Import confirmed and committed to database');
    }
    res.json({ success: true, message: 'Import confirmed permanently' });
  } catch (error) {
    console.error('❌ Commit failed:', error);
    res.status(500).json({ error: 'Commit failed' });
  }
};