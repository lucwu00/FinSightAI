const express = require('express');
const router = express.Router();
const { Policy } = require('../models');
const multer = require('multer');
const xlsx = require('xlsx');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.development') });

const useOpenAI = !!process.env.OPENAI_API_KEY;
const openai = useOpenAI ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

const useGemini = !!process.env.GEMINI_API_KEY;
const genAI = useGemini ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
const geminiModel = useGemini ? genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }) : null;


async function llmText(prompt, { temperature = 0.3 } = {}) {
  if (useOpenAI) {
    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature,
      messages: [
        { role: 'system', content: 'You are a concise, advisor-friendly insurance analyst.' },
        { role: 'user', content: prompt },
      ],
    });
    return resp.choices?.[0]?.message?.content?.trim() || '';
  }
  if (geminiModel) {
    const result = await geminiModel.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature } });
    const response = await result.response;
    return (await response.text()) || '';
  }
  throw new Error('No LLM configured: set OPENAI_API_KEY or GEMINI_API_KEY');
}

const upload = multer({ storage: multer.memoryStorage() });


const availableFields = [
  'client_name', 'client_id', 'email', 'phone', 'nric',
  'product_type', 'policy_type_id', 'policy_id', 'start_date', 'end_date',
  'premium_frequency', 'premium_amount', 'fund_type', 'status', 'note',
];


router.get('/common-types', async (req, res) => {
  try {
    const allPolicies = await Policy.findAll();
    const counts = {};

    allPolicies.forEach((p) => {
      counts[p.coverageType] = (counts[p.coverageType] || 0) + 1;
    });

    const total = allPolicies.length || 1;
    const sorted = Object.entries(counts)
      .map(([type, count]) => ({
        type,
        percentage: ((count / total) * 100).toFixed(0),
        count,
      }))
      .sort((a, b) => b.count - a.count);

    const summary =
      sorted.length > 0
        ? `• Most common: ${sorted[0].type} (${sorted[0].percentage}%)\n• Least common: ${sorted[sorted.length - 1].type} (${sorted[sorted.length - 1].percentage}%)`
        : 'No policies found.';

    res.json({ summary, counts });
  } catch (err) {
    console.error('GenAI summary failed:', err.message);
    res.status(500).json({ error: 'GenAI summary failed' });
  }
});

router.post('/custom', async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: 'No question provided' });

  try {
    const policies = await Policy.findAll();
    const context = JSON.stringify(
      policies.map((p) => ({
        clientName: p.clientName,
        productType: p.coverageType,
        startDate: p.startDate,
        endDate: p.endDate,
        status: p.status,
        premium: p.premium,
      })),
      null,
      2
    );

    const prompt = `You are a helpful AI analyst specialized in insurance. Use bullet points or short paragraphs. Be concise.

Here is the policy data:
${context}

Now answer this question:
${question}`;

    const summary = await llmText(prompt);
    res.json({ summary });
  } catch (err) {
    console.error('Custom GenAI Error:', err.message);
    res.status(500).json({ error: 'GenAI failed to answer' });
  }
});

