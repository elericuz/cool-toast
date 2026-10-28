# Handoff — cool-toast-v1

Contract for worker-web and worker-qa. Read this before any task. Specs: `specs.md`. Design: `design.md`.
Task details: `tasks.md`. Nothing here is negotiable between workers; changes go through lead-worker.

## A. Waves and assignment

Flow per tested task: qa RED → web GREEN → qa verify + approve. worker-qa writes every RED test of a wave first, then
worker-web goes GREEN file by file. One task = one RED/GREEN cycle.

| Task | Wave | Owner (writes code) | Test owner | Files | Depends on | Spec ids |
|---|---|---|---|---|---|---|
| W0-T1 Scaffold (`sv create`) | 0 | worker-web | — | repo root, `package.json`, `tsconfig.json`, `vite.config.ts`, `svelte.config.js`? | — | — |
| W0-T2 Library packaging config | 0 | worker-web | — | `package.json` (`name: "@elericuz/cool-toast"`), `src/lib/index.ts` (stub), `src/lib/styles.css` (empty) | W0-T1 | STYLE-8 (later) |
| W0-T3 Dev tooling + vitest config | 0 | worker-web | — | `package.json`, `vitest.config.ts`, `eslint.config.js`, `.prettierrc`, `.gitignore` | W0-T1 | — |
| W0-T4 LICENSE + NOTICE | 0 | worker-web | — | `LICENSE`, `NOTICE` | — | §F |
| W0-T5 Test harness + smoke test | 0 | worker-qa | worker-qa | `tests/setup.ts`, `tests/mocks/motion.ts`, `tests/fixtures/*`, `tests/smoke.test.ts` | W0-T3 | — |
| W1-T1 Morph path functions | 1 | worker-web | worker-qa | `src/lib/morph-path.ts`, `src/lib/constants.ts` / `tests/morph-path.test.ts` | W0-T5 | MORPH-1..8 |
| W1-T2 Presets + resolve-options + types | 1 | worker-web | worker-qa | `src/lib/animation-presets.ts`, `src/lib/resolve-options.ts`, `src/lib/types.ts` / `tests/resolve-options.test.ts`, `tests/animation-presets.test.ts` | W0-T5 | API-2..5 |
| W1-T3 Animation config helpers | 1 | worker-web | worker-qa | `src/lib/animation-config.ts`, `src/lib/constants.ts` / `tests/animation-config.test.ts` | W0-T5 | ANIM-9 |
| W1-T4 Pausable timers | 1 | worker-web | worker-qa | `src/lib/timers.ts` / `tests/timers.test.ts` | W0-T5 | STORE-12 |
| W1-T5 Store: records + dismiss | 1 | worker-web | worker-qa | `src/lib/toast-store.svelte.ts`, `src/lib/toast.ts` / `tests/toast-store.test.ts` | W1-T2, W1-T4 | STORE-1,2,3,7,8,9; UPDATE-5 |
| W1-T6 Store: queue + config | 1 | worker-web | worker-qa | `src/lib/toast-store.svelte.ts` / `tests/toast-store.test.ts` | W1-T5 | STORE-4,5,6,11,13 |
| W1-T7 Store: callbacks, update, settle | 1 | worker-web | worker-qa | `src/lib/toast-store.svelte.ts` / `tests/toast-store.test.ts`, `tests/api.types.test.ts` | W1-T6 | STORE-10; UPDATE-1,4; PROMISE-7; API-1 |
| W2-T1 Toaster shell | 2 | worker-web | worker-qa | `src/lib/Toaster.svelte`, `src/lib/theme.svelte.ts`, `src/lib/index.ts` / `tests/components/Toaster.test.ts` | W1-T7 | RENDER-1,2,10,13; STORE-13 |
| W2-T2 Announcer | 2 | worker-web | worker-qa | `src/lib/Announcer.svelte` / `tests/components/Announcer.test.ts` | W2-T1 | RENDER-8 |
| W2-T3 Toast compact rendering | 2 | worker-web | worker-qa | `src/lib/Toast.svelte`, `src/lib/Icon.svelte` / `tests/components/Toast.compact.test.ts` | W2-T1 | RENDER-3,5,6,7,14,16,17 |
| W2-T4 Toast expanded rendering | 2 | worker-web | worker-qa | `src/lib/Toast.svelte` / `tests/components/Toast.expanded.test.ts` | W2-T3 | RENDER-4,5,9,17; UPDATE-7 |
| W2-T5 Compact lifecycle | 2 | worker-web | worker-qa | `src/lib/Toast.svelte` / `tests/components/Toast.lifecycle.test.ts` | W2-T3 | RENDER-11,12; STORE-8,10,11 |
| W2-T6 Expanded lifecycle (snap driver) | 2 | worker-web | worker-qa | `src/lib/Toast.svelte`, `src/lib/morph-driver.ts` / `tests/components/Toast.expanded-lifecycle.test.ts` | W2-T4, W1-T3 | ANIM-1(states),2,8; RENDER-15; UPDATE-6 |
| W2-T7 Promise lifecycle | 2 | worker-web | worker-qa | `src/lib/toast.ts`, `src/lib/Toast.svelte` / `tests/components/Toast.promise.test.ts` | W2-T6 | PROMISE-1..7; ANIM-5 |
| W2-T8 Update via DOM | 2 | worker-web | worker-qa | `src/lib/Toast.svelte` / `tests/components/Toast.update.test.ts` | W2-T7 | UPDATE-1,2,3,4 |
| W3-T1 Morph driver (`motion`) | 3 | worker-web | worker-qa | `src/lib/morph-driver.ts` / `tests/morph-driver.test.ts` | W2-T6 | ANIM-1,3(driver),7 |
| W3-T2 Hover re-expand | 3 | worker-web | worker-qa | `src/lib/Toast.svelte` / `tests/components/Toast.hover.test.ts` | W3-T1 | ANIM-3; SWIPE-7 |
| W3-T3 Squish / shake / pill resize | 3 | worker-web | worker-qa | `src/lib/Toast.svelte`, `src/lib/morph-driver.ts` / `tests/components/Toast.effects.test.ts` | W3-T1 | ANIM-6,7,9 (static) |
| W3-T4 Swipe attachment | 3 | worker-web | worker-qa | `src/lib/swipe.ts`, `src/lib/Toast.svelte` / `tests/swipe.test.ts` | W2-T5 | SWIPE-1..6; STORE-10 |
| W3-T5 Reduced motion | 3 | worker-web | worker-qa | `src/lib/reduced-motion.svelte.ts`, `src/lib/Toast.svelte`, `src/lib/morph-driver.ts` / `tests/reduced-motion.test.ts`, `tests/components/Toast.reduced-motion.test.ts` | W3-T1 | ANIM-4,8 |
| W4-T1 CSS variables + dark | 4 | worker-web | worker-qa | `src/lib/styles.css` / `tests/styles.test.ts` | W2-T4 | STYLE-2,3,6 |
| W4-T2 CSS layout/keyframes/RM | 4 | worker-web | worker-qa | `src/lib/styles.css` / `tests/styles.test.ts` | W4-T1 | STYLE-4,5 |
| W4-T3 Final exports + types | 4 | worker-web | worker-qa | `src/lib/index.ts`, `src/lib/types.ts` / `tests/index.test.ts`, `tests/api.types.test.ts` | W3-T5 | STYLE-7; API-1 |
| W4-T4 README | 4 | worker-web | worker-qa (review) | `README.md` | W4-T3 | §B coverage |
| W4-T5 package.json contract | 4 | worker-web | worker-qa | `package.json` / `tests/package.test.ts` | W4-T3 | STYLE-1,8; DEMO-1 |
| W5-T1 Demo CSS | 5 | worker-web | — | `src/app.css` | W4-T2 | DEMO-4 |
| W5-T2 Demo routes skeleton | 5 | worker-web | — | `src/routes/(site)/+layout.svelte`, `src/routes/(site)/+page.svelte` | W5-T1 | DEMO-2,7 |
| W5-T3 Playground + snippets | 5 | worker-web | — | `src/routes/(site)/components/*.svelte`, `src/routes/(site)/playground.svelte.ts` | W5-T2 | DEMO-3,5,6 |
| W5-T4 Static verification + a11y review | 5 | worker-qa | worker-qa | — | W5-T3 | DEMO-1,3,8 |

