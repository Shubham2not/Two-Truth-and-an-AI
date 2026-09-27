/**
 * Two Truths and an AI — State Machine & UI Controller
 *
 * HOW THE FRONTEND STATE MACHINE WORKS:
 *
 * The app has one global `state` object and a single `render()` function.
 * Every user action (typing, clicking submit, clicking a statement) mutates
 * the state and then calls `render()`, which clears the card and injects
 * the HTML template for the current phase.
 *
 * Phase transitions:
 *   INPUT ──(submit)──▶ LOADING ──(API success)──▶ REASONING
 *                           │                           │
 *                           ▼                      (click lie)
 *                         ERROR ◀──(API failure)        │
 *                           │                           ▼
 *                       (retry)──▶ LOADING           REVEAL
 *                                                       │
 *                                                  (try again)
 *                                                       │
 *                                                       ▼
 *                                                     INPUT
 */

import { analyzeStatements } from './api.js';

// ────────────────────────────────────────────────
// Application State Store
// ────────────────────────────────────────────────
const state = {
  phase: 'INPUT', // 'INPUT' | 'LOADING' | 'REASONING' | 'REVEAL' | 'ERROR'
  statements: ['', '', ''],
  suspectedLie: null, // 1 | 2 | 3
  reasoning: [],      // [string, string, string]
  userLieIndex: null, // 1 | 2 | 3
  errorMessage: null
};

const appContainer = document.getElementById('app');

// ────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────

/** Checks if all three statements contain non-whitespace text. */
function areStatementsValid() {
  return state.statements.every(stmt => stmt && stmt.trim().length > 0);
}

/** Escapes HTML characters in user input to prevent XSS. */
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ────────────────────────────────────────────────
// Phase 1: Input Card
// ────────────────────────────────────────────────

function renderInputCard() {
  const isValid = areStatementsValid();
  const isLoading = state.phase === 'LOADING';

  appContainer.innerHTML = `
    <header class="header">
      <h1 class="title">Two Truths and an AI</h1>
      <p class="tagline">"Tell me three things. I'll tell you which one's a lie."</p>
    </header>

    <form id="statements-form" onsubmit="return false;">
      <div class="statement-group">
        <div class="field-wrapper">
          <label class="field-label" for="stmt-1">Statement 1</label>
          <input 
            type="text" 
            id="stmt-1" 
            class="text-input" 
            placeholder="e.g., I've never broken a bone"
            value="${escapeHtml(state.statements[0])}"
            ${isLoading ? 'disabled' : ''}
            autocomplete="off"
            required
          />
        </div>

        <div class="field-wrapper">
          <label class="field-label" for="stmt-2">Statement 2</label>
          <input 
            type="text" 
            id="stmt-2" 
            class="text-input" 
            placeholder="e.g., I speak three languages fluently"
            value="${escapeHtml(state.statements[1])}"
            ${isLoading ? 'disabled' : ''}
            autocomplete="off"
            required
          />
        </div>

        <div class="field-wrapper">
          <label class="field-label" for="stmt-3">Statement 3</label>
          <input 
            type="text" 
            id="stmt-3" 
            class="text-input" 
            placeholder="e.g., I once won a regional chess tournament"
            value="${escapeHtml(state.statements[2])}"
            ${isLoading ? 'disabled' : ''}
            autocomplete="off"
            required
          />
        </div>
      </div>

      <button 
        type="button" 
        id="submit-btn" 
        class="action-button" 
        ${!isValid || isLoading ? 'disabled' : ''}
      >
        ${isLoading ? '<span class="loading-pulse"></span> Reading you...' : "Let's see through you"}
      </button>
    </form>
  `;

  bindInputEvents();
}

/** Attaches DOM event listeners for inputs and submission. */
function bindInputEvents() {
  const input1 = document.getElementById('stmt-1');
  const input2 = document.getElementById('stmt-2');
  const input3 = document.getElementById('stmt-3');
  const submitBtn = document.getElementById('submit-btn');

  const updateStatement = (index, value) => {
    state.statements[index] = value;
    if (submitBtn) submitBtn.disabled = !areStatementsValid();
  };

  if (input1) input1.addEventListener('input', (e) => updateStatement(0, e.target.value));
  if (input2) input2.addEventListener('input', (e) => updateStatement(1, e.target.value));
  if (input3) input3.addEventListener('input', (e) => updateStatement(2, e.target.value));

  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      if (!areStatementsValid() || state.phase === 'LOADING') return;
      handleSubmission();
    });
  }
}

// ────────────────────────────────────────────────
// Phase 2: Reasoning Card
// ────────────────────────────────────────────────

function renderReasoningCard() {
  const statementsHtml = state.statements.map((stmt, i) => {
    const index = i + 1; // 1-based
    const isSuspect = index === state.suspectedLie;
    const reasoning = state.reasoning[i] || '';

    return `
      <div class="statement-card ${isSuspect ? 'statement-card--suspect' : ''}" data-index="${index}">
        <div class="statement-card__header">
          <span class="statement-card__label">Statement ${index}</span>
          ${isSuspect ? '<span class="statement-card__badge">My pick</span>' : ''}
        </div>
        <p class="statement-card__text">${escapeHtml(stmt)}</p>
        <p class="statement-card__reasoning">${escapeHtml(reasoning)}</p>
      </div>
    `;
  }).join('');

  appContainer.innerHTML = `
    <header class="header">
      <h1 class="title">Here's what I see.</h1>
      <p class="tagline">I've made my pick. Now click the one that was actually the lie.</p>
    </header>

    <div class="reasoning-group">
      ${statementsHtml}
    </div>
  `;

  // Each statement card is clickable — the user picks their actual lie
  document.querySelectorAll('.statement-card').forEach(card => {
    card.addEventListener('click', () => {
      const index = parseInt(card.dataset.index, 10);
      handleReveal(index);
    });
  });
}