router.post('/client-summary', async (req, res) => {
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

  try {
    const summary = await llmText(prompt);
    res.json({ summary });
  } catch (err) {
    console.error('❌ AI summary failed:', err.message || err);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

router.post('/parse-headers', upload.single('file'), (req, res) => {
  const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const headers = xlsx.utils.sheet_to_json(sheet, { header: 1 })[0];
  res.json({ headers });
});

router.post('/map-headers', async (req, res) => {
  const { headers } = req.body;

  try {
    const prompt = `
You are a data mapping assistant for an insurance CRM system.

Map each Excel column header to the most likely database field from this list:
${availableFields.join(', ')}

Rules:
- Use your knowledge of synonyms and context (e.g. "IC Number" = nric, "Sum Assured" = coverage_amount, "Insurer" = provider, "Policy Expiry" = end_date, "Advised?" = recommended)
- If no field is a reasonable match, return empty string ""
- Return ONLY valid JSON, no explanation

Input headers: ${JSON.stringify(headers)}

Return this exact JSON format:
{
  "mappings": {
    "Header Name": { "suggested": "db_field_name", "confidence": 0.95 },
    ...
  }
}
    `.trim();

    const raw = await llmText(prompt, { temperature: 0.1 });
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    res.json({ mappings: parsed.mappings, availableFields });
  } catch (err) {
    console.error('Map headers AI failed:', err.message);
    // Fallback to simple string matching
    const mappings = {};
    for (const header of headers) {
      const normalized = String(header || '').toLowerCase();
      const match = availableFields.find(f => normalized.includes(f.replace(/_/g, ' ')));
      mappings[header] = { suggested: match || '', confidence: match ? 0.95 : 0.4 };
    }
    res.json({ mappings, availableFields });
  }
});

router.post('/recommendation', async (req, res) => {
  const { policies, client } = req.body;
  if (!policies || !client) {
    return res.status(400).json({ error: 'Missing policies or client info' });
  }

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

  try {
    const recommendation = await llmText(prompt);
    const formatted = recommendation
      .replace(/\r/g, '')                
      .replace(/(\d+\.\s)/g, '<br/>$1')  
      .replace(/^<br\/>/, '');           
    res.json({ recommendation });
  } catch (err) {
    console.error('❌ AI recommendation failed:', err.message || err);
    res.status(500).json({ error: 'Failed to generate recommendation' });
  }
});

router.post('/client-onepager', async (req, res) => {
  const { client, policies } = req.body;
  if (!client || !policies) {
    return res.status(400).json({ error: 'Missing client or policies' });
  }
 
  const activePolicies = policies.filter(p => {
    const end = p.endDate ? new Date(p.endDate) : null;
    return !end || end >= new Date();
  });
 
  const prompt = `
You are a senior financial advisor writing a brief portfolio review for your team.
 
CLIENT: ${client.fullName}, age ${client.dob ? Math.floor((Date.now() - new Date(client.dob)) / 31557600000) : 'unknown'}, ${client.occupation || 'unknown occupation'}, annual income $${Number(client.annualIncome || 0).toLocaleString()}, risk profile: ${client.riskProfile || 'unknown'}.
 
ACTIVE POLICIES (${activePolicies.length}):
${activePolicies.map(p => `- ${p.policyName} (${p.productType}): $${Number(p.coverageAmount || 0).toLocaleString()} coverage`).join('\n')}
 
Write a 3-paragraph plain-English summary:
1. Portfolio strengths — what is well covered
2. Coverage gaps and risks — what is missing or under-insured
3. Recommended next steps for the advisor — specific and actionable
 
Be direct, professional, and specific. No bullet points — write in flowing paragraphs. Max 200 words total.
  `.trim();
 
  try {
    const onepager = await llmText(prompt, { temperature: 0.4 });
    res.json({ onepager });
  } catch (err) {
    console.error('❌ One-pager failed:', err.message);
    res.status(500).json({ error: 'Failed to generate one-pager' });
  }
});
 
// Gap 2b: Ask AI about this client — contextual chat
router.post('/client-ask', async (req, res) => {
  const { client, policies, question } = req.body;
  if (!client || !policies || !question) {
    return res.status(400).json({ error: 'Missing client, policies, or question' });
  }
 
  const prompt = `
You are an AI assistant helping a financial advisor understand a specific client's insurance portfolio.
 
CLIENT: ${client.fullName}, ${client.occupation || ''}, income $${Number(client.annualIncome || 0).toLocaleString()}/yr, risk: ${client.riskProfile || 'unknown'}, DOB: ${client.dob || 'unknown'}.
 
POLICIES:
${policies.map(p => {
  const end = p.endDate ? new Date(p.endDate) : null;
  const status = !end ? 'Active' : end < new Date() ? 'Expired' : 'Active';
  return `- ${p.policyName} (${p.productType}): $${Number(p.coverageAmount || 0).toLocaleString()} coverage, ${status}`;
}).join('\n')}
 
ADVISOR QUESTION: ${question}
 
Answer concisely and specifically based only on the data above. If the answer cannot be determined from the data, say so clearly. Max 3 sentences.
  `.trim();
 
  try {
    const answer = await llmText(prompt, { temperature: 0.3 });
    res.json({ answer });
  } catch (err) {
    console.error('❌ Client ask failed:', err.message);
    res.status(500).json({ error: 'Failed to answer question' });
  }
});

module.exports = router;
