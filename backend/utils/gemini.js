const { GoogleGenerativeAI } = require("@google/generative-ai");
const crypto = require("crypto");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model  = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
// For Nudges widget

// Simple in-memory cache: { [cacheKey]: { timestamp, result } }
const cache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes cache

async function getNudgeFromGemini(client, policies) {
  // Create a cache key using client ID + hash of policies JSON
  const policiesHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(policies))
    .digest("hex");
  const cacheKey = `${client.id}-${policiesHash}`;

  // Check cache validity
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.result;
  }

  

  const prompt = `
You are an expert financial advisor assistant providing **actionable nudges** to a financial advisor (FA).

Given the client's profile and their policies below, generate exactly one JSON object with two keys: "type" and "message". 
- "type" is one of: "Product Opportunity", "Risk Alert", "Action Item", or "Information".
- "message" is a concise, professional instruction or insight the FA can use to guide the client.
- Do NOT address the client directly.
- Output ONLY the JSON object, no explanation, no markdown, no extra text.

Client Profile:
Name: ${client.fullName}
Age: ${calculateAge(client.dob)}
Income Bracket: ${client.incomeBracket || "Unknown"}
Risk Profile: ${client.riskProfile || "Unknown"}
Last Contacted: ${client.lastContactedAt || "Unknown"}

Policies:
${policies
  .map(
    (p) =>
      `- ${p.policyName} (${p.productType || "N/A"}) — Status: ${p.status || "N/A"} — Premium: $${p.premium || 0}/mo`
  )
  .join("\n")}
`.trim();

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const rawText = await response.text();

  // Clean raw text from markdown fences or extra text
  const cleanedText = cleanJsonString(rawText);

  try {
    const parsed = JSON.parse(cleanedText);
    cache.set(cacheKey, { timestamp: Date.now(), result: parsed });
    return parsed;
  } catch (e) {
    console.warn("Gemini returned invalid JSON:", rawText);
    return null;
  }
}

// For Recommended Policies widget

async function getRecommendedPolicy(client, policies) {
  const policiesHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(policies))
    .digest("hex");
  const cacheKey = `recommended-${client.id}-${policiesHash}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.result;
  }

 

  const prompt = `
You are an AI assistant helping a financial advisor recommend suitable insurance or investment products to clients.

For the client below, analyze their profile and policies, and suggest exactly ONE policy recommendation. Respond in valid JSON format with these fields:
{
  "recommendedPolicy": "e.g. Whole Life Insurance",
  "productType": "e.g. Life",
  "reasoning": "Short explanation for why this recommendation is suitable",
  "suggestedAction": "e.g. Book a meeting to discuss long-term savings goals"
}

DO NOT use markdown or any explanation. Only return valid JSON.

Client:
Name: ${client.fullName}
Age: ${calculateAge(client.dob)}
Income Bracket: ${client.incomeBracket || "Unknown"}
Risk Profile: ${client.riskProfile || "Unknown"}

Policies:
${policies.map(p => `- ${p.policyName} (${p.productType || "N/A"}) — ${p.status || "N/A"}`).join("\n")}
`.trim();

  const result = await model.generateContent(prompt);
  const raw = await result.response.text();
  const cleaned = cleanJsonString(raw);

  try {
    const parsed = JSON.parse(cleaned);
    const output = {
      clientName: client.fullName,
      ...parsed,
    };
    cache.set(cacheKey, { timestamp: Date.now(), result: output });
    return output;
  } catch (e) {
    console.warn("Gemini returned invalid JSON:", raw);
    return null;
  }
}

async function getCoverageInsights(client, policies) {
  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify({ client, policies }))
    .digest("hex");

  const cacheKey = `insights-${client.id}-${hash}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.result;
  }

  

  const prompt = `
You are an expert assistant helping financial advisors analyze client insurance coverage. Given the client's profile and policies, return:
1. A list of 3 concise, actionable insights (bullet points).
2. A radar chart data object showing coverage scores (0–100) for:
   - Life Coverage
   - Critical Illness
   - Accident Protection
   - Education Planning
   - Retirement Income
   - Property Insurance

Respond ONLY in this JSON format:

{
  "insights": ["...", "...", "..."],
  "radarData": {
    "Life Coverage": 80,
    "Critical Illness": 60,
    "Accident Protection": 40,
    "Education Planning": 70,
    "Retirement Income": 50,
    "Property Insurance": 20
  }
}

Client:
Name: ${client.fullName}
Age: ${calculateAge(client.dob)}
Income Bracket: ${client.incomeBracket || "Unknown"}
Risk Profile: ${client.riskProfile || "Unknown"}

Policies:
${policies.map(p => `- ${p.policyName} (${p.productType || "N/A"}) — Status: ${p.status || "N/A"}`).join("\n")}
`;

  const result = await model.generateContent(prompt);
  const raw = await result.response.text();
  const cleaned = cleanJsonString(raw);

  try {
    const parsed = JSON.parse(cleaned);
    cache.set(cacheKey, { timestamp: Date.now(), result: parsed });
    return parsed;
  } catch (e) {
    console.warn("Gemini returned invalid JSON for coverage insights:", raw);
    return null;
  }
}



function cleanJsonString(raw) {
  let str = raw.trim();

  // Remove ```json or ``` fences if present
  str = str.replace(/^```json\s*/, "").replace(/^```\s*/, "");
  str = str.replace(/```$/, "").trim();

  // Extract first JSON object if multiple or malformed
  const match = str.match(/{[\s\S]*}/);
  if (match) str = match[0];

  return str;
}

function calculateAge(birthDateStr) {
  if (!birthDateStr) return "Unknown";
  const birthDate = new Date(birthDateStr);
  const ageDifMs = Date.now() - birthDate.getTime();
  const ageDate = new Date(ageDifMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}



module.exports = {
  getNudgeFromGemini,
  getRecommendedPolicy,
  getCoverageInsights,
};


