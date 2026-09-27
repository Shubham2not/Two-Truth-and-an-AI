---
doc: scope
status: approved
---

# Two Truths and an AI

A single-page party game where an LLM plays lie detector — and shows its work.

## The Unique Kernel

The interesting part isn't whether the AI guesses right. It's that the AI explains its reasoning for each statement *before* you reveal the answer — building anticipation, then paying it off. The pacing (reasoning first, reveal second) is as important as the reasoning itself. The reveal should land like a punchline.

## Who It's For

Someone at a party or in a friend group who wants a quick, shareable moment — they pull up the app, type in their three statements, and show the AI's verdict to the room. The app is for one person playing at a time, but the audience is the people watching.

## The Core Loop

Open the app → type three statements about yourself → submit → read the AI's one-line reasoning for each, delivered in a dry, confident tone → pick which statement was actually the lie → see whether the AI was right or wrong, with the AI reacting in character.

## Inspiration & Identity

Tone: dry and deadpan. The AI should come across as a slightly smug lie detector — confident, understated, a little condescending, as if it finds you mildly easy to read. Not cartoonish or exclamation-point-heavy. The humor comes from the AI's flat, self-assured delivery.

The reveal states ("AI got it right" / "AI was fooled") should feel like the AI reacting in character — not a neutral system message.

Visual: clean, minimal UI. The design stays out of the way of the tone. No loud colors, no emoji, no confetti. The words do the work.

## Why This Matters to the Learner

Primarily a learning exercise — practicing plan-first development with an AI coding agent, especially the "when to step in vs. let it run" side of collaboration. A party game is the right size: small enough to finish, interesting enough to actually show someone.

## What "Working" Looks Like

Someone opens the page, types three statements, submits, sees the AI's reasoning for all three in its signature dry tone, picks the lie, and finds out whether the AI called it right — with the AI reacting in character. That "fooled you" or "as expected" moment is the demo beat. No login, no setup, no explanation required.

## The POC Boundary

**In:**
- Single HTML page (or equivalent single-page app)
- Three text inputs and a submit button
- One LLM API call that returns: which statement it suspects is false + one-line reasoning per statement
- A reveal step where the user picks the actual lie
- A result state: "AI got it right" or "AI was fooled," with the AI reacting in character
- Clean, minimal styling that supports the deadpan tone

**Out of scope for POC:**
- Accounts, database, or any persistence
- Multiplayer or shared sessions
- Deployment (demo video can be recorded locally)

## Later

- Confidence score per statement (stretch goal from original brief)
- A short note from the AI on what pattern in the writing tipped it off
- Round history within a session

## Explicitly Cut

- **Accounts / login** — no user to authenticate; adds complexity with zero proof-of-concept value
- **Database / persistence** — a party game doesn't need memory; state lives in the page
- **Multiplayer** — one player at a time is the right scope; the audience is in the room, not on the network
