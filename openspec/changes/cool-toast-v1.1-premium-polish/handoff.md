# Handoff — cool-toast-v1.1-premium-polish

Contract for worker-web and worker-qa. Read this before any task. Specs: `specs.md`. Design: `design.md`. Task
details: `tasks.md`. The v1 handoff (`openspec/changes/cool-toast-v1/handoff.md`) stays in force for everything not
listed here (§B.1–B.5 API, §B.8 attributes, §E test infra, §G definition of done). Nothing here is negotiable
between workers; changes go through lead-worker.

## A. Waves and assignment

Flow per tested task: qa RED → web GREEN → qa verify + approve. worker-qa writes every RED test of a wave first,
then worker-web goes GREEN file by file. One task = one RED/GREEN cycle.

| Task | Wave | Owner (writes code) | Test owner | Files | Depends on | Spec ids |
|---|---|---|---|---|---|---|
| W1-T1 Geometry literals | 1 | worker-web | worker-qa | `src/lib/constants.ts` / `tests/constants.test.ts`, `tests/morph-path.test.ts`, `tests/setup.ts`, `tests/components/Toast.effects.test.ts`, `tests/components/Toast.expanded-lifecycle.test.ts`, `tests/components/Toast.reduced-motion.test.ts`, `tests/morph-driver.test.ts` | — | CONST-1, MORPH-1..8 |
| W1-T2 Premium density stylesheet | 1 | worker-web | worker-qa | `src/lib/styles.css` / `tests/styles.test.ts` | W1-T1 | STYLE-9, STYLE-10, STYLE-11 |
| W2-T1 Pill width includes timestamp | 2 | worker-web | worker-qa | `src/lib/Toast.svelte` / `tests/components/Toast.containment.test.ts` | W1-T2 | RENDER-18 |
| W2-T2 Collapse containment + leaving nodes | 2 | worker-web | worker-qa | `src/lib/Toast.svelte` (+ `src/lib/morph-driver.ts` if needed) / `tests/components/Toast.containment.test.ts` | W2-T1 | RENDER-19 |
| W2-T3 Close button anchored to wrapper | 2 | worker-web | worker-qa | `src/lib/Toast.svelte`, `src/lib/styles.css` / `tests/components/Toast.containment.test.ts` | W2-T2 | RENDER-20 |
| W3-T1 README theming table | 3 | worker-web | worker-qa (review) | `README.md` | W2-T3 | §B.6-delta coverage |
| W3-T2 Static review + visual checklist | 3 | worker-qa | worker-qa | — | W3-T1 | §I |

Parallelism: W1-T1 and W1-T2 RED in parallel; GREEN `constants.ts` before `styles.css`. All W2 RED tests go into one
new file and may be written together; W2 GREEN is sequential (same `Toast.svelte`). No demo (`src/routes/**`) changes.

## B. Contract deltas

### B.6-delta CSS custom properties (declared on `[data-cool-toaster]`; dark under `[data-theme="dark"]`)

New:

| Variable | Light | Dark |
|---|---|---|
| `--cool-toast-pill-padding` | `12px 18px` | same |
| `--cool-toast-body-padding` | `12px 18px 18px` | same |
| `--cool-toast-title-size` | `13px` | same |
| `--cool-toast-description-size` | `14px` | same |
| `--cool-toast-radius-body` | `16px` | same |

Changed:

| Variable | Light | Dark |
|---|---|---|
| `--cool-toast-shadow` | `drop-shadow(0 10px 24px rgba(0,0,0,.10)) drop-shadow(0 2px 6px rgba(0,0,0,.06))` | `drop-shadow(0 10px 24px rgba(0,0,0,.45)) drop-shadow(0 2px 6px rgba(0,0,0,.3))` |

Fixed values (not variables) in `styles.css`:

