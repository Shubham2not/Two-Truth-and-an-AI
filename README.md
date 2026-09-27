# Two Truths and an AI

A single-card party game where an AI plays the deadpan lie detector. Enter three statements about yourself (two true, one lie); the AI analyzes each claim with dry, observational wit, suspects one lie, and lets you reveal the truth for a smug victory or a begrudging crack in character.

Built for the **Build With AI: Basics** hackathon.

## Tech Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES modules)
- **Tooling & Dev Server**: Vite
- **AI Model**: Google Gemini (`gemini-3.5-flash` / `gemini-3.8-flash` via Google AI Studio) with native JSON schema (`response_schema`)
- **Backend**: Local Vite server proxy (`POST /api/analyze`) to keep API keys server-side

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- A [Google Gemini API Key](https://aistudio.google.com/apikey) (free tier)

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <YOUR_PUBLIC_REPO_URL>
   cd <REPO_DIRECTORY>
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Copy the example environment file and add your Gemini API key:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and set:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```
   *(Note: `.env` is git-ignored and never committed).*

4. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

## Project Structure

```
├── devpost/               # Planning docs, architecture map, and checklist
│   ├── app-map.html       # Standalone architecture guide & code tour
│   ├── checklist.md       # Step-by-step build checklist
│   ├── prd.md             # Product requirements document
│   ├── scope.md           # Project scope and proof-of-concept boundaries
│   └── spec.md            # Technical specification & architecture decisions
├── src/
│   └── main.js            # Reactive state store, input validation, and rendering
├── .env.example           # Template for environment variables
├── index.html             # App container and typography
├── style.css              # Dark slate theme, card layouts, and badges
└── vite.config.js         # Dev server proxy, model fallback cascade, and schema
```

## License

MIT
