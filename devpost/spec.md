---
doc: spec
status: approved
---

# Two Truths and an AI — Technical Spec

## How This Works, In Plain Language

The app runs as a single web page in your browser, powered locally by Vite. Everything lives inside one centered card that shifts through three phases: taking your statements, showing the AI's analysis, and revealing the punchline.

When you enter your three statements and click the button, the browser sends them to a local server route (`/api/analyze`) running inside the local Vite development server. That local route reads your Gemini API key from a private `.env` file (so the key never touches the browser or your git commits), wraps your statements in a deadpan persona prompt, and calls Google Gemini (`gemini-2.5-flash`).

Gemini uses native structured output (a strict JSON schema), which forces the model to respond in clean, machine-readable JSON containing its suspected lie (1, 2, or 3) and a single deadpan sentence of reasoning for each statement. The local server forwards this clean JSON back to the browser.

The browser updates its in-memory state and re-renders the card into the reasoning view. Once you click the statement that was actually your lie, the client checks if your pick matches the AI's pick and displays the corresponding in-character reaction: calm smugness if it was right, or a begrudging crack in its composure if you fooled it.

## The Core Journey Through the System

1. **User opens page**: Browser loads `index.html`, `style.css`, and `main.js`. State initializes to `{ phase: 'INPUT', statements: ['', '', ''] }`. The input card renders.
2. **User types statements**: Input listeners update `statements[0..2]`. Once all three contain non-whitespace text, the submit button enables.
3. **User clicks "Let's see through you"**:
   - State sets `phase: 'LOADING'`.
   - Submit button text becomes *"Reading you..."* and disables to prevent duplicate clicks.
   - Browser sends `POST /api/analyze` with `{ statements: [...] }`.
4. **Proxy executes**:
   - Vite middleware intercepts `POST /api/analyze`.
   - Reads `GEMINI_API_KEY` from `.env`.
   - Sends a request to Google's Gemini API with `response_mime_type: "application/json"` and a strict response schema enforcing `{ suspectedLie: number, reasoning: string[] }`.
   - Receives and validates the JSON response.
   - Responds to the browser with status 200 and the JSON payload.
5. **Browser receives analysis**:
   - State updates to `{ phase: 'REASONING', suspectedLie, reasoning }`.
   - Card transitions to display the three statements, each accompanied by its deadpan reasoning line.
   - The AI's suspected lie is given visual accent styling.
   - Below the statements, the prompt asks the user to click their actual lie.
6. **User clicks their actual lie**:
   - State updates to `{ phase: 'REVEAL', userLieIndex }`.
   - The browser compares `userLieIndex` with `suspectedLie`:
     - Match: AI victory line (*"Obviously. That one had 'made up on the spot' written all over it."*).
     - Mismatch: AI defeat line (*"...Huh. Didn't see that one coming. Fine — that one was good."*).
   - "Try me again" reset button appears.
7. **User clicks "Try me again"**:
   - State resets to `{ phase: 'INPUT', statements: ['', '', ''] }`.
   - Card re-renders back to clean Phase 1.

## Stack

- **Core**: Vanilla HTML5, CSS3, JavaScript (ES modules)
  - *Rationale*: Zero framework overhead, absolute transparency for understanding every line of code, and fast prototyping for a single-card interface.
