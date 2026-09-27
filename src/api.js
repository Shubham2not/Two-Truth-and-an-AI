/**
 * Client-side API helper.
 *
 * This file makes the fetch call from the BROWSER to our LOCAL proxy route.
 * The browser never contacts Gemini directly — it only talks to /api/analyze
 * on the same origin (localhost:5173), and the Vite middleware handles the rest.
 */

/**
 * Sends the three statements to the local proxy and returns the AI's analysis.
 *
 * @param {string[]} statements - Array of exactly 3 statement strings
 * @returns {Promise<{suspectedLie: number, reasoning: string[]}>}
 * @throws {Error} If the request fails or the response is not valid JSON
 */
export async function analyzeStatements(statements) {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ statements })
  });

  if (!response.ok) {
    throw new Error(`Server responded with ${response.status}`);
  }

  const data = await response.json();

  // If the proxy returned an error object instead of analysis data
  if (data.error) {
    throw new Error(data.error);
  }

  return data;
}
