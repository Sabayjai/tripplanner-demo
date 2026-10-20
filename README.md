# Trip Planner Demo

A hands-on AI-assisted family trip planner demo built with Vite. The app helps compare trip options, plan costs, and record actual spending.

## Run locally

Requirements: Node.js and npm.

```powershell
cd app
npm ci
npm run dev
```

To create a production build:

```powershell
npm run build
```

Vite writes the static site to `app/dist`.

## Deploy with Cloudflare Pages

Connect this repository and use these build settings:

- Production branch: `main`
- Root directory: `app`
- Build command: `npm run build`
- Build output directory: `dist`

## Data storage

Trip data is saved in the browser's `localStorage` on the current device and browser. There is no account or server-side backup, and data does not sync between devices. Clearing browser storage can remove saved trips.

## Repository layout

```text
app/                 Vite application source
docs/                Requirements, design notes, and work records
.claude/agents/       Project-specific AI role prompts
LICENSE              MIT License
```

The `docs/` folder and `.claude/agents/` prompts are included in this public demo repository.
