const { Policy, Client, PolicyStore, PolicyCategories, PolicyProviders } = require('../models');
const { Op } = require('sequelize');
const { generateSummary } = require('../services/genaiService');
const { getRecommendedPolicy } = require("../utils/gemini");

exports.createPolicy = async (req, res) => {
  try {
    console.log("✅ New Policy POST received:", JSON.stringify(req.body, null, 2));
    if (!req.body.clientId || !req.body.policyId || !req.body.policyName) {
      console.error("❌ Missing essential fields");
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'clientId, policyId, and policyName are required'
      });
    }

    const policyData = {
      clientId: req.body.clientId,
      policyId: req.body.policyId,
      fullName: req.body.fullName,
      policyName: req.body.policyName,
      productType: req.body.productType, 
      policyTypeId: req.body.policyTypeId,
      fundTypeILP: req.body.fundTypeILP || '',
      coverageAmount: parseFloat(req.body.coverageAmount) || 0,
      premium: parseFloat(req.body.premium) || 0,
      provider: req.body.provider || 'AIA',
      premiumFrequency: req.body.premiumFrequency || 'Monthly',
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      status: req.body.status || 'Active',
      recommended: Boolean(req.body.recommended),
      notes: req.body.notes || '',
      advisorId: req.body.advisorId || 1
    };

    console.log("📝 Prepared policy data:", JSON.stringify(policyData, null, 2));

    const newPolicy = await Policy.create(policyData);
    console.log("✅ Policy created successfully:", newPolicy.toJSON());
    res.status(201).json(newPolicy);

  } catch (err) {
    console.error("❌ Detailed error creating policy:", {
      name: err.name,
      message: err.message,
      stack: err.stack,
      sql: err.sql,
      original: err.original
    });

    res.status(500).json({
      error: 'Failed to create policy',
      message: err.message,
      details: err.name,
      sql: err.sql || 'No SQL error'
    });
  }
};

