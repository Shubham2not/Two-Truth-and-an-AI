---
doc: checklist
status: approved
---

# Build Checklist

Build mode: learn

## Slices

- [ ] **1. Scaffold input card with responsive validation and loading state**
  Becomes usable: A running app at `http://localhost:5173` showing the centered dark slate card, in-character title and tagline, three stacked statement inputs with example placeholders, and the "Let's see through you" button that enables only when all three fields have content and switches to "Reading you..." when clicked.
  Why now: Establishes the runnable project foundation (Vite setup, styling system, card layout) and the first user touchpoint, proving the input state and transition before wiring external dependencies.
  PRD ref: `prd.md > The Core Journey` (steps 1-4), `prd.md > Features and Behavior` (1. Statement Submission)
  Spec ref: `spec.md > Stack`, `spec.md > Look and Feel`, `spec.md > Components` (1. InputCard)
  Build: Initialize `package.json`, Vite configuration, `index.html`, `style.css` (dark slate theme, typography, card layout), and `src/main.js` with the state store, three inputs, live validation, and loading transition.
  Verify (mechanical): Start the Vite dev server and confirm it runs with no build or console errors; verify DOM elements and input validation logic.
  Learner check: Open `http://localhost:5173`, type into the three fields, watch the button enable, click it, and see the button text swap to "Reading you...".
  Commit: `Scaffold input card with responsive validation and loading state`

- [ ] **2. Implement Gemini proxy route and reasoning reveal card**
  Becomes usable: Submitting statements triggers the local backend proxy (`POST /api/analyze`), which calls Google Gemini with a deadpan persona prompt and native JSON schema. The app transitions to Phase 2, displaying each statement with its one-line deadpan evaluation and highlighting the AI's suspected lie.
  Why now: Proves the **unique kernel** and de-risks the primary technical unknown (server-side API key handling, proxy middleware, and guaranteed JSON schema output) immediately after scaffolding.
  PRD ref: `prd.md > The Core Journey` (step 5), `prd.md > Features and Behavior` (2. AI Reasoning Display, 4. Session Reset & Error Handling)
  Spec ref: `spec.md > Components` (2. ReasoningCard, 4. ErrorState, 5. Backend Proxy Route), `spec.md > External Services and Dependencies`
  Build: Add Vite dev server middleware in `vite.config.js` to handle `/api/analyze`, load `GEMINI_API_KEY` from `.env`, call Gemini with `response_schema` enforcing `{ suspectedLie, reasoning }`, implement in-character error fallback, and render Phase 2 (ReasoningCard) in `src/main.js`.
  Verify (mechanical): Send a test POST request to `/api/analyze` to confirm valid JSON output adhering to schema; confirm UI renders the 3 statements, reasoning lines, and suspected lie accent.
  Learner check: Enter three statements, submit, and read the AI's deadpan evaluation of your claims along with its highlighted pick.
  Commit: `Implement Gemini proxy and reasoning reveal card`

- [ ] **3. Add interactive truth reveal, character reactions, and session reset**
  Becomes usable: The user clicks the statement that was their actual lie, triggering the punchline reveal card (smug victory if AI was right, begrudging crack in composure if wrong) and the "Try me again" reset button that clears state back to Phase 1.
  Why now: Completes the full core journey from start to finish, delivering the emotional payoff and enabling infinite replayability.
  PRD ref: `prd.md > The Core Journey` (steps 6-7), `prd.md > Features and Behavior` (3. Truth Reveal & Character Reaction, 4. Session Reset)
  Spec ref: `spec.md > Components` (3. RevealCard), `spec.md > Data Model`
  Build: Add click handlers to statement cards in Phase 2, calculate win/loss outcome in `src/main.js`, render symmetrical Phase 3 (RevealCard) with in-character reaction copy, and wire "Try me again" to cleanly reset in-memory state.
  Verify (mechanical): Test statement selection to confirm correct win/loss outcome evaluation and reaction copy rendering; verify clicking reset clears all state back to initial Phase 1.
  Learner check: Play a full round from input to reveal to reset, intentionally testing both winning against the AI and letting the AI guess right.
  Commit: `Add interactive truth reveal, character reactions, and session reset`

## Hands-on Checkpoints

- [ ] Early usable behavior explored — Phase 2 reasoning card with live AI breakdown (Slice 2)
- [ ] Final kick-the-tires exploration and feedback completed — Full game loop and edge cases (Slice 3)

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: [to be recorded upon completion]
Route and stops: [to be recorded upon completion]
Edit outcome: [to be recorded upon completion]
Reflection: [to be recorded upon completion]
Activity mode: [to be recorded upon completion]

## Revisions