Parallelism: W1-T1..T4 in parallel; W1-T5→T6→T7 sequential (same file). W2-T2 ∥ W2-T3; W2-T5 ∥ W2-T4. W3-T4 ∥ W3-T1.
W4-T1/T2 ∥ W4-T3. Everything else follows the depends-on column.

## B. Public API contract

### B.1 Components

`<Toaster />` — default export of `src/lib/Toaster.svelte`, re-exported as `Toaster`. Render once per app.

| Prop | Type | Default |
|---|---|---|
| `position` | `Position` | `'bottom-right'` |
| `theme` | `Theme` | `'system'` |
| `gap` | `number` (px) | `14` |
| `offset` | `string` (CSS length) | `'24px'` |
| `duration` | `number` (ms, compact toasts) | `4000` |
| `visibleToasts` | `number` | `3` |
| `maxQueue` | `number` | `Infinity` |
| `queueOverflow` | `'drop-oldest' \| 'drop-newest'` | `'drop-oldest'` |
| `closeButton` | `boolean \| 'top-left' \| 'top-right'` (`true` ≡ `'top-left'`) | `false` |
| `closeOnEscape` | `boolean` | `true` |
| `swipeToDismiss` | `boolean` | `true` |
| `preset` | `AnimationPresetName \| undefined` | `undefined` |
| `spring` | `boolean` | `true` |
| `bounce` | `number` | `0.4` |
| `showProgress` | `boolean` | `false` |
| `showTimestamp` | `boolean` | `true` |
| `dir` | `'ltr' \| 'rtl'` | `'ltr'` |
| `labels` | `{ close?: string }` | `{ close: 'Close notification' }` |

