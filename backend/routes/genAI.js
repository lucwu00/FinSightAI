const express = require('express');
const router = express.Router();
const Policy = require('../models/policy');
const multer = require('multer');
const xlsx = require('xlsx');
const openai = require('../openaiClient'); // ✅ Use OpenAI client

const upload = multer({ storage: multer.memoryStorage() });

const availableFields = [
  'client_name', 'client_id', 'email', 'phone', 'nric',
  'product_type', 'policy_type_id', 'policy_id', 'start_date', 'end_date',
  'premium_frequency', 'premium_amount', 'fund_type', 'status', 'note'
];


router.get('/common-types', async (req, res) => {
  try {
    const allPolicies = await Policy.find();
    const counts = {};

    allPolicies.forEach(p => {
      counts[p.coverageType] = (counts[p.coverageType] || 0) + 1;
    });

    const total = allPolicies.length;
    const sorted = Object.entries(counts).map(([type, count]) => ({
      type,
      percentage: ((count / total) * 100).toFixed(0),
      count,
    })).sort((a, b) => b.count - a.count);

    const summary = `• Most common: ${sorted[0].type} (${sorted[0].percentage}%)\n• Least common: ${sorted[sorted.length - 1].type} (${sorted[sorted.length - 1].percentage}%)`;

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
    const policies = await Policy.find();
    const context = JSON.stringify(policies.map(p => ({
      clientName: p.clientName,
      policyType: p.coverageType,
      startDate: p.startDate,
      endDate: p.endDate,
      status: p.status,
      premium: p.premium,
    })), null, 2);

    const messages = [
      {
        role: 'system',
        content: 'You are a helpful AI analyst specialized in insurance. Use bullet points or short paragraphs. Be concise.',
      },
      {
        role: 'user',
        content: `Here is the policy data:\n${context}\n\nNow answer this question:\n${question}`,
      },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
    });

    const summary = completion.choices?.[0]?.message?.content;
    res.json({ summary });
  } catch (err) {
    console.error('Custom GenAI Error:', err.response?.data || err.message);
    res.status(500).json({ error: 'GenAI failed to answer' });
  }
});


router.post('/client-summary', async (req, res) => {
  const { policies } = req.body;

  if (!policies || policies.length === 0) {
    return res.status(400).json({ error: 'No policies provided' });
  }

  const notes = policies.map(p => p.note).filter(Boolean).join('\n- ');

  const prompt = `
You are an AI assistant for a financial advisor. The following policies belong to one client.

Summarize the policies in 4–5 bullet points.

📌 FORMAT STRICTLY AS:
• Start with total number of distinct product types.
• Mention if there are duplicate or overlapping product types.
• Highlight any expired or expiring policies.
• Optionally include observations about gaps or risks.

Use plain bullet points (•), one per line. No numbering or HTML.
Avoid any other formatting or commentary.

AI-generated notes:
- ${notes}

Policies:
${JSON.stringify(policies, null, 2)}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    });

    const summary = completion.choices?.[0]?.message?.content;
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

router.post('/map-headers', (req, res) => {
  const { headers } = req.body;

  const mappings = {};
  for (const header of headers) {
    const normalized = header.toLowerCase();
    const match = availableFields.find(field =>
      normalized.includes(field.replace(/_/g, ' '))
    );

    mappings[header] = {
      suggested: match || '',
      confidence: match ? 0.95 : 0.4
    };
  }

  res.json({ mappings, availableFields });
});


router.post('/recommendation', async (req, res) => {
  const { policies, client } = req.body;

  if (!policies || !client) {
    return res.status(400).json({ error: 'Missing policies or client info' });
  }

  const productTypes = policies.map(p => p.productType).filter(Boolean);
  const allTypes = [
    "Whole Life", "Term Life", "Critical Illness", "Hospitalization",
    "Investment-Linked", "Travel", "Car", "Home",
    "Personal Accident", "Income Protection", "Endowment", "Disability"
  ];

  const prompt = `
You are an AI assistant to a financial advisor.

Client name: ${client.clientName || client.fullName}
Existing product types: ${productTypes.join(', ') || 'None'}

Please suggest up to 3 **additional policy types** that would commonly complement their existing coverage.
- Use bullet points.
- Highlight if client lacks common combinations (e.g., no Critical Illness or Hospitalization).
- Keep it concise and advisor-friendly.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    });

    const recommendation = completion.choices?.[0]?.message?.content;
    res.json({ recommendation });

    
  } catch (err) {
    console.error('❌ AI recommendation failed:', err.message || err);
    res.status(500).json({ error: 'Failed to generate recommendation' });
  }
});

module.exports = router;
