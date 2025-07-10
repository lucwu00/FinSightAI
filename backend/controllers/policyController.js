const Policy = require('../models/policy');

exports.createPolicy = async (req, res) => {
  try {
    console.log("✅ New Policy POST received:", req.body);
    const newPolicy = await Policy.create(req.body);
    res.status(201).json(newPolicy); // send back the new policy
  } catch (err) {
    console.error("Error creating policy:", err);
    res.status(500).json({ error: 'Failed to create policy' });
  }
};

exports.getAllPolicies = async (req, res) => {
  console.log("📥 Incoming GET /api/policies");

  try {
    const policies = await Policy.find();
    console.log("📦 Fetched policies:", JSON.stringify(policies, null, 2));
    res.json(policies);
  } catch (err) {
    console.error("❌ Error in getAllPolicies:", err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.updatePolicy = async (req, res) => {
  try {
    const updated = await Policy.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deletePolicy = async (req, res) => {
  try {
    await Policy.findByIdAndDelete(req.params.id);
    res.json({ message: 'Policy deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPolicySummary = async (req, res) => {
  try {
    const policies = await Policy.find();
    const summary = await generateSummary(policies);
    res.json({ summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getCommonCoverageTypes = async (req, res) => {
  try {
    const policies = await Policy.find();

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

    const policies = await Policy.find({
      endDate: { $lte: threeMonthsLater, $gte: now }
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
    const policies = await Policy.find();
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
    const query = {};

    if (searchTerm && searchTerm.trim() !== '') {
      const regex = new RegExp(searchTerm, 'i');
      query.$or = [
        { holderName: regex },
        { clientId: regex },
        { policyId: regex }
      ];
    }

    const policies = await Policy.find(query);

    
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
    const policies = await Policy.find({ clientId });
    // Remove 404 to avoid Axios catching it
    res.json(policies); // will return [] if not found
  } catch (err) {
    console.error('❌ Failed to fetch policies:', err);
    res.status(500).json({ error: 'Server error' });
  }
};




