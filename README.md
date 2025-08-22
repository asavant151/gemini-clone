# Gemini Clone (React + Vite)

A Gemini-like AI chat UI built with React and Vite. It supports Clerk authentication, light/dark theme, multiple-image prompts, streaming responses from Google GenAI, and rich Markdown rendering with syntax highlighting.

## Features

- __Clerk auth gate__: App is fully gated. Users must sign in before seeing the UI (`src/main.jsx`).
- __Dark/light theme__: Toggle persists via `localStorage`. Dark styles applied using `body[data-theme="dark"]`.
- __Sidebar history__: View, edit, delete previous prompts (`src/components/Sidebar/Sidebar.jsx`).
- __Multiple image upload__: Attach multiple images to a single prompt; previews with remove chips (`src/components/Main/Main.jsx`).
- __Gemini streaming__: Uses `@google/genai` streaming to generate responses (`src/config/gemini.js`).
- __Markdown + code highlight__: Renders with `marked` and highlights with `highlight.js`, includes copy button on code blocks.
- __Responsive UI__: Clean layout with modern UX.

## Tech Stack

- React + Vite
- Clerk (auth)
- @google/genai (Google GenAI SDK)
- marked (Markdown)
- highlight.js (syntax highlighting)

## Project Structure

```
src/
  assets/                 # PNG/SVG/GIF assets used in UI
  components/
    Main/
      Main.jsx            # Main chat UI, theme toggle, upload & results
      Main.css
    Sidebar/
      Sidebar.jsx         # History, edit/delete, new chat
      Sidebar.css
  config/
    gemini.js             # GenAI client; multi-image prompt parts
  context/
    Context.jsx           # Global state: prompt, history, images, send flow
  App.jsx                 # Composes Sidebar + Main
  index.css               # Global resets + theming
  main.jsx                # App entry; Clerk auth gating
```

## Authentication

The entire app is wrapped with Clerk in `src/main.jsx`:
- __SignedOut__: shows `<SignIn />` (hash routing to avoid dev-server issues)
- __SignedIn__: renders the app UI (`<App />` inside `<ContextProvider />`)

Env var required:
- `VITE_CLERK_PUBLISHABLE_KEY`

Set it in `.env` (already present in your project):

```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...your_key...
```

## Google GenAI Configuration

The GenAI client lives in `src/config/gemini.js` and currently uses a hard-coded API key placeholder. For production, move this to an environment variable.

- Current signature: `main(prompt, images = [])`
- Builds `parts` with one text part and N image parts as `inlineData`
- Streams with `ai.models.generateContentStream`

Recommended env-based setup:
1) Add to `.env`:
```
VITE_GEMINI_API_KEY=your_api_key_here
```
2) Update `src/config/gemini.js` to use `import.meta.env.VITE_GEMINI_API_KEY`.

> Important: Never commit real API keys. Use env files and deployment secrets.

## Theming

- Theme state stored in `localStorage` and applied via `document.body.setAttribute('data-theme', theme)`.
- Dark styles are applied in `Main.css`, `Sidebar.css`, and `index.css` using selectors like `body[data-theme="dark"] ...`.
- Sidebar icons are made white in dark mode via a CSS filter:
  `body[data-theme="dark"] .sidebar img { filter: brightness(0) invert(1); }`

## Multiple Image Uploads

Implemented in `src/components/Main/Main.jsx` & state in `src/context/Context.jsx`:
- File input accepts `multiple` images.
- Each selected image is converted to Base64 and added to `attachedImages` with a preview URL (`URL.createObjectURL`).
- Chips render for each image with a remove button.
- On send, `attachedImages` is passed to `main(prompt, images)`; object URLs are revoked after use.

## Prompt History

- Stored in `prevPrompt` within `Context.jsx` and persisted to `localStorage`.
- Sidebar displays entries with edit/delete inline actions.
- Clicking an entry re-runs the prompt.

## Markdown Rendering & Code UX

- Responses are converted to HTML with `marked` in `Context.jsx`.
- `highlight.js` styles are lazy-loaded depending on theme.
- A copy button is injected into each `<pre>` block for quick copying of code.

## Getting Started

1) __Install dependencies__
```
npm install
```

2) __Set environment variables__
- `.env` must include:
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...your_key...
# Optional: recommended for production
VITE_GEMINI_API_KEY=your_api_key_here
```

3) __Run the dev server__
```
npm run dev
```
Open the printed local URL (typically `http://localhost:5173`).

4) __Sign in__ via Clerk when prompted, then use the app.

## Usage Tips

- __Theme toggle__: top-right button in the nav (sun/moon).
- __Upload images__: click the gallery icon near the input → Upload files.
- __Send__: press Enter or click the send icon.
- __History__: expand sidebar (menu icon), edit/delete entries inline.

## Deployment

- Ensure you configure environment variables in your hosting provider (Vercel, Netlify, etc.):
  - `VITE_CLERK_PUBLISHABLE_KEY`
  - `VITE_GEMINI_API_KEY` (if you moved the key to env)
- Build with:
```
npm run build
```
- Serve `dist/` with any static host.

## Security Notes

- Do not commit real API keys.
- Consider rate limiting and server-side proxying if you expand beyond a demo.

## License

This project is for educational/demo purposes. Replace or add a license file as needed.