`Toast.svelte`, `Announcer.svelte`, `Icon.svelte` are internal (not exported).

### B.2 Functions

```ts
export function toast(title: string, options?: ToastOptions): string | number;
export namespace toast {
  function success(title: string, options?: ToastOptions): string | number;
  function error(title: string, options?: ToastOptions): string | number;
  function warning(title: string, options?: ToastOptions): string | number;
  function info(title: string, options?: ToastOptions): string | number;
  function promise<T>(promise: Promise<T>, data: PromiseData<T>): string;
  function update(id: string | number, options: ToastUpdateOptions): void;
  function dismiss(idOrFilter?: string | number | DismissFilter): void;
}
export const animationPresets: Readonly<Record<AnimationPresetName, AnimationPreset>>;
// { smooth: {bounce: 0.1, spring: true}, subtle: {bounce: 0.05, spring: true},
//   snappy: {bounce: 0.4, spring: true}, bouncy: {bounce: 0.6, spring: true} }
```
Implementation note: `toast` is a function with properties assigned (`Object.assign`), typed as above. No
`toast.custom`, no `toast.loading`.

### B.3 Types

```ts
import type { Snippet } from 'svelte';

export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info';
export type ToastPhase = ToastType | 'loading';
export type Position = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
export type Theme = 'light' | 'dark' | 'system';
export type AnimationPresetName = 'smooth' | 'subtle' | 'snappy' | 'bouncy';
export interface AnimationPreset { bounce: number; spring: boolean }

export interface ToastAction { label: string; onClick: () => void; successLabel?: string }
export interface ToastClasses {
  wrapper?: string; content?: string; header?: string; title?: string; icon?: string;
  description?: string; actionWrapper?: string; actionButton?: string;
}
export interface ToastTimings { displayDuration?: number }   // ms, expanded toasts only; default 4000

export interface ToastOptions {
  description?: string | Snippet;
  action?: ToastAction;
  icon?: Snippet;
  duration?: number;            // ms, compact toasts only; Infinity allowed
  id?: string | number;
  classes?: ToastClasses;
  fillColor?: string;
  borderColor?: string;
  borderWidth?: number;         // default 1.5 when borderColor is set
  timing?: ToastTimings;
  preset?: AnimationPresetName;
  spring?: boolean;
  bounce?: number;
  showProgress?: boolean;
  showTimestamp?: boolean;
  onDismiss?: (id: string | number) => void;
  onAutoClose?: (id: string | number) => void;
}

export interface ToastUpdateOptions {
  title?: string;
  description?: string | Snippet;
  type?: ToastType;
  action?: ToastAction;
  icon?: Snippet | null;        // null clears the icon
  showTimestamp?: boolean;
}

export interface PromiseData<T> {
  loading: string;
  success: string | ((data: T) => string);
  error: string | ((error: unknown) => string);
  description?: {
    loading?: string | Snippet;
    // Un Snippet es una función en tiempo de ejecución, así que toda función aquí es un resolver.
    // Para usar un Snippet envuélvelo: `success: () => mySnippet`.
    success?: string | ((data: T) => string | Snippet);
    error?: string | ((error: unknown) => string | Snippet);
  };
  action?: { success?: ToastAction; error?: ToastAction };
  classes?: ToastClasses; fillColor?: string; borderColor?: string; borderWidth?: number;
  timing?: ToastTimings; preset?: AnimationPresetName; spring?: boolean; bounce?: number;
  showProgress?: boolean; showTimestamp?: boolean;
  onDismiss?: (id: string | number) => void; onAutoClose?: (id: string | number) => void;
}

export interface DismissFilter { type: ToastType | ToastType[] }

export interface ToasterProps {
  position?: Position; theme?: Theme; gap?: number; offset?: string; duration?: number;
  visibleToasts?: number; maxQueue?: number; queueOverflow?: 'drop-oldest' | 'drop-newest';
  closeButton?: boolean | 'top-left' | 'top-right'; closeOnEscape?: boolean; swipeToDismiss?: boolean;
  preset?: AnimationPresetName; spring?: boolean; bounce?: number; showProgress?: boolean;
  showTimestamp?: boolean; dir?: 'ltr' | 'rtl'; labels?: { close?: string };
}
```

