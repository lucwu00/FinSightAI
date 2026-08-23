const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Initialize Gemini directly
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// AI Analytics endpoint - guaranteed to use Gemini
router.post('/analytics', async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'No question provided' });
    }

    console.log('🤖 Gemini Direct Analytics Request');

    const result = await model.generateContent(question);
    const response = await result.response;
    const summary = await response.text();
    
    res.json({ summary });
  } catch (error) {
    console.error('Gemini Direct Error:', error);
    res.status(500).json({ 
      error: 'Failed to get AI response from Gemini',
      details: error.message 
    });
  }
});

// Client summary endpoint - guaranteed to use Gemini
router.post('/client-summary', async (req, res) => {
  try {
    const { policies } = req.body;

    if (!policies || policies.length === 0) {
      return res.status(400).json({ error: 'No policies provided' });
    }

    const notes = policies.map((p) => p.note).filter(Boolean).join('\n- ');

    const prompt = `You are an AI assistant for a financial advisor. The following policies belong to one client.

Generate a concise 3–5 point summary:
- State the number of distinct policy types (e.g., Whole Life, ILP, Travel).
- Highlight if there are duplicate or overlapping policies (same product type).
- Mention any expired or soon-to-expire policies.
- Keep it professional and advisor-friendly.
- Write bullet lines that begin with "• ".

You may use the AI-generated notes:
- ${notes || '-'}

Policies:
${JSON.stringify(policies, null, 2)}`;

    console.log('🤖 Gemini Direct Client Summary Request');

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = await response.text();
    
    res.json({ summary });
  } catch (error) {
    console.error('Gemini Direct Client Summary Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate client summary with Gemini',
      details: error.message 
    });
  }
});

// Policy recommendation endpoint - guaranteed to use Gemini
router.post('/recommendation', async (req, res) => {
  try {
    const { policies, client } = req.body;
    
    if (!policies || !client) {
      return res.status(400).json({ error: 'Missing policies or client info' });
    }

    // Normalize current coverage
    const have = Array.from(
      new Set(policies.map((p) => p.productType || p.policyName || '').filter(Boolean))
    );

    const profile = {
      fullName: client.fullName || client.clientName || '-',
      gender: client.gender || '-',
      maritalStatus: client.maritalStatus || '-',
      occupation: client.occupation || '-',
      annualIncome: client.annualIncome || '-',
      riskProfile: client.riskProfile || '-',
      dob: client.dob || undefined,
    };

    const prompt = `
You are an insurance planning assistant for a financial advisor.

TASK:
Recommend exactly 3 additional policy TYPES that would realistically fill gaps in this client's portfolio.

FORMAT:
Return a numbered list (1., 2., 3.), each item on a new line:
Policy Type — short, one-sentence reason grounded in the client's context.

CONSTRAINTS:
- Do NOT repeat types the client already has: ${have.join(', ') || 'None'}.
- Favor mainstream protections if missing (Critical Illness, Hospitalization, Disability Income, Personal Accident, Long-Term Care, Travel, Home, Car, Whole Life, Term Life, Endowment, Investment-Linked).
- Keep each reason short and specific (≤ 20 words), referencing demographics/risks when relevant.
- No intro or outro, only the 3 numbered lines.

CLIENT PROFILE (JSON):
${JSON.stringify(profile, null, 2)}
    `.trim();

    console.log('🤖 Gemini Direct Recommendation Request');

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const recommendation = await response.text();
    
    res.json({ recommendation });
  } catch (error) {
    console.error('Gemini Direct Recommendation Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate recommendations with Gemini',
      details: error.message 
    });
  }
});

module.exports = router;