exports.getAllPolicies = async (req, res) => {
  console.log("📥 Incoming GET /api/policies");
  try {
    const policies = await Policy.findAll();
    console.log("📦 Fetched policies:", JSON.stringify(policies, null, 2));
    res.json(policies);
  } catch (err) {
    console.error("❌ Error in getAllPolicies:", err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.updatePolicyByPolicyId = async (req, res) => {
  try {
    const paramId = req.params.policyId;
    const updateData = req.body;
    const originalId = updateData.originalPolicyId || paramId;

    const existingPolicy = await Policy.findOne({ where: { policyId: originalId } });
    console.log('🔍 Existing policy found:', existingPolicy);

    if (!existingPolicy) {
      console.log('❌ Policy not found in database for ID:', originalId);
      return res.status(404).json({
        error: 'Policy not found',
        policyId: originalId
      });
    }

    Object.assign(existingPolicy, updateData);
    await existingPolicy.save();

    const updatedPolicy = existingPolicy;
    console.log('✅ POLICY UPDATED:', updatedPolicy);

    res.status(200).json({
      success: true,
      message: 'Policy updated successfully',
      policy: updatedPolicy
    });

  } catch (error) {
    console.error('❌ UPDATE POLICY ERROR:', error);
    res.status(500).json({
      error: 'Failed to update policy',
      details: error.message
    });
  }
};

exports.deletePolicyByPolicyId = async (req, res) => {
  try {
    const { policyId } = req.params;
    console.log('🗑️ DELETE REQUEST for policyId:', policyId);

    const deletedRowsCount = await Policy.destroy({
      where: { policyId: policyId }
    });

    if (deletedRowsCount === 0) {
      return res.status(404).json({
        error: 'Policy not found',
        policyId: policyId
      });
    }

    console.log('✅ POLICY DELETED:', policyId);
    res.status(200).json({
      success: true,
      message: 'Policy deleted successfully',
      deletedPolicyId: policyId
    });

  } catch (error) {
    console.error('❌ DELETE POLICY ERROR:', error);
    res.status(500).json({
      error: 'Failed to delete policy',
      details: error.message
    });
  }
};

exports.getPolicySummary = async (req, res) => {
  try {
    const policies = await Policy.findAll();
    const summary = await generateSummary(policies);
    res.json({ summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCommonCoverageTypes = async (req, res) => {
  try {
    const policies = await Policy.findAll();
    const typeCounts = policies.reduce((acc, policy) => {
      const type = policy.coverageType || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const total = policies.length;
    const percentages = Object.entries(typeCounts)
      .map(([type, count]) => ({
        type,
        count,
        percentage: ((count / total) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count);

    const mostCommon = percentages[0];
    const leastCommon = percentages[percentages.length - 1];

    res.json({ mostCommon, leastCommon });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.findClientsWithExpiringPolicies = async (req, res) => {
  try {
    const now = new Date();
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(now.getMonth() + 3);

    const policies = await Policy.findAll({
      where: {
        endDate: {
          [Op.lte]: threeMonthsLater,
          [Op.gte]: now
        }
      }
    });

    const clientMap = {};
    for (const policy of policies) {
      const client = policy.holderName;
      if (!clientMap[client]) {
        clientMap[client] = [];
      }
      clientMap[client].push(policy.policyId);
    }

    const result = Object.entries(clientMap)
      .filter(([_, ids]) => ids.length >= 2)
      .map(([name, ids]) => ({ name, count: ids.length, policies: ids }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getIncompletePolicies = async (req, res) => {
  try {
    const policies = await Policy.findAll();
    const incomplete = policies.filter(p =>
      !p.policyId || !p.clientId || !p.holderName || !p.coverageType ||
      !p.coverageAmount || !p.startDate || !p.endDate || !p.status
    );
    res.json(incomplete);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCustomPolicySummary = async (req, res) => {
  const { question, searchTerm } = req.body;
  try {
    let whereClause = {};
    if (searchTerm && searchTerm.trim() !== '') {
      whereClause = {
        [Op.or]: [
          { holderName: { [Op.like]: `%${searchTerm}%` } },
          { clientId: { [Op.like]: `%${searchTerm}%` } },
          { policyId: { [Op.like]: `%${searchTerm}%` } }
        ]
      };
    }

    const policies = await Policy.findAll({ where: whereClause });
    const safeChunk = policies.slice(0, 100);
    const summary = await generateSummary(safeChunk);

    res.json({
      summary,
      matchedCount: policies.length,
      summarizedCount: safeChunk.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPoliciesByClientId = async (req, res) => {
  try {
    console.log("🧠 getPoliciesByClientId called for:", req.params.clientId);
    const clientId = req.params.clientId.toUpperCase();
    const policies = await Policy.findAll({ where: { clientId } });
    res.json(policies); 
  } catch (err) {
    console.error('❌ Failed to fetch policies:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getRecommendedPolicies = async (req, res) => {
  try {
    const advisorId = 1;
    const clients = await Client.findAll({
      where: { advisorId },
      include: [{ model: Policy, as: "policies" }],
    });

    const results = [];
    for (const client of clients) {
      const policies = client.policies || [];
      try {
        const recommendation = await getRecommendedPolicy(client, policies);
        if (recommendation) results.push(recommendation);
      } catch (aiError) {
        console.error(`Error generating recommendation for client ${client.id}:`, aiError);
      }
    }

    res.json(results);
  } catch (err) {
    console.error("Failed to generate recommendations", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.debugCreatePolicy = async (req, res) => {
  try {
    console.log("🔍 DEBUG: Received request body:", JSON.stringify(req.body, null, 2));
    
    const { Policy } = require('../models');
    console.log("🔍 DEBUG: Policy model:", !!Policy);

    try {
      await Policy.findAll({ limit: 1 });
      console.log("✅ DEBUG: Database connection working");
    } catch (dbErr) {
      console.error("❌ DEBUG: Database connection failed:", dbErr.message);
      return res.status(500).json({ error: 'Database connection failed', details: dbErr.message });
    }

    try {
      const tableInfo = await Policy.describe();
      console.log("🔍 DEBUG: Policy table structure:", tableInfo);
      res.json({
        message: 'Debug info',
        tableStructure: tableInfo,
        receivedData: req.body
      });
    } catch (err) {
      console.error("❌ DEBUG: Failed to get table structure:", err.message);
      res.status(500).json({ error: 'Failed to get table structure', details: err.message });
    }
  } catch (err) {
    console.error("❌ DEBUG: General error:", err);
    res.status(500).json({ error: 'Debug failed', details: err.message });
  }
};

exports.createPolicySimple = async (req, res) => {
  try {
    const { Policy } = require('../models');
    
    const minimalData = {
      clientId: req.body.clientId || 'TEST001',
      policyId: req.body.policyId || 'TEST001-PT001',
      status: req.body.status || 'Active'
    };

    console.log("🔍 DEBUG: Creating with minimal data:", minimalData);
    const newPolicy = await Policy.create(minimalData);
    res.status(201).json(newPolicy);
  } catch (err) {
    console.error("❌ DEBUG: Simple create failed:", err);
    res.status(500).json({ error: err.message, name: err.name });
  }
};

exports.getAllStorePolicies = async (req, res) => {
  try {
    console.log("📥 Getting all Policy Store templates from database");
    const storePolicies = await PolicyStore.findAll({
      where: { isActive: true },
      order: [['policyId', 'ASC']]
    });
    console.log(`📦 Found ${storePolicies.length} store policies`);
    res.json(storePolicies);
  } catch (err) {
    console.error("❌ Error getting store policies:", err.message);
    res.status(500).json({ error: err.message });
  }
};


exports.createStorePolicy = async (req, res) => {
  try {
    console.log("✅ Creating new Policy Store template:", JSON.stringify(req.body, null, 2));
    
    const existingPolicies = await PolicyStore.findAll({
      attributes: ['policyId'],
      order: [['policyId', 'ASC']]
    });
    
    const existingIds = existingPolicies.map(p => p.policyId);
    let counter = 1;
    let newPolicyId;
    do {
      newPolicyId = `PT${String(counter).padStart(3, '0')}`;
      counter++;
    } while (existingIds.includes(newPolicyId));

    if (!req.body.name) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Policy name is required'
      });
    }

    const storePolicyData = {
      policyId: newPolicyId,
      name: req.body.name,
      category: req.body.category || 'Life Insurance',
      description: req.body.description || '',
      detailedDescription: req.body.detailedDescription || '',
      defaultCoverageAmount: parseFloat(req.body.defaultCoverageAmount) || 0,
      defaultPremium: parseFloat(req.body.defaultPremium) || 0,
      defaultFrequency: req.body.defaultFrequency || 'Annually',
      protections: req.body.protections || [],
      legalTerms: req.body.legalTerms || [],
      coverage: req.body.coverage || {},
      eligibility: req.body.eligibility || '',
      exclusions: req.body.exclusions || '',
      isActive: true
    };

    const newStorePolicy = await PolicyStore.create(storePolicyData);
    console.log("✅ Store policy created with ID:", newPolicyId);
    res.status(201).json(newStorePolicy);
  } catch (err) {
    console.error("❌ Error creating store policy:", err);
    res.status(500).json({
      error: 'Failed to create store policy',
      message: err.message
    });
  }
};

exports.updateStorePolicy = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🔄 Updating store policy:", id);

    const existingPolicy = await PolicyStore.findOne({
      where: { policyId: id }
    });

    if (!existingPolicy) {
      return res.status(404).json({
        error: 'Store policy not found',
        policyId: id
      });
    }

    const updatedData = {
      name: req.body.name || existingPolicy.name,
      category: req.body.category || existingPolicy.category,
      description: req.body.description || existingPolicy.description,
      detailedDescription: req.body.detailedDescription || existingPolicy.detailedDescription,
      defaultCoverageAmount: req.body.defaultCoverageAmount !== undefined ?
        parseFloat(req.body.defaultCoverageAmount) : existingPolicy.defaultCoverageAmount,
      defaultPremium: req.body.defaultPremium !== undefined ?
        parseFloat(req.body.defaultPremium) : existingPolicy.defaultPremium,
      defaultFrequency: req.body.defaultFrequency || existingPolicy.defaultFrequency,
      protections: req.body.protections || existingPolicy.protections,
      legalTerms: req.body.legalTerms || existingPolicy.legalTerms,
      coverage: req.body.coverage || existingPolicy.coverage,
      eligibility: req.body.eligibility || existingPolicy.eligibility,
      exclusions: req.body.exclusions || existingPolicy.exclusions
    };

    await existingPolicy.update(updatedData);
    console.log("✅ Store policy updated successfully");

    res.status(200).json({
      success: true,
      message: 'Store policy updated successfully',
      policy: existingPolicy
    });
  } catch (error) {
    console.error("❌ Error updating store policy:", error);
    res.status(500).json({
      error: 'Failed to update store policy',
      details: error.message
    });
  }
};

exports.deleteStorePolicy = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🗑️ Deleting store policy:", id);

    const deletedRowsCount = await PolicyStore.destroy({
      where: { policyId: id }
    });

    if (deletedRowsCount === 0) {
      return res.status(404).json({
        error: 'Store policy not found',
        policyId: id
      });
    }

    console.log("✅ Store policy deleted successfully");
    res.status(200).json({
      success: true,
      message: 'Store policy deleted successfully',
      deletedPolicyId: id
    });
  } catch (error) {
    console.error("❌ Error deleting store policy:", error);
    res.status(500).json({
      error: 'Failed to delete store policy',
      details: error.message
    });
  }
};

exports.getPolicyCategories = async (req, res) => {
  try {
    const categories = await PolicyCategories.findAll();
    res.json(categories);
  } catch (err) {
    console.error("❌ Error getting categories:", err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.getPolicyProviders = async (req, res) => {
  try {
    const providers = await PolicyProviders.findAll({
      where: { isActive: true }
    });
    res.json(providers);
  } catch (err) {
    console.error("❌ Error getting providers:", err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.getTopProducts = async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const policies = await Policy.findAll({
      where: {
        advisorId: userId,
        status: 'Active' 
      }
    });

    console.log(`Found ${policies.length} policies for user ${userId}`);

    if (policies.length === 0) {
      return res.json([]);
    }

    const productMap = {};
    
    policies.forEach(policy => {
      const productType = policy.productType || 'Unknown';
      const premium = parseFloat(policy.premium) || 0;
      
      if (!productMap[productType]) {
        productMap[productType] = {
          productType: productType,
          policyCount: 0,
          totalRevenue: 0
        };
      }
      
      productMap[productType].policyCount += 1;
      productMap[productType].totalRevenue += premium;
    });

    const topProducts = Object.values(productMap)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10); 

    console.log('Top products:', topProducts);
    res.json(topProducts);
  } catch (err) {
    console.error("❌ Error getting top products:", err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports = exports;