| Rule | Value |
|---|---|
| Compact content padding | `var(--cool-toast-pill-padding)` (= `12px 18px`) |
| Expanded content | `min-width: 320px; max-width: 400px; padding: var(--cool-toast-body-padding)` (= `12px 18px 18px`) |
| Header | `height: 20px; gap: 10px` (title ↔ timestamp); icon 18×18 |
| Title | `font-size: var(--cool-toast-title-size); font-weight: 600; line-height: 20px; letter-spacing: -0.01em` |
| Compact timestamp | `font-size: 12px` |
| Body | `.cool-toast-body { padding-top: 10px }` |
| Description | `font-size: var(--cool-toast-description-size); line-height: 1.5` |
| Action button | `padding: 12px 20px; font-size: 14px; font-weight: 600; border-radius: 999px` |
| Progress | `[data-cool-toast-progress] { margin: 14px 0 0; border-radius: 2px; overflow: hidden }`; bar `height: 3px` |
| Clipping (non-expanded) | `[data-cool-toast]:not([data-state="expanded"]) [data-cool-toast-content] { overflow: hidden; clip-path: inset(0 round var(--cool-toast-radius-body)) }` |
| Clipping (expanded) | `[data-cool-toast][data-state="expanded"] [data-cool-toast-content] { overflow: visible; clip-path: none }` |
| Leaving body | `.cool-toast-body[data-leaving="true"] { pointer-events: none }` |
| Close button | `position: absolute; top: -6px; width: 20px; height: 20px; border-radius: 50%`; `[data-side="top-right"] { right: -6px; left: auto }`; `[data-side="top-left"] { left: -6px; right: auto }`; `[data-cool-toast][data-side="right"] [data-cool-toast-close] { transform: scaleX(-1) }` |

### B.7-delta Constants (`src/lib/constants.ts`) — worker-qa verifies statically

| Name | Old | New |
|---|---|---|
| `PILL_HEIGHT` (PH) | 34 | **44** |
| `PILL_RADIUS` | 17 | **22** (`PILL_HEIGHT / 2`) |
| `PILL_PADDING_X` | 20 | **36** (18 px per side) |
| `NECK_CURVE_MAX` | 14 | 14 |
| `BODY_CORNER_MAX` | 16 | 16; `cr = min(16, (bodyH − 44)·0.45)` |
| `PILL_THRESHOLD` | 8 | 8 |
| Pill path | `M 0,17 A 17,17 …` | `M 0,22 A 22,22 0 0 1 22,0 H (w−22) A 22,22 0 0 1 w,22 A 22,22 0 0 1 (w−22),44 H 22 A 22,22 0 0 1 0,22 Z` |
| Expanded content | `300 / 380` | `min-width 320px; max-width 400px` |
| Padding | compact `7px 10px`, expanded `7px 10px 16px 10px` | compact `12px 18px`, expanded `12px 18px 18px` |

All timing constants (`EXPAND_DELAY_MS` … `REMEASURE_MS`, springs, squishes, swipe) unchanged.

### B.8-delta DOM / data-attribute contract

| Element | Change |
|---|---|
| Close button | now a direct child of `.cool-toast-wrapper` (after `[data-cool-toast-content]`); attributes unchanged (`button[data-cool-toast-close][data-side="top-left\|top-right"]`) |
| Wrapper `.cool-toast-wrapper` | inline `style="width: <n>px"` set by the library: `pillW` in `pill`, interpolated body width while `morphing`/`collapsing`, `bw` when `expanded` |
| Body `.cool-toast-body` | `data-leaving="true"` while its exit transition runs (set when `bodyShown` turns false, removed with the node) |
| Header timestamp | `[data-cool-toast-timestamp][data-slot="header"]` is rendered inside `[data-cool-toast-header]` in `pill` **and** `collapsing`; absent in `morphing`/`expanded` |

### E-delta Test infrastructure (`tests/setup.ts`, worker-qa)

| Element | Old stub | New stub |
|---|---|---|
| `[data-cool-toast-header]` | 100×34 | **100×20** |
| `[data-cool-toast-content]` compact | 120×34 | **150×44** |
| `[data-cool-toast-content]` expanded | 300×90 | **320×112** |
| `defaultSize` "expanded" detection | any description-row/action-wrapper | same, **ignoring `[data-leaving]` descendants** |

Derived defaults used by every scenario: `pw = 136`, `bw = 320`, `th = 112`; compact `bw = 150`, `th = 44`.
New test file: `tests/components/Toast.containment.test.ts` (RENDER-18/19/20). `motion` mock unchanged
(`progressAll(t)` drives RENDER-19 frames).

