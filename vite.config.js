import { defineConfig } from 'vite';
import dotenv from 'dotenv';

// Load .env into process.env at config time, before any request arrives.
// Vite only auto-exposes VITE_* prefixed vars to the client bundle —
// GEMINI_API_KEY stays server-side because it has no VITE_ prefix.
dotenv.config();

/**
 * Vite plugin that intercepts POST /api/analyze and proxies
 * the request to the Gemini API, keeping the API key server-side.
 *
 * HOW THE PROXY WORKS:
 * 1. Browser sends POST /api/analyze with { statements: [s1, s2, s3] }
 * 2. Vite's dev server intercepts the request in this middleware
 * 3. Middleware reads GEMINI_API_KEY from process.env (loaded from .env)
 * 4. Middleware builds a Gemini API request with a persona prompt + JSON schema
 * 5. Gemini responds with guaranteed-schema JSON
 * 6. Middleware forwards the clean JSON back to the browser
 *
 * The browser never sees, touches, or bundles the API key.
 */
function geminiProxyPlugin() {
  return {
    name: 'gemini-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // Only intercept POST /api/analyze — let everything else pass through
        if (req.method !== 'POST' || req.url !== '/api/analyze') {
          return next();
        }

        try {
          // --- Step 1: Read the request body from the browser ---
          const body = await readBody(req);
          const { statements } = JSON.parse(body);

          if (!Array.isArray(statements) || statements.length !== 3) {
            return sendJson(res, 400, { error: 'Exactly 3 statements required.' });
          }

          // --- Step 2: Check for API key ---
          const apiKey = process.env.GEMINI_API_KEY;
          if (!apiKey || apiKey === 'your_api_key_here') {
            console.error('[proxy] GEMINI_API_KEY missing in .env');
            return sendJson(res, 500, { error: 'API key not configured.' });
          }

          // --- Step 3: Call Gemini ---
          const geminiResult = await callGemini(apiKey, statements);
          return sendJson(res, 200, geminiResult);

        } catch (err) {
          console.error('[proxy] Error:', err.message || err);
          return sendJson(res, 500, { error: 'Analysis failed.' });
        }
      });
    }
  };
}

/**
 * Calls the Gemini API with the deadpan persona prompt and
 * a strict response schema that GUARANTEES valid JSON output.
 *
 * HOW STRUCTURED OUTPUT WORKS:
 * - We set `response_mime_type: "application/json"` which tells Gemini
 *   to only output valid JSON (no markdown, no prose, no code fences).
 * - We provide a `response_schema` that acts as a contract: Gemini's
 *   output MUST conform to this exact shape or the API rejects it internally.
 * - This means we never need regex parsing, string cleaning, or fallback
 *   extraction — the response is always a clean { suspectedLie, reasoning }.
 */
async function callGemini(apiKey, statements) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;

  const systemPrompt = `You are a dry, slightly smug lie detector playing "Two Truths and a Lie." You analyze three personal statements and identify which one is the lie. Your reasoning is deadpan, confident, and observational — like someone sizing up a stranger at a poker table. Never hedge, never use words like "might" or "possibly." Be terse. Be certain. Be slightly amused that this is so easy for you.`;

  const userPrompt = `Here are three statements from a player. Two are true, one is a lie. Analyze each one and tell me which is the lie.

Statement 1: "${statements[0]}"
Statement 2: "${statements[1]}"
Statement 3: "${statements[2]}"`;

  const requestBody = {
    system_instruction: {
      parts: [{ text: systemPrompt }]
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }]
      }
    ],
    generationConfig: {
      response_mime_type: 'application/json',
      response_schema: {
        type: 'OBJECT',
        properties: {
          suspectedLie: {
            type: 'INTEGER',
            description: 'The 1-based index (1, 2, or 3) of the statement you believe is the lie.'
          },
          reasoning: {
            type: 'ARRAY',
            items: { type: 'STRING' },
            description: 'Exactly three concise, deadpan sentences — your evaluation of Statement 1, Statement 2, and Statement 3, in order.'
          }
        },
        required: ['suspectedLie', 'reasoning']
      }
    }
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[proxy] Gemini API error:', response.status, errorText);
    throw new Error(`Gemini API returned ${response.status}`);
  }

  const data = await response.json();

  // Extract the structured JSON from Gemini's response envelope
  const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textContent) {
    throw new Error('Gemini response missing expected content structure');
  }

  // Because we used response_schema, textContent is guaranteed valid JSON
  const parsed = JSON.parse(textContent);

  // Validate the shape we expect
  if (
    typeof parsed.suspectedLie !== 'number' ||
    parsed.suspectedLie < 1 || parsed.suspectedLie > 3 ||
    !Array.isArray(parsed.reasoning) ||
    parsed.reasoning.length !== 3
  ) {
    throw new Error('Gemini response did not match expected schema shape');
  }

  return parsed;
}

/** Read the full request body as a string. */
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

/** Send a JSON response with status code. */
function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

export default defineConfig({
  plugins: [geminiProxyPlugin()],
  server: {
    port: 5173,
    host: 'localhost'
  }
});
