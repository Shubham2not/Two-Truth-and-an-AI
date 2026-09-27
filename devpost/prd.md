---
doc: prd
status: approved
---

# Two Truths and an AI — Product Requirements

A single-page party game where an LLM plays a dry, slightly smug lie detector and explains its reasoning before the user reveals the truth.
Source: `scope.md > The Unique Kernel`, `scope.md > Who It's For`, `scope.md > The Core Loop`.

## The Core Journey

1. **Arrival**: The user opens the app to a clean, centered card in dark mode. The title and tagline establish the AI's confident persona immediately: *"Tell me three things. I'll tell you which one's a lie."*
2. **Input**: The user enters three statements (two truths, one lie) in stacked text fields with evocative example placeholders.
3. **Trigger**: When all three fields have content, the user clicks an in-character action button (*"Let's see through you"*).
4. **Analysis & Pause**: The button swaps to an in-voice thinking indicator (*"Reading you..."*), and the app calls the LLM in the background.
5. **Reasoning & Pick Phase**: The statements are displayed with a one-line deadpan evaluation under each. The AI's suspect statement is clearly highlighted as its pick. Below the statements, the user is invited to select which statement was actually the lie.
6. **The Reveal (Punchline)**: Upon clicking their actual lie, the AI reacts in character:
   - **AI Right**: Unsurprised, effortless smugness (*"Obviously. That one had 'made up on the spot' written all over it."*).
   - **AI Wrong**: The persona cracks slightly with begrudging respect (*"...Huh. Didn't see that one coming. Fine — that one was good."*).
7. **Reset**: An in-voice button (*"Try me again"*) instantly resets the state back to a fresh input screen.

## Screens and Layout

The app consists of a single surface: a centered card layout on a slate/charcoal dark background with crisp typography. The card transitions through three distinct phases without page reloads:
- **Phase 1 (Input Card)**: Header + 3 stacked input fields + Submit button.
- **Phase 2 (Reasoning & Pick Card)**: Header + 3 statement cards displaying the AI's deadpan one-line critique + prompt asking the user to click the real lie.
- **Phase 3 (Reveal Card)**: The chosen statements + the AI's reaction banner (in-character victory or defeat line) + "Try me again" reset button.

## Look and Feel

- **Theme**: Dark mode, deep slate/charcoal tones (`#0f172a`, `#1e293b`).
- **Typography**: Clean, crisp modern sans-serif (e.g., Inter or system font stack). High readability and high contrast.
- **Color Accent**: Single restrained accent color (e.g., a subdued indigo/violet or amber) used strictly for the AI's pick marker and action buttons. Neutral grayscale everywhere else.
- **Tone & Style**: Understated, minimal, and self-assured. No emojis, no confetti, no loud borders or gamified icons. The typography and copy deliver the emotional punch.

## Features and Behavior

### 1. Statement Submission
- Source: `scope.md > The Core Loop`
- The user provides three distinct statements.
- **Criteria**:
  - [ ] Submit button remains disabled or inert until all 3 fields contain non-whitespace text.
  - [ ] Clicking submit transitions the button text to *"Reading you..."* and prevents double submissions.

### 2. AI Reasoning Display
- Source: `scope.md > The Unique Kernel`
- A single LLM prompt processes all three statements simultaneously, outputting:
  1. The AI's designated lie (Statement 1, 2, or 3).
  2. A single concise, deadpan reasoning sentence for each of the three statements.
- **Criteria**:
  - [ ] Each statement displays its custom one-line reasoning below it.
  - [ ] The statement the AI believes is the lie is visually distinguished (subtle accent border, badge, or tag).
  - [ ] Tone of reasoning is flat, confident, and observant, avoiding hedge words.

### 3. Truth Reveal & Character Reaction
- Source: `scope.md > Inspiration & Identity`
- The user clicks the statement that was their actual lie.
- **Criteria**:
  - [ ] Clicking a statement immediately triggers the reveal view.
  - [ ] If user pick == AI pick: AI delivers an unsurprised, self-assured reaction line.
  - [ ] If user pick != AI pick: AI delivers a dry, slightly cracked composure line expressing begrudging respect.
  - [ ] The visual structure of the reveal is identical in both outcomes (symmetrical design).

### 4. Session Reset & Error Handling
- Source: `scope.md > The POC Boundary`
- **Criteria**:
  - [ ] Clicking *"Try me again"* clears all inputs, resets all states, and returns to Phase 1.
  - [ ] If the API call fails, times out, or returns a malformed/unparseable response, the app displays the dry in-character error message (*"...I got distracted. Try that again."*) with a retry action button, keeping technical details hidden.

## States and Boundaries

- **Input State**: Blank form ready for user entry.
- **Loading / Analyzing State**: Button in *"Reading you..."* state; fields disabled.
- **Reasoning / Awaiting Reveal State**: AI critiques shown; AI pick highlighted; user click awaited.
- **Revealed State**: Reaction line displayed; reset button available.
- **Error State**: In-character failure notice with retry button.
- **Persistence Boundary**: Zero persistence. Refreshing or resetting the page discards all statements and results.

## Product Decisions

- **Reasoning before Reveal**: The AI's breakdown is shown prior to asking the user for the real answer to build anticipation.
- **Character in Defeat**: Rather than staying 100% smug or collapsing completely, the persona cracks slightly with begrudging respect when fooled.
- **In-Character Errors**: API failures are masked with a deadpan in-voice message to maintain game immersion.
- **Single-Page No-Scroll Rhythm**: All interaction happens within a tight, centered card to preserve a party-game conversational tempo.

## What We're Building

- Clean, single-card responsive web interface.
- 3 input fields with smart validation.
- LLM prompt orchestration delivering structured JSON (target pick + 3 reasonings).
- Interactive reveal mechanism with branching in-character reaction lines.
- One-click session reset.

## Deferred From the POC

- Confidence percentages or probability meters.
- Pattern recognition breakdowns (e.g. linguistic cues analysis).
- History log of previous rounds within a session.

## Non-Goals

- User authentication or player profiles.
- Database storage or persistence across sessions.
- Multiplayer or network-synchronized lobbies.
- Sound effects, confetti, or celebratory animations.

## Open Questions

- *Technical (addressed in `4-spec`)*: Specific LLM provider (OpenAI, Gemini, Anthropic, or local/Groq), API key handling approach (client-side configuration vs serverless proxy / environment variable).
