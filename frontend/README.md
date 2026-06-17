# Frontend — Run & Development Guide

This guide explains how to run the frontend locally after cloning the repository.

**Prerequisites**

- Node.js (recommended >= 18)
- npm (or `pnpm`/`yarn`)
- Git
- A modern browser

**Clone repository**

```bash
git clone https://github.com/<your-org-or-user>/<repo>.git
cd <repo>
```

The frontend lives in the `frontend` folder.

**Install dependencies**

```bash
cd frontend
npm install
# or: pnpm install
```

**Run development server**

```bash
npm run dev
```

Vite will print the local URL (commonly `http://localhost:5173` or `http://localhost:5174`). Open that in your browser.

If the default port is in use, either accept the alternate port Vite offers or run:

```bash
npm run dev -- --port 5174
```

**Build for production**

```bash
npm run build
```

To serve the built files locally (optional):

```bash
npm install -g serve
serve -s dist -l 5000
# open http://localhost:5000
```

**Environment variables**

If the app requires environment variables, create a file `frontend/.env` or `frontend/.env.local` and add Vite-prefixed keys:

```
VITE_API_URL=https://api.example.com
VITE_SOME_KEY=your_value
```

Restart the dev server after changing envs. Client-exposed variables must be prefixed with `VITE_`.

**Notes specific to this repo**

- Tailwind CSS is used via the CDN in development. If styles are missing, confirm `frontend/index.html` includes:

```html
<script src="https://cdn.tailwindcss.com"></script>
```

- The project currently uses a mock authentication provider in `frontend/src/context/AuthContext.jsx`. You can sign in locally without a backend.

- Ensure `src/main.jsx` is present and `index.html` references `/src/main.jsx` to avoid JSX loading issues.

**Common troubleshooting**

- Dev server fails to start: check for error output in the terminal and share it.
- Tailwind classes not applying: inspect `index.html` and confirm CDN script, or ensure PostCSS/Tailwind config is correct for local build.
- Port in use: run with `--port` flag or free the port.

**Tests**

If tests exist, run:

```bash
cd frontend
npm test
```

**Add this guide to the root README**

Consider copying a short link or summary into the project root `README.md` so collaborators see quick start steps after cloning.

If you want, I can also add a minimal `frontend/.env.example` and commit it for convenience.