// ────────────────────────────────────────────────
// Error State
// ────────────────────────────────────────────────

function renderErrorCard() {
  appContainer.innerHTML = `
    <header class="header">
      <h1 class="title">Two Truths and an AI</h1>
    </header>

    <div class="error-block">
      <p class="error-block__message">...I got distracted. Try that again.</p>
    </div>

    <button type="button" id="retry-btn" class="action-button">
      Try that again
    </button>
  `;

  document.getElementById('retry-btn')?.addEventListener('click', () => {
    handleSubmission();
  });
}

// ────────────────────────────────────────────────
// Actions
// ────────────────────────────────────────────────

/**
 * Sends statements to the proxy and transitions state on success/failure.
 */
async function handleSubmission() {
  state.phase = 'LOADING';
  state.errorMessage = null;
  render();

  try {
    const result = await analyzeStatements(state.statements);
    state.suspectedLie = result.suspectedLie;
    state.reasoning = result.reasoning;
    state.phase = 'REASONING';
  } catch (err) {
    console.error('[App] Analysis failed:', err.message);
    state.errorMessage = err.message;
    state.phase = 'ERROR';
  }

  render();
}

// ────────────────────────────────────────────────
// Phase 3: Reveal Card
// ────────────────────────────────────────────────

/**
 * Victory lines — used when the AI guessed correctly.
 * Randomly picked so repeat rounds don't feel stale.
 */
const VICTORY_LINES = [
  "Obviously. That one had 'made up on the spot' written all over it.",
  "Too easy. You hesitated when you typed that one, didn't you?",
  "I could tell from the phrasing alone. Next time, commit to the fiction.",
  "That was barely a challenge. The other two had texture. That one was cardboard.",
  "Called it. Your lie had that careful, over-rehearsed energy."
];

/**
 * Defeat lines — used when the AI guessed wrong.
 * The persona cracks slightly with begrudging respect.
 */
const DEFEAT_LINES = [
  "...Huh. Didn't see that one coming. Fine — that one was good.",
  "...Okay, I'll give you that. You sold it well enough to fool me.",
  "Wait, seriously? ...Respect. I was genuinely wrong on that one.",
  "...Hm. That's on me. You played that one perfectly straight.",
  "I'll be honest — I didn't expect to be wrong here. Well played."
];

function renderRevealCard() {
  const aiWon = state.suspectedLie === state.userLieIndex;
  const reactionLine = aiWon
    ? VICTORY_LINES[Math.floor(Math.random() * VICTORY_LINES.length)]
    : DEFEAT_LINES[Math.floor(Math.random() * DEFEAT_LINES.length)];

  const outcomeClass = aiWon ? 'reveal--victory' : 'reveal--defeat';
  const outcomeLabel = aiWon ? 'Nailed it.' : 'Fooled me.';

  // Build statement cards showing the outcome
  const statementsHtml = state.statements.map((stmt, i) => {
    const index = i + 1; // 1-based
    const isActualLie = index === state.userLieIndex;
    const wasAiPick = index === state.suspectedLie;

    let tag = '';
    if (isActualLie && wasAiPick) {
      tag = '<span class="statement-card__badge statement-card__badge--correct">The lie — I knew it</span>';
    } else if (isActualLie) {
      tag = '<span class="statement-card__badge statement-card__badge--missed">The lie — got me</span>';
    } else if (wasAiPick) {
      tag = '<span class="statement-card__badge statement-card__badge--wrong">My pick — wrong</span>';
    }

    return `
      <div class="statement-card statement-card--static ${isActualLie ? 'statement-card--actual-lie' : ''}">
        <div class="statement-card__header">
          <span class="statement-card__label">Statement ${index}</span>
          ${tag}
        </div>
        <p class="statement-card__text">${escapeHtml(stmt)}</p>
        <p class="statement-card__reasoning">${escapeHtml(state.reasoning[i] || '')}</p>
      </div>
    `;
  }).join('');

  appContainer.innerHTML = `
    <div class="reveal ${outcomeClass}">
      <header class="header">
        <p class="reveal__label">${outcomeLabel}</p>
        <p class="reveal__reaction">${escapeHtml(reactionLine)}</p>
      </header>

      <div class="reasoning-group">
        ${statementsHtml}
      </div>

      <button type="button" id="reset-btn" class="action-button action-button--secondary">
        Try me again
      </button>
    </div>
  `;

  document.getElementById('reset-btn')?.addEventListener('click', resetState);
}

/**
 * User clicks their actual lie — transition to REVEAL phase.
 */
function handleReveal(lieIndex) {
  state.userLieIndex = lieIndex;
  state.phase = 'REVEAL';
  render();
}

/**
 * Resets all state back to clean Phase 1.
 */
function resetState() {
  state.phase = 'INPUT';
  state.statements = ['', '', ''];
  state.suspectedLie = null;
  state.reasoning = [];
  state.userLieIndex = null;
  state.errorMessage = null;
  render();
}

// ────────────────────────────────────────────────
// Main Render Dispatcher
// ────────────────────────────────────────────────

export function render() {
  switch (state.phase) {
    case 'INPUT':
    case 'LOADING':
      renderInputCard();
      break;
    case 'REASONING':
      renderReasoningCard();
      break;
    case 'ERROR':
      renderErrorCard();
      break;
    case 'REVEAL':
      renderRevealCard();
      break;
    default:
      renderInputCard();
  }
}

// Initial bootstrap
render();
