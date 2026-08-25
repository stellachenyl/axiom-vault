# AXIOM VAULT

A gamified, high-difficulty math arcade scaffold. Built as a sleek arcade / terminal /
puzzle-lab experience — **not** a school website or quiz app.

> The public UI never names math topics directly. Content is framed in game language:
> Vaults, Chambers, Sectors, Anomalies, Trials, Nodes, Signals, Fractures, Cores,
> Protocols, Calibration, Clearance.

## Stack

- [Vite](https://vite.dev) — build tool / dev server
- [React 19](https://react.dev) + [TypeScript](https://typescriptlang.org)
- [Tailwind CSS v4](https://tailwindcss.com) — dark, high-contrast arcade theme
- [React Router v7](https://reactrouter.com) — client routing
- [Zustand](https://zustand.docs.pmnd.rs) — lightweight game state
- ESLint (flat config) + Prettier

No backend, database, auth, payments, or CMS.

## Run it

```bash
npm install
npm run dev       # dev server at http://localhost:5173
```

Other scripts:

```bash
npm run build     # typecheck + production build to dist/
npm run preview   # preview the production build
npm run lint      # eslint
npm run format    # prettier
npm run typecheck # tsc only
```

## Routes

| Route                                | Purpose                                              |
| ------------------------------------ | ---------------------------------------------------- |
| `/`                                  | Home / mission select (vault grid + player panel)    |
| `/vault/:packId`                     | Pack overview — anomalies listed as missions         |
| `/vault/:packId/problem/:problemId`  | Problem runner (statement, answer input, hints)      |
| `/results/:packId`                   | Pack results debrief                                 |
| `/dev`                               | Dev console: loaded packs, env config, validation    |

## Intended architecture

```
src/
├── app/        App entry: router setup
├── components/ Reusable UI primitives (AppShell, TopBar, badges, pills, states…)
├── engine/     Game logic: scoring, progression/clearance tiers (no content)
├── game/       Problem pack registry & loaders
├── lib/        Pure helpers (formatting, class merging)
├── pages/      Route-level views
├── stores/     Zustand stores (useGameStore)
├── styles/     Tailwind theme + global CSS
└── types/      Shared TypeScript types (Vault, Anomaly, ThreatLevel…)
```

- **engine/** stays content-free: it computes scores, streaks, clearance tiers.
- **components/** are presentation-only and reusable across pages.
- **stores/useGameStore** holds `totalPoints`, `currentStreak`, `bestStreak`,
  `unlockedVaults`, `completedProblems`, `hintsUsed`, `lastPlayedPackId`.

## Where future problem content will live

Problem packs ("Vaults") will live as structured data under `src/game/` — either as
static JSON/TS modules imported at build time (current placeholder approach in
`src/game/placeholderPacks.ts`) or loaded via a future content pipeline. Each pack
contains a `Vault` descriptor plus an array of `Anomaly` records (signal text,
threat level, AP value, hint channels). The UI reads packs through the registry in
`src/game/`; swapping placeholders for real content requires no page changes.

Scoring and validation currently use hardcoded placeholder behavior by design.

## Naming policy

The public-facing UI deliberately avoids direct math terminology (no "calculus",
"algebra", "probability", etc.). All player-visible concepts use the game vocabulary
listed above so the educational layer stays hidden behind the fiction.
