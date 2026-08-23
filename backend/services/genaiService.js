const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

async function askGemini(prompt) {
  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    console.error('❌ Gemini Error:', err.message);
    throw err;
  }
}

// Kept same name as before so nothing else needs changing
async function generateSummary(policies, customQuestion = null) {
  const context = JSON.stringify(
    policies.map(p => ({
      client: p.holderName || p.fullName,
      type: p.coverageType || p.productType,
      premium: p.premium,
      start: p.startDate,
      end: p.endDate,
      status: p.status,
    })),
    null,
    2
  );

  const prompt = `You are an insurance analyst. Answer clearly based on the provided policy data.

${customQuestion || 'Provide a brief summary of the following policies.'}

Data:
${context}`;

  return await askGemini(prompt);
}

// Kept for any legacy callers
async function askOpenAI(messages) {
  // Convert OpenAI message format to a single Gemini prompt
  const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');
  return await askGemini(prompt);
}

module.exports = { askGemini, askOpenAI, generateSummary };