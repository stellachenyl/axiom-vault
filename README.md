# AXIOM VAULT

A gamified, high-difficulty math arcade scaffold. Built as a sleek arcade / terminal /
puzzle-lab experience — **not** a school website or quiz app.

> The public UI never names topics directly. Content is framed in game language:
> Vaults, Chambers, Sectors, Anomalies, Trials, Nodes, Signals, Fractures, Cores,
> Protocols, Calibration, Clearance.

## Stack

- [Vite](https://vite.dev) — build tool / dev server
- [React 19](https://react.dev) + [TypeScript](https://typescriptlang.org)
- [Tailwind CSS v4](https://tailwindcss.com) — dark, high-contrast arcade theme
- [React Router v7](https://reactrouter.com) — client routing
- [Zustand](https://zustand.docs.pmnd.rs) — game state, persisted to `localStorage`
- [Zod](https://zod.dev) — content schema validation
- [marked](https://marked.js.org) + [DOMPurify](https://github.com/cure53/DOMPurify) + [KaTeX](https://katex.org) — safe Markdown/LaTeX rendering
- ESLint (flat config), Prettier, Vitest

No backend, database, auth, payments, or leaderboards.

## Run locally

```bash
npm install
npm run dev       # dev server at http://localhost:5173
```

Other scripts:

```bash
npm run build             # typecheck + production build to dist/
npm run preview           # preview the production build
npm run lint              # eslint
npm run format            # prettier
npm run typecheck         # tsc only
npm test                  # vitest (single run)
npm run test:watch        # vitest in watch mode
npm run validate:problems # validate problem-packs/ with Zod
```

## Run tests

```bash
npm test
```

Tests cover the scoring engine (`src/engine/scoring.test.ts`), answer checking
(`src/engine/answerChecker.test.ts`), and the content schemas
(`src/types/problem.test.ts`).

## Validate problem packs

```bash
npm run validate:problems
```

Validates the manifest, every pack file under `problem-packs/packs/`, and every
problem file under `problem-packs/problems/` against the Zod schemas in
`src/types/problem.ts`. It also cross-checks references: dangling problem refs,
orphaned problem files not referenced by any pack, and duplicate ids are all
reported. Exits with a non-zero code on failure.

## Add a new vault (problem pack)

1. Create one `problem-packs/problems/<problem-id>.json` per anomaly — see any
   file in `problem-packs/problems/` as a reference.
   - One numeric, one choice, and one exact-text problem type are supported.
   - Statements support Markdown and LaTeX (`$…$` inline, `$$…$$` block).
   - `hiddenTags` are internal metadata; never reference them in UI copy.
2. Create `problem-packs/packs/<your-pack>.json` with pack metadata and an
   ordered list of problem ids (`problems: ["id-1", "id-2", …]`).
3. Register it in `problem-packs/manifest.json` with a unique `id`, `difficulty`
   (1–10) and `file` name.
4. Run `npm run validate:problems` — fix any reported issues.
5. Mirror everything into `public/problem-packs/` so local development picks it up.

The loader rejects invalid packs at runtime and surfaces warnings on the `/dev`
page, so one bad file cannot take down the whole grid — it only drops that
anomaly from the vault.

## Publish problems via GitHub

Problem content can live in any public repository. To serve packs from your repo's
raw URLs:

1. Commit your `problem-packs/` folder (manifest + pack files) to a branch.
2. The raw base URL becomes:
   `https://raw.githubusercontent.com/<user>/<repo>/<branch>/problem-packs`

## Set VITE_PROBLEM_BASE_URL

Copy `.env.example` to `.env.local` and set:

```
VITE_PROBLEM_BASE_URL=https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/YOUR_REPO/main/problem-packs
```

- When set, the app fetches `${VITE_PROBLEM_BASE_URL}/manifest.json` and each
  `${VITE_PROBLEM_BASE_URL}/packs/<file>` from that source.
- When unset (default), the app falls back to the local copies served from
  `public/problem-packs/`, so development works offline.
- The active source is displayed on the `/dev` console.

## Deployment (Vercel)

The demo deploys on [Vercel](https://vercel.com): import the repo, and Vercel
auto-detects Vite (`npm run build` → `dist`). `vercel.json` contains an SPA
rewrite so client-side routes survive hard refreshes and direct visits; static
assets and `/problem-packs` are served as files first.

Every push to `main` auto-deploys; other branches get preview URLs. The app
uses the bundled `public/problem-packs` fallback unless `VITE_PROBLEM_BASE_URL`
is set in Project Settings → Environment Variables.

Before deploying, run the release gates locally:

```bash
npm run validate:problems && npm test && npm run build
```

## Intended architecture

```
src/
├── app/        App entry: router setup
├── components/ Reusable UI primitives (AppShell, TopBar, badges, MathText…)
├── engine/     Content-free logic: scoring, answer checking, progression, content loader
├── lib/        Pure helpers (formatting, class merging)
├── pages/      Route-level views
├── stores/     Zustand stores (useGameStore persisted, useContentStore)
├── styles/     Tailwind theme + global CSS
└── types/      Shared TypeScript types + Zod content schemas

problem-packs/   Versioned problem content (JSON) — mirrored into public/
scripts/         Authoring/validation tooling
```

- **engine/** stays content-free: scoring rules, verdicts, clearance tiers.
- **components/** are presentation-only and reusable across pages.
- **useGameStore** persists `totalPoints`, streaks, `unlockedVaults`,
  `completedProblems`, `hintsUsed`, `lastPlayedPackId`, and the attempt telemetry log
  to `localStorage` (key `axiom-vault-progress`). Progress can be purged from `/dev`.
- Scoring protocol: base points from content, up to +50% time bonus (linear decay),
  −10% per hint channel revealed (floor at 20% of base), streak multiplier
  (1.0×/1.1×/1.2×/1.3×), integer output. Ranks use game labels only
  ("CLEARANCE GRANTED", "VAULT SEALED", …) — no school-style grades.

## Naming policy

The public-facing UI deliberately avoids direct topic terminology (no "calculus",
"algebra", "probability", etc.) and generic education language (no "lesson", "quiz",
"homework", "exam", "class"). All player-visible concepts use the game vocabulary
listed above so the educational layer stays hidden behind the fiction.

`hiddenTags` on problems exist purely for future internal systems (analytics,
recommendations). They are never rendered anywhere in the UI.