### B.4 Option resolution (pure, `resolve-options.ts`)
Per field: toast option → toast `preset` (bounce/spring only) → Toaster prop → Toaster `preset` → defaults
(`bounce .4`, `spring true`, `showProgress false`, `showTimestamp true`, compact `duration 4000`,
`displayDuration 4000`, `closeButton false`, `swipeToDismiss true`). Expanded toasts ignore `duration`; compact toasts
ignore `timing.displayDuration`.

### B.5 Exact `src/lib/index.ts`

```ts
export { default as Toaster } from './Toaster.svelte';
export { toast } from './toast';
export { animationPresets } from './animation-presets';
export type {
  ToastType, ToastPhase, ToastOptions, ToastUpdateOptions, ToastAction, ToastClasses, ToastTimings,
  PromiseData, DismissFilter, AnimationPreset, AnimationPresetName, ToasterProps, Position, Theme
} from './types';
```
Nothing else. Runtime keys: exactly `Toaster`, `toast`, `animationPresets`. Styles are consumed via
`import '@elericuz/cool-toast/styles.css'`.

### B.6 CSS custom properties (declared on `[data-cool-toaster]`; dark values under `[data-theme="dark"]`)

| Variable | Light | Dark |
|---|---|---|
| `--cool-toast-gap` (inline, from prop) | `14px` | — |
| `--cool-toast-offset` (inline, from prop) | `24px` | — |
| `--cool-toast-font` | `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif` | same |
| `--cool-toast-fill` | `#ffffff` | `#1a1a1a` |
| `--cool-toast-border-color` | `none` | `none` |
| `--cool-toast-border-width` | `1.5` | `1.5` |
| `--cool-toast-shadow` | `drop-shadow(0 4px 12px rgba(0,0,0,.06)) drop-shadow(0 1px 4px rgba(0,0,0,.04))` | `drop-shadow(0 4px 12px rgba(0,0,0,.3)) drop-shadow(0 1px 4px rgba(0,0,0,.2))` |
| `--cool-toast-description-color` | `#444444` | `#e0e0e0` |
| `--cool-toast-timestamp-color` | `#999999` | `#777777` |
| `--cool-toast-close-color` | `#555555` | `#e0e0e0` |
| `--cool-toast-progress-track` | `rgba(0,0,0,.06)` | `rgba(255,255,255,.1)` |
| `--cool-toast-default-color` | `#555555` | `#cccccc` |
| `--cool-toast-default-progress` | `#999999` | `#888888` |
| `--cool-toast-default-action-bg` / `-hover` / `-active` | `#E8E8E8` / `#DCDCDC` / `#D0D0D0` | `#3a3a3a` / `#444444` / `#4e4e4e` |
| `--cool-toast-success-color` (also progress) | `#4CAF50` | `#66BB6A` |
| `--cool-toast-success-action-bg` / `-hover` / `-active` | `#C8E6C9` / `#A5D6A7` / `#81C784` | `#1b5e20` / `#2e7d32` / `#388e3c` |
| `--cool-toast-error-color` | `#E53935` | `#EF5350` |
| `--cool-toast-error-action-bg` / `-hover` / `-active` | `#FFCDD2` / `#EF9A9A` / `#E57373` | `#b71c1c` / `#c62828` / `#d32f2f` |
| `--cool-toast-warning-color` | `#C49000` | `#FFB300` |
| `--cool-toast-warning-action-bg` / `-hover` / `-active` | `#FFECB3` / `#FFE082` / `#FFD54F` | `#4a3800` / `#5c4600` / `#6e5400` |
| `--cool-toast-info-color` | `#1E88E5` | `#42A5F5` |
| `--cool-toast-info-action-bg` / `-hover` / `-active` | `#BBDEFB` / `#90CAF9` / `#64B5F6` | `#0d47a1` / `#1565c0` / `#1976d2` |
| `--cool-toast-loading-color` | `#555555` | `#cccccc` |
| `--cool-toast-progress-duration` (inline per toast) | `4000ms` | — |

