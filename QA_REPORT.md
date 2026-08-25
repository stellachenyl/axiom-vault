# QA Report — Axiom Vault

Automated QA suite hardening pass. Scope: engine logic, stores/persistence,
content pipeline, UI pages/components, security of rendered content, and
accessibility basics.

## Test summary

- **Runner:** Vitest + React Testing Library + jsdom (+ `@testing-library/user-event`, `@testing-library/jest-dom`)
- **Result: 170 tests, 16 files, all passing**
- **Command:** `npm test` (single run) / `npm run test:watch` / `npm run test:coverage`

| Area | Files | What is covered |
| --- | --- | --- |
| Problem schema validation | `src/types/problem.test.ts` | valid pack, missing/malformed fields, difficulty bounds, unknown kinds, invalid numeric/choice/text answer schemas, dangling `correctOptionId`, `hiddenTags` parsed but internal-only |
| Pack validator script | `scripts/validate-problems.test.ts` | duplicate pack IDs in manifest, duplicate problem IDs in a pack |
| Content loader | `src/engine/contentLoader.test.ts` | remote source via `VITE_PROBLEM_BASE_URL`, local fallback, trailing-slash handling, non-200 responses, network rejection, invalid manifest schema, empty manifest, missing pack file, Zod-invalid pack, packId/manifest-id mismatch, cache vs. fresh reload |
| Content store | `src/stores/useContentStore.test.ts` | ready/error transitions, warning collection, concurrent-load guard, `findLoadedPack` |
| Answer checking | `src/engine/answerChecker.test.ts` | tolerance boundaries, close-signal (double tolerance), decimals/negatives, unparseable input, choice match/miss/dangling id, text case & trim flags, unsupported answer kind fails safely |
| Scoring engine | `src/engine/scoring.test.ts` | base points, linear time bonus, overtime clamp, hint penalties and cap, floor behavior, all streak tiers, integer rounding, zero-point problems, missing optional fields |
| Progression & format | `src/engine/progression.test.ts`, `src/lib/format.ts` (via ui tests) | clearance tiers, run ranks incl. clamping, class-name join, AP formatting, threat labels |
| Game store & persistence | `src/stores/useGameStore.test.ts` | default state, points/streak/completions/unlocks/hints, best-streak semantics, localStorage persistence across simulated reloads, corrupt localStorage recovery, reset safety |
| Pages & routing states | `src/pages/*.test.tsx` | home loading/error/empty/ready states, vault page render + unknown pack, problem page unknown pack/problem, results stats/ranks/telemetry + missing pack, dev console source mode/warnings/reset |
| Runner behavior | `src/pages/ProblemPage.test.tsx` | per-kind inputs, disabled submit gating, correct/incorrect/close/unparseable feedback, double-submission lock, hint reveal → penalty, timer countdown + expiry records failed attempt, next-node and last-node→debrief navigation |
| Security | `src/components/MathText.test.tsx`, page tests | `<script>` stripping, event-handler stripping, `javascript:` link neutralization, iframe/object removal, HTML inside math tokens, malformed statements/hints not crashing |
| Accessibility basics | spread across component/page tests | keyboard operable buttons/cards/nav, labelled inputs, radio keyboard selection, Escape-closable drawer/modal, readable role-based status/progressbar/timer elements |

## Coverage summary

`npm run test:coverage` (v8 provider; includes `src/engine`, `src/stores`,
`src/lib`, `src/pages`, `src/components`; excludes tests, fixtures and the
router wiring in `src/app`):

```
Statements : 96.33%      Branches : 90.87%
Functions  : 95.78%      Lines    : 97.74%
```

The 90% goal is met without snapshot padding. Remaining uncovered lines are
defensive branches (e.g. KaTeX throw fallback in `MathText`, a few JSX null
guards in cards) — forcing them would require mocking internals for no
behavioral value.

## Bugs found and fixed

1. **Content loader cached forever — `/dev` "Force reload" was a no-op.**
   `loadProblemContent()` memoized the first successful load with no way to
   bypass it, so the dev-console button silently re-read stale data.
   *Fix:* added an opt-in `{ fresh: true }` flag that clears the module cache;
   the store's `load({ fresh })` passes it through. No behavior change for
   normal loads.

2. **Timer expiry did not record an attempt.** When a trial window closed,
   the runner locked input but never wrote telemetry, so the node silently
   vanished from the debrief and streaks were untouched by a failed window.
   *Fix:* expiry now records one failed attempt (`pointsAwarded: 0`) before
   locking; submission remains impossible after expiry, so no double-record.

3. **`checkAnswer` returned `undefined` for an unexpected answer type.**
   The switch had no default branch; a malformed record (only possible if
   schema validation were bypassed) would crash the runner on submit.
   *Fix:* added a safe default returning `incorrect`.

4. **Duplicate manifest pack IDs were not detected.** The validator only
   checked duplicate problem IDs inside packs. *Fix:* extracted a reusable
   `findDuplicateIds` helper (now unit-tested) and applied it to manifest
   entries as well.

## Known gaps

- `getPlayerStats()` (`src/engine/progression.ts`) is exercised indirectly;
  its lines are partially uncovered because pages read the store directly.
- The GitHub Pages workflow is validated only by CI run, not by tests.
- Visual/scanline theming, KaTeX font loading, and responsive breakpoints
  are outside jsdom's reach — verify manually at common viewport widths.

## Untested or manually-verifiable paths

- Real network fetches against `raw.githubusercontent.com` (all fetches are
  mocked; do one manual smoke run with `VITE_PROBLEM_BASE_URL` set).
- Browser-only behaviors: focus rings, animations (`animate-pulse`,
  scanline overlay), backdrop blur.
- Actual GitHub Pages deployment under a repo subpath (workflow sets
  `VITE_BASE_PATH`; confirm assets resolve after first deploy).

## Recommendations before deploying the demo

1. Run one manual pass of a full vault clear end-to-end in a real browser,
   including a timer-expired node and hinted clears.
2. Deploy once to Pages and check asset paths under `/&lt;repo&gt;/`
   (KaTeX fonts are hashed assets and the most likely subpath casualty).
3. Keep `npm run validate:problems` as a required check before merging new
   content — the runtime loader skips bad packs, but silent skips shrink the
   vault without any player-visible error.
4. When real scoring tuning begins, treat `scoring.test.ts` expectations as
   the spec: update rules and tests together.
