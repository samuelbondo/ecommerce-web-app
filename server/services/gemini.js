/**
 * Samuel Store — Gemini AI Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Single module that wraps every Gemini API call used across the store.
 * Model: gemini-2.5-flash  (best free-tier limits on this account)
 *
 * Features powered by this service:
 *  1. generateDescription(name, category, price) → SEO product description
 *  2. semanticSearch(query, products)            → ranked product IDs
 *  3. reviewSummary(reviews)                     → sentiment paragraph
 *  4. chatAssistant(messages, products)          → shopping assistant reply
 *  5. translateText(text, targetLang)            → multilingual support
 *
 * Environment variable required:
 *   GEMINI_API_KEY=<your key>
 *
 * Rate limits (free tier, gemini-2.5-flash):
 *   RPM: 10  |  TPM: 250,000  |  RPD: 500
 *
 * All functions return { ok: true, data } or { ok: false, error }.
 * Callers must handle the ok:false case gracefully so the store never
 * crashes when the AI is unavailable or rate-limited.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const https = require('https');

const MODEL = 'gemini-2.5-flash';
const API_KEY = process.env.GEMINI_API_KEY;
const BASE = 'generativelanguage.googleapis.com';

/**
 * Low-level POST to Gemini generateContent endpoint.
 * @param {string} prompt
 * @param {number} maxTokens
 * @returns {Promise<{ok:boolean, text?:string, error?:string}>}
 */
function callGemini(prompt, maxTokens = 512) {
  return new Promise((resolve) => {
    if (!API_KEY) return resolve({ ok: false, error: 'GEMINI_API_KEY not set' });

    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
    });

    const options = {
      hostname: BASE,
      path: `/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    };

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(raw);
          if (json.error) return resolve({ ok: false, error: json.error.message });
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
          resolve({ ok: true, text: text.trim() });
        } catch {
          resolve({ ok: false, error: 'Failed to parse Gemini response' });
        }
      });
    });

    req.on('error', (e) => resolve({ ok: false, error: e.message }));
    req.setTimeout(15000, () => { req.destroy(); resolve({ ok: false, error: 'Gemini request timed out' }); });
    req.write(body);
    req.end();
  });
}

/**
 * 1. Generate a professional, SEO-optimised product description.
 *    Used in: AdminProducts modal → "Generate with AI" button
 */
async function generateDescription(name, category = '', price = '') {
  const prompt = `You are a professional e-commerce copywriter for an international online store.
Write a compelling, SEO-optimised product description for the following product.
Keep it between 60–120 words. Use clear, benefit-focused language. No bullet points. Plain paragraph only.

Product name: ${name}
Category: ${category || 'General'}
Price: ${price ? `$${price}` : 'not specified'}

Return only the description text, nothing else.`;

  return callGemini(prompt, 200);
}

/**
 * 2. Semantic search — re-rank products by relevance to a natural-language query.
 *    Used in: Products page search bar
 *    products: array of { id, name, description, category }
 *    Returns: array of product IDs sorted by relevance (most relevant first)
 */
async function semanticSearch(query, products) {
  if (!products.length) return { ok: true, ids: [] };

  const catalog = products.map(p =>
    `ID:${p.id} | ${p.name} | ${p.category || ''} | ${(p.description || '').slice(0, 80)}`
  ).join('\n');

  const prompt = `You are a product search engine for an international e-commerce store.
Given the customer's search query and a product catalog, return the IDs of the most relevant products.

Customer query: "${query}"

Product catalog:
${catalog}

Rules:
- Return ONLY a JSON array of product IDs, most relevant first. Example: [3,7,1]
- Include only products that are genuinely relevant to the query.
- If nothing is relevant, return an empty array: []
- Do not include any explanation or extra text.`;

  const result = await callGemini(prompt, 150);
  if (!result.ok) return { ok: false, error: result.error };

  try {
    const match = result.text.match(/\[[\d,\s]*\]/);
    const ids = match ? JSON.parse(match[0]) : [];
    return { ok: true, ids };
  } catch {
    return { ok: false, error: 'Could not parse search result' };
  }
}

/**
 * 3. Review sentiment summary — one paragraph summarising customer sentiment.
 *    Used in: ProductDetail reviews tab
 *    reviews: array of { rating, comment }
 */
async function reviewSummary(reviews) {
  if (!reviews.length) return { ok: true, text: '' };

  const reviewText = reviews.slice(0, 20).map(r =>
    `Rating: ${r.rating}/5 — "${r.comment}"`
  ).join('\n');

  const prompt = `You are a review analyst for an e-commerce platform.
Summarise the following customer reviews in 2–3 sentences. Mention what customers love and any common concerns.
Be neutral and factual. Do not use bullet points.

Reviews:
${reviewText}

Return only the summary paragraph, nothing else.`;

  return callGemini(prompt, 150);
}

/**
 * 4. Shopping assistant — conversational AI that knows the product catalog.
 *    Used in: Floating chat widget on all public pages
 *    messages: array of { role: 'user'|'assistant', content: string }
 *    products: array of { id, name, price, category, stock, description }
 */
async function chatAssistant(messages, products) {
  const catalog = products.slice(0, 60).map(p =>
    `ID:${p.id} | ${p.name} | ${p.category || 'General'} | Price: $${p.price} | Stock: ${p.stock > 0 ? 'In stock' : 'Out of stock'}`
  ).join('\n');

  const history = messages.map(m => `${m.role === 'user' ? 'Customer' : 'Assistant'}: ${m.content}`).join('\n');

  const prompt = `You are a helpful, friendly shopping assistant for Samuel Store, an international e-commerce platform.
You help customers find products, answer questions about the store, and guide them through their purchase.

Available products:
${catalog}

Conversation so far:
${history}

Rules:
- Be concise and helpful (max 3 sentences per reply).
- When recommending products, mention the product name and price.
- If a product is out of stock, say so and suggest alternatives.
- If asked about shipping, say "We offer free shipping on all orders".
- If asked something you cannot answer, politely say so.
- Never make up products that are not in the catalog.
- Respond in the same language the customer is using.
- At the end of your reply, if you mentioned or recommended any products by name, you MUST add this line: RECOMMENDED_IDS:[id1,id2] using the exact product IDs from the catalog. This line is mandatory whenever a product name appears in your reply. If truly no products are mentioned, omit it.

Reply now:`;

  return callGemini(prompt, 300);
}

/**
 * 5. Translate text to a target language.
 *    Used in: Any API response that needs multilingual support
 *    targetLang: e.g. 'French', 'Swahili', 'Arabic', 'Kinyarwanda'
 */
async function translateText(text, targetLang) {
  const prompt = `Translate the following text to ${targetLang}. Return only the translated text, nothing else.\n\n${text}`;
  return callGemini(prompt, 300);
}

module.exports = { generateDescription, semanticSearch, reviewSummary, chatAssistant, translateText };
