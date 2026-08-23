const { getNudgeFromGemini } = require("../utils/gemini");

const { Client, Policy } = require("../models");

exports.getNudges = async (req, res) => {
    const userId = req.query.userId || 1;

    try {
        const clients = await Client.findAll({
            where: { advisorId: userId },
            include: [{ model: Policy, as: "policies" }],
        });

        const results = [];

        for (const client of clients) {
            if (!client || !client.clientId) {
                console.warn('Skipping client with missing clientId');
                continue;
            }

            const policies = await Policy.findAll({ 
                where: { 
                    clientId: client.clientId 
                }
            });

            try {
                const nudge = await getNudgeFromGemini(client, policies);
                if (nudge) {
                    results.push({
                        id: client.clientId,
                        client: {
                            name: client.fullName,
                            email: client.email,
                            profileUrl: null, // placeholder for now
                        },
                        type: nudge.type,
                        message: nudge.message,
                    });
                }
            } catch (aiError) {
                console.error(`Error generating nudge for client ${client.id}:`, aiError);
                // Skip this client if AI call fails
            }
        }

        res.json(results);
    } catch (error) {
        console.error('Error in getNudges:', error);
        res.status(500).json({ error: 'Failed to fetch nudges' });
    }
}