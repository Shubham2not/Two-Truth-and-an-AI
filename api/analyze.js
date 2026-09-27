/**
 * Vercel Serverless Function for POST /api/analyze
 *
 * Intercepts frontend requests in production on Vercel, keeps GEMINI_API_KEY
 * secure on the server, and returns structured deadpan analysis.
 */
export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { statements } = req.body || {};

    if (!Array.isArray(statements) || statements.length !== 3) {
      return res.status(400).json({ error: 'Exactly 3 statements required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured in environment.' });
    }

    const models = ['gemini-3.5-flash', 'gemini-3.8-flash'];

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

    let lastError = null;
    for (let i = 0; i < models.length; i++) {
      const model = models[i];
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.warn(`[Vercel Serverless] Model ${model} returned ${response.status}:`, errorText.slice(0, 150));
          lastError = new Error(`Gemini API returned ${response.status}`);

          if ((response.status === 429 || response.status === 503) && i < models.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1200));
          }
          continue;
        }

        const data = await response.json();
        const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textContent) {
          throw new Error('Gemini response missing expected content structure');
        }

        const parsed = JSON.parse(textContent);
        if (
          typeof parsed.suspectedLie !== 'number' ||
          parsed.suspectedLie < 1 ||
          parsed.suspectedLie > 3 ||
          !Array.isArray(parsed.reasoning) ||
          parsed.reasoning.length !== 3
        ) {
          throw new Error('Gemini response does not match expected schema');
        }

        return res.status(200).json(parsed);
      } catch (err) {
        lastError = err;
      }
    }

    return res.status(500).json({ error: lastError?.message || 'Analysis failed.' });
  } catch (err) {
    console.error('[Vercel Serverless] Error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