- **Build Tool & Local Server**: Vite (`vite@latest`)
  - *Rationale*: Instant development server, zero-config ES module bundling, and built-in dev-server middleware capability to host the `/api/analyze` proxy route without needing a separate backend process.
  - *Docs*: [Vite Documentation](https://vite.dev)
- **AI Model & API**: Google Gemini (`gemini-3.8-flash`) via Google AI Studio
  - *Rationale*: Free-tier access suitable for hackathons, low latency, and native JSON schema output (`responseSchema`) guaranteeing strict structured data without regex parsing.
  - *Note*: Originally planned for `gemini-2.5-flash`, which was deprecated for new API keys during the build. Updated to `gemini-3.8-flash` per Google's migration notice.
  - *Docs*: [Google Gemini API Docs](https://ai.google.dev/docs)

## Where It Runs and How Someone Tries It

- **Runtime**: Local Node.js environment (v18+) and modern web browser (Chrome, Edge, Firefox, Safari).
- **Environment**: A `.env` file containing `GEMINI_API_KEY=your_api_key_here`. (A `.env.example` file is committed to git; `.env` is git-ignored).
- **Start Command**:
  ```bash
  npm install
  npm run dev
  ```
- **Demo & Submission**:
  - The app runs at `http://localhost:5173`.
  - For the hackathon submission: a short screen-recording video demonstrating a complete round (input, reasoning, reveal, and reset) plus a public GitHub repository. No cloud hosting or remote deployment required.

## Look and Feel

- **Direction**: Dark mode, minimal, restrained, slightly cynical.
- **Palette**: Deep slate and charcoal backgrounds (`#0f172a`, `#1e293b`), subtle borders (`#334155`), high-contrast off-white text (`#f8fafc`), muted secondary text (`#94a3b8`).
- **Accent**: Single restrained accent color (violet/indigo `#818cf8` or amber `#f59e0b`) reserved exclusively for the AI's suspected lie indicator and primary action states.
- **Typography**: Clean sans-serif system stack or Inter font; crisp line heights; no emojis, gamified badges, or whimsical animations.
- **Copy Tone**: Terse, observant, deadpan, and unbothered.

## Components

The UI is a single centered `<main class="card">` that dynamically swaps its inner template depending on the current phase:

### 1. InputCard
- **What it does**: Renders the header, 3 text input fields, and the submit button. Manages input validation (enabling submit only when all 3 fields are non-empty).
- **PRD ref**: `prd.md > Screens and Layout (Phase 1)`, `prd.md > Features and Behavior (1. Statement Submission)`.

### 2. ReasoningCard
- **What it does**: Displays the 3 statements in cards. Under each, renders the AI's deadpan evaluation. Visually tags the AI's suspected lie. Renders an invitation for the user to click their true lie.
- **PRD ref**: `prd.md > Screens and Layout (Phase 2)`, `prd.md > Features and Behavior (2. AI Reasoning Display)`.

### 3. RevealCard
- **What it does**: Shows the outcome banner with in-character copy based on whether the AI was right or wrong. Displays the "Try me again" reset button.
- **PRD ref**: `prd.md > Screens and Layout (Phase 3)`, `prd.md > Features and Behavior (3. Truth Reveal & Character Reaction)`.

### 4. ErrorState
- **What it does**: Displays the in-character failure copy (*"...I got distracted. Try that again."*) and a retry button if the proxy or Gemini API fails.
- **PRD ref**: `prd.md > Features and Behavior (4. Session Reset & Error Handling)`.

### 5. Backend Proxy Route (`/api/analyze`)
- **What it does**: Vite plugin middleware intercepting `POST /api/analyze`. Extracts statements, calls the Gemini API with the system prompt and schema, and returns JSON `{ suspectedLie: 1|2|3, reasoning: [string, string, string] }`.
- **PRD ref**: `prd.md > Technical Decisions`.

## Data Model

All application data lives in client-side memory in a single state store in `main.js`:

```javascript
const state = {
  phase: 'INPUT', // 'INPUT' | 'LOADING' | 'REASONING' | 'REVEAL' | 'ERROR'
  statements: ['', '', ''],
  suspectedLie: null, // 1 | 2 | 3
  reasoning: [],      // [string, string, string]
  userLieIndex: null, // 1 | 2 | 3
  errorMessage: null  // string | null
};
```

- **Persistence**: Strictly zero persistence. Reloading the page or clicking "Try me again" restores the default initial state. No `localStorage`, no database.

## File Structure

```
Two-Truths-and-an-AI/
├── .env.example            # Template for required environment variables (GEMINI_API_KEY)
├── .env                    # Local secrets (git-ignored)
├── .gitignore              # Ignores node_modules, .env, dist
├── package.json            # Project manifest (type: module, vite dependency)
├── vite.config.js          # Vite config with custom middleware for POST /api/analyze
├── index.html              # Single HTML shell holding the root card container
├── style.css               # Vanilla CSS design system (slate palette, typography, card layouts)
├── src/
│   ├── main.js             # State machine, DOM rendering, event handlers
│   └── api.js              # Client-side helper making fetch('/api/analyze') calls
└── devpost/                # Hackathon artifacts
    ├── learner-profile.md
    ├── scope.md
    ├── prd.md
    └── spec.md
```

## External Services and Dependencies

### Google Gemini API
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`
- **Authentication**: API key provided in request URL parameter or `x-goog-api-key` header from server proxy.
- **Request Payload**:
  ```json
  {
    "contents": [
      {
        "role": "user",
        "parts": [
          { "text": "Analyze these three statements and pick which one is the lie..." }
        ]
      }
    ],
    "generationConfig": {
      "response_mime_type": "application/json",
      "response_schema": {
        "type": "OBJECT",
        "properties": {
          "suspectedLie": {
            "type": "INTEGER",
            "description": "The 1-based index (1, 2, or 3) of the statement you believe is the lie."
          },
          "reasoning": {
            "type": "ARRAY",
            "items": { "type": "STRING" },
            "description": "Exactly three concise, deadpan sentences explaining your evaluation of Statement 1, 2, and 3 in order."
          }
        },
        "required": ["suspectedLie", "reasoning"]
      }
    }
  }
  ```
- **Response**: Clean JSON string in candidate content matching the schema:
  ```json
  {
    "suspectedLie": 2,
    "reasoning": [
      "Too pedestrian to be invented on the spot.",
      "The phrasing has that slight stiffness of someone making up details as they go.",
      "Oddly specific date and location — usually a tell of truth."
    ]
  }
  ```
- **Cost & Limits**: Gemini free tier covers 15 RPM (requests per minute), which is more than adequate for local demoing.

## Important Failure Modes

1. **Network or Gemini API Outage / Timeout**:
   - *Cause*: Network drop, rate limit hit, or Gemini service issue.
   - *Fallback*: Instead of exposing raw HTTP errors, the card shifts to `phase: 'ERROR'`, showing: *"...I got distracted. Try that again."* with a "Retry" button that re-fires the call.
2. **Malformed or Unexpected JSON**:
   - *Cause*: Upstream proxy parsing failure.
   - *Fallback*: The proxy catches any parsing/validation failure and returns a standard error code; the frontend handles it identically with the in-character fallback message and retry option.
3. **Missing API Key**:
   - *Cause*: User runs `npm run dev` before creating `.env` or setting `GEMINI_API_KEY`.
   - *Fallback*: Vite middleware logs a clear console message (`[proxy] GEMINI_API_KEY missing in .env`) and sends a 500 error; the client shows the friendly in-character error.

## What Was Simplified and Why

- **Vite Dev Server Middleware instead of a separate Express/Fastify server**: Keeps the local development experience down to a single terminal process (`npm run dev`) and eliminates extra dependencies, while still keeping the API key strictly server-side.
- **Direct REST `fetch` in Node instead of an SDK**: Eliminates dependency churn and makes the HTTP request/response flow transparent and easy to trace.
- **Single-card DOM swapping instead of a routing library**: A simple `render()` function that clears and injects template strings based on `state.phase` keeps the codebase approachable and free of framework abstractions.
- **In-memory state instead of LocalStorage / DB**: Keeps the POC lightweight and true to a quick-turn party game where every game starts fresh.

## Decisions and Open Issues

### Recorded Decisions
1. **Architecture & Stack**: Vite + Vanilla HTML/CSS/JS. Rationale: minimal, fast, and completely inspectable.
2. **LLM Provider**: Google Gemini (`gemini-2.5-flash`) via Google AI Studio. Rationale: free tier, low latency, native JSON schema support.
3. **API Key Security**: Server-side proxy route (`POST /api/analyze`) implemented in Vite dev server middleware to ensure `GEMINI_API_KEY` is never exposed in the browser bundle or committed to the public GitHub repo.

### Learner Uncertainty & Transparency Commitment
The learner requested explicit, step-by-step transparency during the build rather than rushing through code generation. Specifically:
- **Proxy Route Mechanics**: Explain clearly how `fetch('/api/analyze')` travels from the browser to Vite's server middleware, how `.env` is read server-side, and how the request is dispatched to Google.
- **Guaranteed JSON via Schema**: Show exactly how Gemini's `response_schema` works to guarantee valid JSON without needing fragile regex or manual string cleaning.
- **Frontend State Flow**: Walk through the state machine (`INPUT` → `LOADING` → `REASONING` → `REVEAL`) and how the DOM transitions between phases cleanly.

*This walkthrough will be conducted incrementally during each step of `5-build`.*

### Open Questions
- None remaining. All technical and product questions from PRD have been resolved.

### Submission & Sharing Artifacts
- **Public GitHub Repository**: https://github.com/Shubham2not/Two-Truth-and-an-AI
- **Live Deployment**: https://ttaaai.vercel.app/
- **Demo Video**: https://youtu.be/Nd6gSQU-P6I

