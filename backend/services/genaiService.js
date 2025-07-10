const { OpenAI } = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function askOpenAI(messages, temperature = 0.7, model = 'gpt-3.5-turbo') {
  try {
    const response = await openai.chat.completions.create({
      model,
      messages,
      temperature,
    });

    return response.choices[0].message.content.trim();
  } catch (err) {
    console.error('❌ OpenAI Error:', err.response?.data || err.message);
    throw err;
  }
}

async function generateSummary(policies, customQuestion = null) {
    const context = JSON.stringify(
      policies.map(p => ({
        client: p.holderName,
        type: p.coverageType,
        premium: p.premium,
        start: p.startDate,
        end: p.endDate,
        status: p.status,
      })),
      null,
      2
    );
  
    const messages = [
      {
        role: 'system',
        content: 'You are an insurance analyst. Answer clearly based on the provided policy data.',
      },
      {
        role: 'user',
        content: `${customQuestion || "Provide a summary of the following policies."}\n\nData:\n${context}`,
      },
    ];
  
    return await askOpenAI(messages);
  }
  

module.exports = { askOpenAI, generateSummary };
