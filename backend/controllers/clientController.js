const { Client, Policy } = require('../models');
const { Op } = require('sequelize');
const { getCoverageInsights } = require('./../utils/gemini')

exports.getAllClients = async (req, res) => {
  try {
    const clients = await Client.findAll();
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
};

exports.getClientById = async (req, res) => {
  const { id: clientId } = req.params;
  try {
    const client = await Client.findByPk(clientId, {
      attributes: [
        "clientId",  
        "fullName",
        "email",
        "phone",
        "gender",
        "dob",
        "riskProfile",
        "incomeBracket"
      ],
      include: {
        model: Policy,
        as: "policies",
        attributes: [
          "policyId",
          "policyName",
          "productType",
          "startDate",
          "endDate",
          "status",
          "premium"
        ],
      },
    });

    if (!client) return res.status(404).json({ error: "Client not found" });
    res.json(client);
  } catch (err) {
    console.error("Failed to fetch client details", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getClientBasic = async (req, res) => {
  const { id: clientId } = req.params;
  try {
    const client = await Client.findByPk(clientId, {
      attributes: [
        "clientId",
        "fullName",
        "email",
        "notes",
        "lastContactedAt"
      ]
    });

    if (!client) return res.status(404).json({ error: "Client not found" });
    res.json(client);
  } catch (err) {
    console.error("Failed to fetch client:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getClientBySearch = async (req, res) => {
  const { query = "", riskProfile, incomeBracket, userId } = req.query;

  const where = {
    advisorId: userId || 1, // Use userId from request, fallback to 1
  };

  if (query) {
    // Check if query looks like a number (id)
    if (/^\d+$/.test(query)) {
      // Search by clientId OR fullName LIKE query
      where[Op.or] = [
        { clientId: query },
        { fullName: { [Op.like]: `%${query}%` } },
      ];
    } else {
      // Search only by fullName LIKE query
      where.fullName = { [Op.like]: `%${query}%` };
    }
  }

  if (riskProfile) where.riskProfile = riskProfile;
  if (incomeBracket) where.incomeBracket = incomeBracket;

  try {
    const clients = await Client.findAll({
      where,
      attributes: ["clientId", "fullName", "email", "riskProfile", "incomeBracket"],
    });
    // Transform results to ensure clientId is present
    const transformedClients = clients.map(client => {
      const plainClient = client.get({ plain: true });
      return plainClient;
    });
    res.json(transformedClients);
  } catch (err) {
    console.error("Failed to search clients", err);
    res.status(500).json({ error: "Failed to fetch clients" });
  }
}

exports.createClient = async (req, res) => {
  try {
    const newClient = await Client.create(req.body);
    res.status(201).json(newClient);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getClientGapInsights = async (req, res) => {
  const { id } = req.params;
 
  try {
    const client = await Client.findByPk(id, {
      attributes: [
        "clientId",
        "fullName",
        "dob",
        "annualIncome",
        "incomeBracket",
        "riskProfile",
        "maritalStatus",
        "occupation",
      ],
      include: {
        model: Policy,
        as: "policies",
        attributes: [
          "policyId",
          "policyName",
          "productType",
          "coverageAmount",
          "premium",
          "status",
          "endDate",
        ],
      },
    });
 
    if (!client) return res.status(404).json({ error: "Client not found" });
 
    // Build a concise prompt payload for the AI
    const activePolicies = (client.policies || []).filter((p) => {
      const end = p.endDate ? new Date(p.endDate) : null;
      return !end || end >= new Date();
    });
 
    const rawInsight = await getCoverageInsights(client, activePolicies);
 
    // Normalise — accept string, { insight }, { summary }, { content }, { text }
    let insightText = '';
    if (typeof rawInsight === 'string') {
      insightText = rawInsight;
    } else if (rawInsight && typeof rawInsight === 'object') {
      insightText =
        rawInsight.insight ??
        rawInsight.summary ??
        rawInsight.content ??
        rawInsight.text ??
        JSON.stringify(rawInsight);
    }
 
    res.json({ insight: insightText });
  } catch (err) {
    console.error("Gap insights error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateClient = async (req, res) => {
  const { id: clientId } = req.params;
  try {
    const client = await Client.findByPk(clientId);
    
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    // Update only the fields provided in the request body
    const updatedClient = await client.update(req.body);
    
    res.json(updatedClient);
  } catch (err) {
    console.error("Failed to update client:", err);
    res.status(500).json({ error: "Failed to update client" });
  }
};