Loading phase uses the info action/progress colours (goey parity). Action text colour = type colour.

### B.7 Constants (`src/lib/constants.ts`) — worker-qa verifies statically

| Name | Value |
|---|---|
| `PILL_HEIGHT` (PH) | 34 |
| `PILL_RADIUS` | 17 |
| `NECK_CURVE_MAX` | 14 (×t) |
| `BODY_CORNER_MAX` | 16; `cr = min(16, (bodyH−PH)·0.45)` |
| `PILL_THRESHOLD` | 8 (`bodyH − PH < 8` → pill) |
| `EXPAND_DELAY_MS` | 330 (0 under reduced motion) |
| `MORPH_DURATION_MS` | 900 |
| `DISMISS_AFTER_COLLAPSE_MS` | 800 |
| `SUCCESS_LABEL_DISMISS_MS` | 1200 |
| `DEFAULT_DISPLAY_MS` / `DEFAULT_DURATION_MS` | 4000 |
| expanded timer | `display − 330 − 900` (= 2770 default); reduced motion `display − 10` |
| `SWIPE_THRESHOLD_PX` | 100; dead zone 10; opacity `max(0, 1 − |dx|/150)` |
| `SQUISH_DEBOUNCE_MS` | 300 |
| `MOUNT_SQUISH_DELAY_MS` | 45 |
| `EXPAND_SQUISH_DELAY_MS` | 80 |
| `ANNOUNCER_CLEAR_MS` | 7000 |
| `ICON_SWAP_MS` | 200 (10 under reduced motion) |
| `FADE_MS` | 350, easing `cubic-bezier(.4,0,.2,1)` (10 under reduced motion) |
| `REMEASURE_MS` | 100 |
| Morph expand | spring `{duration .9, bounce b}`; tween `{duration .6, ease [.4,0,.2,1]}` when `spring:false` |
| Morph collapse | pre-dismiss or no spring: tween `{duration .9, ease [.4,0,.2,1]}`; else spring `{duration .9, bounce b·.875}` |
| Pill resize | spring `{duration .5, bounce b·.875}`; tween `{duration .4, ease [.4,0,.2,1]}` |
| Squish spring | `{type:'spring', stiffness 200 + b·437.5, damping 24 − b·20, mass .7}` |
| Landing squish (mount/expand) | `scaleY 1 − .12·(b/.4)·sin(vπ)`, `scaleX 1 + .06·(b/.4)·sin(vπ)`, origin `center top` |
| Landing squish (collapse) | compress `.035`, expand `.018`, spring `(.9,.9,b)` |
| Header squish | `scale(1 − .05·v) translateY(v px)`; reverse tween `.45s` when no spring |
| Error shake | `animate(0,1,{duration .4, ease 'easeOut'})`, `translateX(sin(v·π·6)·(1−v)·3 px)` |
| Icon swap | `{opacity 0, scale .5}` ↔ `{1, 1}`, 200 ms |
| Progress bar | `scaleX 1→0 linear forwards`, `transform-origin left center`, 3 px tall |
| Expanded content | `min-width 300px; max-width 380px`; padding compact `7px 10px`, expanded `7px 10px 16px 10px` |
| Icon size | 18×18, stroke 2, round caps |
| Spinner path | `M21 12a9 9 0 1 1-6.219-8.56`, `1s linear infinite` |

