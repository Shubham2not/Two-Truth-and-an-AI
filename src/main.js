/**
 * Two Truths and an AI - State Machine & UI Controller
 */

// Application State Store
const state = {
  phase: 'INPUT', // 'INPUT' | 'LOADING' | 'REASONING' | 'REVEAL' | 'ERROR'
  statements: ['', '', ''],
  suspectedLie: null, // 1 | 2 | 3
  reasoning: [],      // [string, string, string]
  userLieIndex: null, // 1 | 2 | 3
  errorMessage: null
};

const appContainer = document.getElementById('app');

/**
 * Checks if all three statements contain non-whitespace text.
 */
function areStatementsValid() {
  return state.statements.every(stmt => stmt && stmt.trim().length > 0);
}

/**
 * Renders the Input Card (Phase 1)
 */
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

/**
 * Attaches DOM event listeners for inputs and submission.
 */
function bindInputEvents() {
  const input1 = document.getElementById('stmt-1');
  const input2 = document.getElementById('stmt-2');
  const input3 = document.getElementById('stmt-3');
  const submitBtn = document.getElementById('submit-btn');

  const updateStatement = (index, value) => {
    state.statements[index] = value;
    const valid = areStatementsValid();
    if (submitBtn) {
      submitBtn.disabled = !valid;
    }
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

/**
 * Handles submission trigger: transitions to LOADING phase.
 */
function handleSubmission() {
  state.phase = 'LOADING';
  render();

  // In Slice 1: demonstrate transition to loading state
  // Slice 2 will replace this timeout with the actual /api/analyze fetch call
  console.log('[App] Statements submitted:', state.statements);
}

/**
 * Helper to escape HTML characters in user input
 */
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Main render function dispatching by state.phase
 */
export function render() {
  switch (state.phase) {
    case 'INPUT':
    case 'LOADING':
      renderInputCard();
      break;
    default:
      renderInputCard();
  }
}

// Initial bootstrap
render();