## C. File ownership (copied from v1 §C)

| Path | Owner | Notes |
|---|---|---|
| `src/lib/**` (components, store, types, `styles.css`) | worker-web | published code |
| `src/lib/index.ts` | worker-web | the only public entry — **not touched in this change** |
| `src/routes/**`, `src/app.css`, `src/app.html` | worker-web | demo, not published — **not touched in this change** |
| `package.json`, `svelte.config.js`, `vite.config.ts`, `tsconfig.json`, `eslint.config.js`, `prettier.config.js`, `.prettierignore` | worker-web | **not touched in this change** |
| `README.md`, `LICENSE`, `NOTICE` | worker-web | `README.md` only (W3-T1) |
| `vitest.config.ts` | worker-web creates; worker-qa may edit `test.*` keys | |
| `tests/**` (`setup.ts`, mocks, fixtures, `*.test.ts`) | worker-qa | only agent that writes and runs tests |
| `openspec/**` | lead-worker | |
| Commits, builds (`npm run build`, `npm run package`) | lead-worker only | neither worker builds or commits |

worker-web may run `npm run lint`, `npm run check`, `npm run format:check`, `npm run dev`. worker-qa runs
`npm test -- <path>`, `npm run lint`, `npm run check`, `npm run format:check`. Runs are targeted (< 1 min).

## G. Definition of done per task (as v1, plus)

7. No pixel outside the blob: every element the toast renders is a descendant of `.cool-toast-wrapper` or is clipped
   by it (worker-qa checks the template: nothing rendered after the wrapper's closing tag in `Toast.svelte`).
8. The only inline styles the library writes per frame are the path `d`, `wrapper.style.width`,
   `wrapper.style.height` (+ the existing `transform` for squish/shake). Non-per-frame inline writes are allowed on
   measurement only: `blobEl.style.width` (centre variant, `setDims`) and the temporary `display: none` on
   `[data-leaving]` nodes while measuring (design D11). worker-qa greps `Toast.svelte` and `morph-driver.ts` for `$state` writes in
   `onUpdate` callbacks (none allowed).

## H. Decisions (taken by lead-worker; do not reopen)

1. Density: pill 44 px (20 + 12 + 12), padding `12px 18px` / `12px 18px 18px`, body 320–400 px wide, title 13/600
   with `-0.01em`, description 14/1.5 with 10 px above, timestamp 12 px with 10 px gap, action `12px 20px` 14/600
   radius 999, progress inset `14px 0 0` 3 px tall radius 2, icon 18 px, shadow `.10/.06` light and `.45/.3` dark.
2. Containment rule (design D16): wrapper width tracks the path; content clipped in every non-expanded state; close
   button inside the wrapper at `-6px` corners; header timestamp present in `pill` and `collapsing`; measurement
   ignores `[data-leaving]` nodes and runs after the header timestamp exists.
3. No API, no timing, no demo changes.

## I. Manual visual checklist (worker-qa delivers; the user runs in the demo with `npm run dev`)

For each of the six positions, light and dark, `closeButton: 'top-right'` then `'top-left'`:

1. `toast('Saved')` → pill 44 px tall; the timestamp sits inside the white blob with 18 px to the right edge; the
   close button overlaps the pill's corner by ~6 px, not floating away.
2. `toast('Saved', { description: 'Your file is safe', action: { label: 'Undo' }, showProgress: true })` → during
   the morph no text shows outside the blob; expanded body has 18 px side padding; the progress bar is 14 px below
   the action and 18 px above the bottom edge, 3 px tall, rounded.
3. Wait for the auto-collapse → the description fades inside the shrinking blob; at the end the pill contains the
   timestamp; the close button follows the corner during the whole collapse.
4. Hover during the collapse → re-expand still works and nothing is clipped once expanded.
5. `toast.promise(...)` resolve and reject → same as 2–3; the error shake keeps the close button on the corner.
6. Long title (≥ 40 chars) in pill → the pill grows to fit the title + timestamp and never clips text in pill state.
7. Narrow viewport (≤ 400 px) → the toast respects `calc(100vw − 2·offset)` and text wraps inside the blob.