### B.8 DOM / data-attribute contract (what tests select)

| Element | Attributes |
|---|---|
| Toaster root | `data-cool-toaster`, `data-position`, `data-side="left\|center\|right"`, `data-y="top\|bottom"`, `data-theme="light\|dark"`, `dir`, inline `--cool-toast-gap`, `--cool-toast-offset` |
| List | `ol[data-cool-toast-list]` |
| Toast | `li[data-cool-toast]`, `data-id`, `data-type`, `data-phase`, `data-expanded="true\|false"`, `data-state="pill\|morphing\|expanded\|collapsing"`, `data-side`, `data-hovered`, `data-swiping`, `data-shake`, `data-reduced-motion`, `role`, `aria-live`, `aria-atomic` |
| Blob | `svg[data-cool-toast-blob][aria-hidden=true] > path` (`fill`, `stroke`, `stroke-width`, `d`) |
| Content | `[data-cool-toast-content]`, header `[data-cool-toast-header]`, icon `[data-cool-toast-icon]`, title `[data-cool-toast-title]`, timestamp `[data-cool-toast-timestamp]` (+ `data-slot="header\|description\|action"`), description row `[data-cool-toast-description-row]`, description `[data-cool-toast-description]`, action wrapper `[data-cool-toast-action-wrapper]`, action `button[data-cool-toast-action]`, progress `[data-cool-toast-progress][data-paused]` with child `.cool-toast-progress-bar` |
| Close | `button[data-cool-toast-close][data-side="top-left\|top-right"]` |
| Announcer | `[data-cool-toast-announcer="polite"]`, `[data-cool-toast-announcer="assertive"]` |

Class names for styling are `cool-toast-*` (e.g. `cool-toast-wrapper`, `cool-toast-content`, `cool-toast-progress-bar`,
`cool-toast-spin`); `classes` from options are appended to the corresponding element.

## C. File ownership (from `.claude/agents/*.md`)

