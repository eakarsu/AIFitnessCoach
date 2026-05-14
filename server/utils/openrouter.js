/**
 * Shared OpenRouter client for AIFitnessCoach.
 *
 * - Single helper used by both ai.js and aiNew.js (eliminates the duplicated copy).
 * - 3-strategy JSON parser (`parseAIJson`) for prompts that ask for structured JSON.
 * - Retry/backoff on 429 / 5xx responses.
 * - HTTP-Referer is env-driven (`AI_HTTP_REFERER` / `CLIENT_URL`).
 * - Reads model name from `OPENROUTER_MODEL`, defaulting to claude-3-5-sonnet-20241022.
 */

const logger = require('./logger');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

/**
 * Validate that the OpenRouter API key is present before the server takes traffic.
 * Throws in production, warns in dev so local work still boots.
 */
function assertOpenRouterConfigured() {
  if (!process.env.OPENROUTER_API_KEY) {
    const msg = 'OPENROUTER_API_KEY is not set — AI endpoints will fail.';
    if (process.env.NODE_ENV === 'production') {
      throw new Error(msg);
    }
    logger.warn(msg);
  }
}

/**
 * 3-strategy JSON parser for LLM responses:
 *   1. Try to JSON.parse the raw string.
 *   2. Look for a fenced ```json ... ``` block.
 *   3. Slice between the first `{`/`[` and last `}`/`]`.
 * If all three fail, returns `{ raw, parsed: false }` so callers can decide.
 */
function parseAIJson(text) {
  if (text == null) return { raw: text, parsed: false };
  const str = typeof text === 'string' ? text : String(text);

  // Strategy 1: direct parse
  try {
    return JSON.parse(str);
  } catch (_) { /* fall through */ }

  // Strategy 2: fenced code block
  const fenceMatch = str.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch && fenceMatch[1]) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch (_) { /* fall through */ }
  }

  // Strategy 3: slice from first opener to last closer (object or array)
  const objStart = str.indexOf('{');
  const objEnd = str.lastIndexOf('}');
  const arrStart = str.indexOf('[');
  const arrEnd = str.lastIndexOf(']');
  // Pick whichever bracket pair appears earlier in the response
  let start = -1, end = -1;
  if (objStart !== -1 && (arrStart === -1 || objStart < arrStart)) {
    start = objStart; end = objEnd;
  } else if (arrStart !== -1) {
    start = arrStart; end = arrEnd;
  }
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(str.slice(start, end + 1));
    } catch (_) { /* fall through */ }
  }

  return { raw: str, parsed: false };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Call OpenRouter with retry/backoff on rate-limit and 5xx errors.
 *
 * @param {string} prompt        - User message body.
 * @param {string} systemPrompt  - System message body.
 * @param {Object} [opts]
 * @param {number} [opts.maxTokens=10000]
 * @param {number} [opts.temperature=0.7]
 * @param {string} [opts.model]
 * @param {number} [opts.maxRetries=2]
 * @returns {Promise<string>} - Raw text content from the AI response.
 */
async function callOpenRouter(prompt, systemPrompt, opts = {}) {
  const {
    maxTokens = 10000,
    temperature = 0.7,
    model = DEFAULT_MODEL,
    maxRetries = 2,
  } = opts;

  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  const referer =
    process.env.AI_HTTP_REFERER ||
    process.env.CLIENT_URL ||
    'http://localhost:3000';

  const body = JSON.stringify({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    max_tokens: maxTokens,
    temperature,
  });

  let attempt = 0;
  let lastErr;
  while (attempt <= maxRetries) {
    try {
      const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': referer,
          'X-Title': 'AI Fitness Coach',
        },
        body,
      });

      if (response.status === 429 || response.status >= 500) {
        const retryAfter = parseInt(response.headers.get('retry-after') || '0', 10);
        const delay = retryAfter > 0 ? retryAfter * 1000 : Math.min(8000, 500 * 2 ** attempt);
        lastErr = new Error(`OpenRouter HTTP ${response.status}`);
        if (attempt < maxRetries) {
          logger.warn(`OpenRouter ${response.status} — retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
          await sleep(delay);
          attempt += 1;
          continue;
        }
        throw lastErr;
      }

      const data = await response.json();
      if (data && data.error) {
        throw new Error(data.error.message || 'OpenRouter API Error');
      }
      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('OpenRouter response missing choices[0].message.content');
      }
      return content;
    } catch (err) {
      lastErr = err;
      // Network errors — retry with backoff
      if (attempt < maxRetries) {
        const delay = Math.min(8000, 500 * 2 ** attempt);
        logger.warn(`OpenRouter call error: ${err.message} — retrying in ${delay}ms`);
        await sleep(delay);
        attempt += 1;
        continue;
      }
      throw err;
    }
  }
  throw lastErr || new Error('OpenRouter call failed');
}

/**
 * Extract a numeric "calories burned" estimate from free-form AI text.
 * Used so workout inserts no longer hard-code 0. Returns null if not found.
 */
function extractCaloriesFromText(text) {
  if (!text || typeof text !== 'string') return null;
  // Look for patterns like "Estimated calories burned: 350" or "~400 kcal"
  const patterns = [
    /(?:calories?\s*(?:burned)?[:\s]*~?\s*)(\d{2,5})/i,
    /(\d{2,5})\s*(?:kcal|calories?)/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m && m[1]) {
      const n = parseInt(m[1], 10);
      if (n > 0 && n < 10000) return n;
    }
  }
  return null;
}

module.exports = {
  callOpenRouter,
  parseAIJson,
  assertOpenRouterConfigured,
  extractCaloriesFromText,
  DEFAULT_MODEL,
};