| Path | Owner | Notes |
|---|---|---|
| `src/lib/**` (components, store, types, `styles.css`) | worker-web | published code |
| `src/lib/index.ts` | worker-web | the only public entry |
| `src/routes/**`, `src/app.css`, `src/app.html` | worker-web | demo, not published |
| `package.json` (`exports`, `peerDependencies`, `files`, scripts), `svelte.config.js` (if the scaffold creates one; otherwise the `sveltekit({...})` block in `vite.config.ts`), `vite.config.ts`, `tsconfig.json`, `eslint.config.js`, `prettier.config.js`, `.prettierignore` | worker-web | |
| `README.md`, `LICENSE`, `NOTICE` | worker-web | |
| `vitest.config.ts` | worker-web creates; worker-qa may edit `test.*` keys | |
| `tests/**` (`setup.ts`, mocks, fixtures, `*.test.ts`) | worker-qa | only agent that writes and runs tests |
| `openspec/**` | lead-worker | |
| Commits, builds (`npm run build`, `npm run package`) | lead-worker only | neither worker builds or commits |

worker-web may run `npm run lint`, `npm run check`, `npm run format:check`, `npm run dev`. worker-qa runs
`npm test -- <path>`, `npm run lint`, `npm run check`, `npm run format:check`. Runs are targeted (< 1 min).

## D. Deviations from `svelte-creator` for a library demo

Keep: `npx -y sv create <dir> --template minimal --types ts --no-add-ons --install npm`; Tailwind 4 via
`@tailwindcss/vite` (demo only); Design Principles (characterful font pair, intentional palette registered in
`@theme`, no Inter/Roboto/Arial/system-ui/Space Grotesk, no purple-on-white gradient); CSS rules (no `<style>` in demo
`.svelte` files, no inline `style=`, no arbitrary values, utilities via `@apply` in `@layer utilities`); route group
`(site)` with its own layout; delete `src/routes/+page.svelte`; keep `src/routes/+layout.svelte`.

Change:
1. One CSS file `src/app.css` (not `site.css`/`admin.css`); it also imports the library stylesheet
   (`@import '../src/lib/styles.css'` or via the layout). The library CSS never depends on Tailwind.
2. Skip: `@sveltejs/adapter-node`, `dotenv`/`dotenv-cli`, `.env*`, `src/hooks.server.ts`, `src/routes/api/**`,
   `(admin)` group, `src/lib/services`, `src/lib/stores`, `src/lib/components/{site,admin,utils}`, `start` script,
   `allowedHosts`. Keep the adapter the template generated (demo is dev-only, decision §H.3).
3. `src/lib` is the **published library**, not the app's component folder. Demo-only components live under
   `src/routes/(site)/components/`; demo state in `src/routes/(site)/playground.svelte.ts`. Nothing demo-related
   under `src/lib`.
4. Library source imports are relative (never `$lib`/`#lib`). The demo imports the library through the package
   alias the scaffold provides (`$lib` or `#lib`, whichever exists) from `src/lib/index.ts`.
5. Playground state is a `.svelte.ts` runes module (not a `src/lib/stores` writable).
6. "Dev check" for a missing stylesheet import is not implemented (goey's NODE_ENV sentinel); README documents the import.
7. Scripts: `dev`, `build`, `preview`, `package` (`svelte-package`; never run in this workflow), `check`, `lint`,
   `format`, `format:check`, `test` (`vitest run`), `test:watch`.

Demo page content (W5-T3): hero with a live toast trigger; playground with controls for type, position, preset,
description, action (+successLabel), promise (resolve/reject), theme, showProgress, showTimestamp, closeButton,
queue burst, swipe hint, reduced-motion indicator; generated `<Toaster>` + `toast(...)` snippets; install instructions.
Content language: English.

## E. Test infrastructure agreement

- Runner: **vitest** (`npm test -- <path>` → `vitest run <path>`; `include: ['tests/**/*.test.ts']`).
- Environment: `jsdom`. Config `vitest.config.ts`: `plugins: [sveltekit()]`, `resolve.conditions: ['browser']`,
  `test: { environment: 'jsdom', globals: false, setupFiles: ['tests/setup.ts'], include: ['tests/**/*.test.ts'] }`.
- Libraries: `@testing-library/svelte` (`render`, `screen`, `cleanup` auto), `@testing-library/jest-dom/vitest`,
  `@testing-library/user-event` (`userEvent.setup({ advanceTimers: vi.advanceTimersByTime })` when fake timers are on).
- Fake timers: `vi.useFakeTimers()` in `beforeEach` of every timing test; `vi.advanceTimersByTime(ms)` and
  `await vi.advanceTimersByTimeAsync(ms)` for promise-based flows; `vi.useRealTimers()` in `afterEach`.
  `vi.setSystemTime` for timestamps.
- `tests/setup.ts` provides: `matchMedia` stub with per-query controllable `matches` and `change` dispatch
  (`setMediaQuery(query, matches)`), `ResizeObserver` stub (`triggerResize()`), `PointerEvent` polyfill,
  synchronous `requestAnimationFrame`, `Element.prototype.setPointerCapture/releasePointerCapture` no-ops,
  `HTMLElement.prototype.offsetWidth/offsetHeight` getters reading `data-test-w/h` or a default map
  (header 100, content compact 120×34, content expanded 300×90), `scrollIntoView` no-op.
- `tests/mocks/motion.ts`: `vi.mock('motion', …)` factory exposing `animateMock` with `.completeAll()`,
  `.progressAll(t)` and a record of calls (`from, to, options`) so tests can assert spring options and drive frames.
  Default mode: complete synchronously (`onUpdate(to)` then `onComplete()`).
- Layout: `tests/` mirrors `src/lib/` (`tests/morph-path.test.ts`, `tests/toast-store.test.ts`,
  `tests/components/Toaster.test.ts`, …); fixtures in `tests/fixtures/`, mocks in `tests/mocks/`.
- Tests exercise the public API (`src/lib/index.ts`) and rendered DOM; pure modules may be imported directly.
  Comments in Spanish, names in English.
- Between tests: `toast.dismiss()` + `vi.runOnlyPendingTimers()` in `afterEach`, plus a store reset helper
  exported for tests only from `toast-store.svelte.ts` as `__resetToastStoreForTests()` (not re-exported by `index.ts`).

## F. LICENSE / NOTICE text (worker-web, W0-T4)

`LICENSE`: standard MIT, "Copyright (c) 2026 Eric Valera Miller", followed by:

```
NOTICE

Cool-Toast is an independent Svelte reimplementation of goey-toast
(https://github.com/anl331/goey-toast), Copyright (c) 2026, released under the MIT License.
Animation constants, the gooey path algorithm and default colour values are derived from that project.
The original permission notice is reproduced below.

[goey-toast MIT text verbatim, as in goey-toast-study.md §6]
```
`NOTICE` file: the same NOTICE block. README "Attribution" section: two sentences with the link and the license.

## G. Definition of done per task

1. RED run output pasted to worker-web (failure reason matches the scenario).
2. GREEN run output pasted to lead-worker by worker-qa.
3. `npm run check` and `npm run lint` clean for touched files.
4. Public API matches §B; data attributes match §B.8.
5. No `$state` written per animation frame (worker-qa greps `morph-driver.ts`/`swipe.ts` for `$state`).
6. Comments in Spanish, identifiers in English.

## H. Decisions (approved by the user on 2026-10-28)

1. npm package name: `@elericuz/cool-toast`. Stylesheet import: `import '@elericuz/cool-toast/styles.css'`.
   `LICENSE` copyright holder: "Eric Valera Miller".
2. `description` / `icon` accept only `string | Snippet`. No HTML strings, no `{@html}`.
3. Demo is dev-only: keep the adapter the `sv create` template generates.
4. Default `theme` is `'system'`.
