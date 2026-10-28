# Design — cool-toast-v1

Source of truth for behaviour: `goey-toast-study.md` (sections referenced as "study §n"). Decisions below were taken
by lead-worker and are not reopened here; rationale is recorded for the record.

## 1. Architecture decisions

### D1 — Own store with `$state` runes (replaces sonner)
**Decision**: a lazily created store in `src/lib/toast-store.svelte.ts`. No sonner, no svelte-sonner.
**Rationale** (study §7.1, §4): goey already implements its queue, timers, hover pause, callbacks, promise lifecycle,
update and announcer outside sonner; sonner only supplied the `<ol>/<li>` stack and an expiry timer, at the cost of
`syncSonnerHeights`, two `MutationObserver`s and `!important` CSS. Owning the layout removes every one of those hacks.
**Alternatives**: svelte-sonner (B) — inherits the fight over heights; svelte-french-toast (C) — different stack model,
less control. Both add a dependency that tracks another library's internals.

### D2 — `motion` (vanilla `animate`) as the per-frame driver (replaces framer-motion)
**Decision**: the single runtime dependency is `motion`; used only through `animate(from, to, options)` for the
morph `t`, pill-resize dims, landing/header squishes and the error shake.
**Rationale** (study §7.2): same engine and API shape as framer-motion's imperative `animate` incl.
`{ type: 'spring', duration, bounce }`, so every constant in study §1.7/§3 carries over unchanged and `.stop()`
semantics match. Svelte's `Spring`/`tweened` have no duration/bounce parametrisation and are store-shaped, awkward
for `setAttribute('d')`. CSS/WAAPI cannot morph a path whose command structure changes. A hand-rolled spring is 40
lines of physics to test and tune.
**Everything else is native Svelte**: fades (`transition:fade`, 350 ms, cubic-bezier(.4,0,.2,1) via
`svelte/easing` `cubicOut`-equivalent custom easing), icon swap (`{#key phase}` + `in:scale`/`out:scale`, 200 ms, delayed
`in`), stack reflow (`animate:flip`), progress bar and spinner (CSS keyframes).

### D3 — Per-frame values never enter Svelte reactivity
**Decision**: `t`, interpolated `{pw, bw, th}`, squish/shake transforms and swipe `dx` are plain `let` variables inside
`morph-driver.ts` / `swipe.ts`, written with `path.setAttribute('d', …)`, `el.style.transform = …`, etc.
Only event-level facts are `$state`: toast list, phase, expanded, hovered, dismissing, reduced-motion, measured dims
(set only when a measurement changes).
**Rationale** (study §3.4, §7.3 point 1): a `$state` update per frame would schedule a Svelte flush per frame and
re-run effects for nothing; goey explicitly keeps these in refs. The morph is a pure function + a `t` driver, which is
framework-independent.

### D4 — Pure path functions
`src/lib/morph-path.ts` exports `morphPath(pw, bw, th, t)` and `morphPathCenter(pw, bw, th, t)` implementing the
algorithm of study §2.3 exactly: `PH = 34`, `pr = 17`, `pillW = min(pw, bw)`, `bodyH = PH + (th − PH)·t`, pill when
`t ≤ 0 || bodyH − PH < 8`, `curve = 14·t`, `cr = min(16, (bodyH − PH)·0.45)`, `bodyW = pillW + (bw − pillW)·t`,
`bodyTop = PH − curve`, `qEndX = min(pillW + curve, bodyW − cr)`. Centre variant per study §2.3 (pillOffset,
halfBodyW, qLeftX/qRightX). Single-entry memo keyed on the four args (study: `memoizePath`).

### D5 — Reactive Toaster config through the store
**Decision**: `<Toaster>` writes its resolved props into `store.config` (a `$state` object) in an `$effect`; toasts read
`store.config` when resolving options and when rendering. No module-level `let _theme` globals (study §1.6 warns these
are fragile and not SSR-safe). The store object itself is a module singleton created on first use (`getStore()`),
which is acceptable: it holds `$state`, is created lazily, and is never created during SSR import.
**Multiple Toasters** are unsupported; mounting a second one logs a `console.warn` in dev.

### D6 — Own stack layout
`<ol>` is `display: flex; flex-direction: column; gap: var(--cool-toast-gap)`; `top-*` positions use
`column` (newest first = top), `bottom-*` use `column-reverse` so the newest is nearest the edge. Horizontal
alignment via `align-items: flex-start|center|flex-end` from `data-side`. Offsets via `--cool-toast-offset`. Toasts
leaving animate with `out:fade` and siblings reflow with `animate:flip` (350 ms). The keyed `{#each}` and its `<li>`
live in `Toaster.svelte` (key `${id}:${version}`) so `animate:flip` applies; `Toast.svelte` renders the `<li>` content. No collapsed-deck/expand-on-hover
mode in v1 (goey relied on sonner for it; out of scope, listed as a future change).

### D7 — Timers in the store, lifecycle in the component
`toast-store.svelte.ts` owns a timer primitive per toast id (`startTimer(id, ms, cb)`, `pauseTimer(id)`,
`resumeTimer(id)`, `clearTimer(id)`) built on injected `setTimeout`/`clearTimeout`/`Date.now` (fake-timer friendly,
study §3.1 step 6 "remainingRef"). `Toast.svelte` decides *which* timer runs (compact duration vs expanded
`displayDuration − 330 − 900`, 800 ms post-collapse, 1200 ms successLabel) and reacts to hover via `store.setHovered(id, bool)`.
Rationale: the store is testable without DOM; the component stays a thin orchestrator.
**Amendment (Wave 2, approved by lead)**: the timer primitive (`timers.ts`, `createTimers()`) is instantiated per
`Toast.svelte` instance on mount instead of living in the store. Behaviour is identical and SSR-safe (timers exist only
after mount); the store stays timer-free. Callbacks fire on dismiss (store level), and the queue advances after
`remove` (end of the exit transition).

### D8 — Dismissal with manual flag
`store.dismiss(id, { manual: true })` is used by the API, close button, Escape, swipe and `successLabel`; timers call
`store.dismiss(id, { manual: false })`. `onAutoClose` fires only when `manual === false` (fixes goey's quirk where
swipe/close counted as auto close, study §1.8). Order: `onAutoClose` → `onDismiss` → process queue, after the exit
transition removes the record.

### D9 — Accessibility
- Announcer: two visually hidden regions in `Announcer.svelte` (study §1.8): clear → set in `requestAnimationFrame`
  (tests stub rAF to run synchronously) → clear after 7000 ms. Message `"title: description"` only when description is
  a string. Channel: `error|warning` assertive, everything else polite.
- Per-toast `role`/`aria-live`/`aria-atomic` mirror the channel.
- Close button `aria-label = labels.close` (default `'Close notification'`); action button `aria-label = label`.
- Escape dismisses the newest active toast (document `keydown` listener registered by the Toaster, removed on destroy).
- Reduced motion (`reduced-motion.svelte.ts`, `matchMedia` + change listener): expand delay 0, fades 10 ms, morphs snap
  (`t` set to 1/0 directly, `animate` not called), squish/shake skipped, display timer `display − 10`.

### D10 — Mirroring
Same left-anchored path for both sides (study §2.5). `data-side="right"` → CSS: `li { margin-left: auto }`, blob
wrapper `transform: scaleX(-1)`, content `transform: scaleX(-1); text-align: right`. Centre: `margin: 0 auto`, content
centred, description left-aligned, `morphPathCenter`. `isRight = dir === 'rtl' ? (isCenter ? false : !posIsRight) : posIsRight`.
Squish/shake transforms prepend `scaleX(-1) ` when mirrored.

### D11 — Measurement
`measure()` in `Toast.svelte`: clear inline width/overflow/max-height, read `pw = header.offsetWidth + content padding`,
`bw = content.offsetWidth`, `th = content.offsetHeight`, restore. Runs in `$effect` after mount, again at 100 ms, and
from a `ResizeObserver` on the content. Stored in `$state dims` only when values change. jsdom returns 0 for offsets:
tests stub `offsetWidth/Height` getters on `HTMLElement.prototype` in `tests/setup.ts`.

### D12 — Swipe with Pointer Events
`swipe.ts` exports a Svelte attachment `swipeToDismiss(getOptions)` applied to the `<li>`: `pointerdown` records
origin and sets `pointer capture`; first move with `|dy| > |dx| && |dy| > 10` cancels; after `|dx| > 10` writes
`transform: translateX(dx)`, `opacity: max(0, 1 − |dx|/150)`, `transition: none`, `data-swiping="true"`;
`pointerup/cancel`: `|dx| ≥ 100` → `store.dismiss(id, { manual: true })`, else clear inline styles. Works for mouse and
touch (goey was touch-only).

### D13 — Theme
`theme: 'light' | 'dark' | 'system'` (default `'system'`, approved). `'system'` resolves through
`matchMedia('(prefers-color-scheme: dark)')` with a change listener (`theme.svelte.ts`). The resolved value is
`data-theme` on `[data-cool-toaster]`; all colours come from `--cool-toast-*` variables scoped there, so a consumer
can also override per theme or per instance.

### D14 — License
MIT. The port is a clean reimplementation from the study, but it reproduces goey's constants, path algorithm and CSS
values, so `LICENSE` carries our MIT text followed by a NOTICE section:
"Portions derived from goey-toast (https://github.com/anl331/goey-toast), Copyright (c) 2026, MIT License" with goey's
permission text reproduced. README has an "Attribution" section with the same credit. Owned by worker-web.

### D15 — Stack choice and packaging
SvelteKit via `npx sv create` (whatever major it yields), Svelte 5 runes, TypeScript, `@sveltejs/package`.
Library code uses **relative imports only** (never `$lib` or `#lib`): packaged output must not depend on an app alias
(risk R1). If `sv create` yields SvelteKit 3 (no `svelte.config.js`, config inside `vite.config.ts`), worker-web owns
`vite.config.ts` instead and verifies `svelte-package` picks `src/lib` by default (`--input src/lib` as fallback in the
`package` script). `svelte` ^5 peer; `motion` dependency; `sideEffects: ['**/*.css']`. Package name `@elericuz/cool-toast`. The demo is
dev-only: the adapter generated by the template stays. `description`/`icon` accept only `string | Snippet` — no HTML
strings, no `{@html}` anywhere in the library.

## 2. Module layout

```
src/lib/
  index.ts                  # public surface only (see handoff §B.5)
  types.ts                  # all exported types + internal ToastRecord
  constants.ts              # PH, timings, swipe threshold, etc. (handoff §B.7)
  animation-presets.ts      # animationPresets (frozen)
  resolve-options.ts        # pure: (ToastOptions, ToasterConfig) → ResolvedToastOptions
  animation-config.ts       # pure: spring/tween option builders, squish/shake transform strings
  morph-path.ts             # pure: morphPath, morphPathCenter (memoised)
  timers.ts                 # pausable timer primitive (injectable clock)
  toast-store.svelte.ts     # $state store: records, queue, config, hover, dismiss, update, callbacks
  toast.ts                  # public `toast` function object (thin wrapper over the store)
  reduced-motion.svelte.ts  # $state prefersReducedMotion + matchMedia listener (lazy, SSR-safe)
  theme.svelte.ts           # resolveTheme('system') → 'light'|'dark' reactive
  morph-driver.ts           # class MorphDriver: motion.animate controllers, flush(), DOM writes
  swipe.ts                  # Svelte attachment for pointer swipe
  Toaster.svelte            # <ol>, positions, config sync, Escape, Announcer
  Toast.svelte              # one toast: measure, phases, timers, slots, blob svg, buttons, progress
  Announcer.svelte          # aria-live regions
  Icon.svelte               # built-in icons by type/phase
  styles.css                # all library CSS + --cool-toast-* variables
tests/                      # mirrors src/lib (see handoff §E)
src/routes/                 # demo (not published)
```

## 3. Data flow

### 3.1 Create
```
toast.success('Saved', opts)
  → toast.ts: getStore().add({ title, type:'success', options })
  → store: id = opts.id ?? random(); record = { id, type, phase, title, ..., status }
     if active.length < config.visibleToasts → status 'active' (push to records)
     else enqueue (apply maxQueue/queueOverflow) → status 'queued'
  → Toaster.svelte: {#each store.active as t (t.id)} <Toast record={t}/> (animate:flip, out:fade)
  → Toast.svelte onMount: measure → MorphDriver.init(pill) → announcer.announce(record)
```
### 3.2 Expanded lifetime (`Toast.svelte` state machine)
```
pill ──330ms (0 if RM)──▶ morphing ──controller done──▶ expanded ──timer (display−330−900)──▶ collapsing
  ▲                                                        │ hover: pause + (if collapsing) re-expand
  └──controller done── collapsing ◀────────────────────────┘
pill (after collapse) ──800ms──▶ store.dismiss(id,{manual:false}) → out:fade 350ms → record removed
                                     → onAutoClose, onDismiss → processQueue()
```
`data-state ∈ {pill, morphing, expanded, collapsing}` is `$state`; the driver's `t` is not.

### 3.3 Promise
`toast.promise(p, data)` → `add({ type:'default', phase:'loading', title: data.loading, description: data.description?.loading })`;
`p.then(d => store.settle(id, 'success', resolve(data.success, d), resolve(description.success, d), data.action?.success))`,
`.catch(e => store.settle(id, 'error', …))`. `settle` is a no-op if the record no longer exists. After settle, the
component restarts its lifecycle: compact → duration timer; expanded → expand timeline. Pill resize animates dims when
the title width changes while in `pill`.

### 3.4 `motion` adapter
`morph-driver.ts` wraps `animate(from, to, { ...options, onUpdate, onComplete })` and stores the returned controls;
`stop()` is called before every new animation; `currentT` is read from the last `onUpdate` so re-expand starts from the
current value. If the installed `motion` exposes a different signature (R2), only this adapter changes.
Reduced motion: the driver's `snapTo(t)` writes the final path and styles without `animate`.

### 3.5 Hover
`pointerenter/leave` on the `<li>` → `store.setHovered(id, bool)` → `Toast.svelte` `$effect`: hovered → `pauseTimer`,
abort collapse and re-expand if `data-state === 'collapsing'`; not hovered → `resumeTimer`. Progress bar
`data-paused` mirrors hovered; re-expand bumps a `progressKey` so the bar restarts.

## 4. Deviations from goey ("our touch") — frozen list
1. `theme: 'system'` added and is the default (approved).
2. All colours as `--cool-toast-*` custom properties with goey's hex defaults; dark theme overrides the same variables.
3. `labels` prop (`{ close }`), default `'Close notification'`.
4. `richColors` dropped.
5. Swipe via Pointer Events (mouse + touch), same threshold/opacity law.
6. Bug fixes: `showProgress` works for promise toasts; swipe/close/Escape are manual dismissals; `update()` works for
   queued toasts; `ToastType` exported.
7. aria-live channel: polite for default/success/info/loading, assertive for error/warning (same as goey, now specified).
8. `prefers-reduced-motion` honoured on every animation incl. morph snap (goey did this; we keep and test it).
9. No sonner collapsed deck / expand-on-hover stack mode (not reimplemented in v1).

## 5. SSR safety
- No `$state`, `matchMedia`, `ResizeObserver` or timer is touched at module import time; all are created inside
  functions called from component lifecycle or from `toast()` (which, on the server, creates records that are never
  rendered and never start timers because timers start in `Toast.svelte` on mount).
- `Toaster.svelte` renders the empty `<ol>` + announcer on the server; the toast list is rendered client-side only
  (`{#if mounted}` guard) to avoid hydration mismatch.
- `reduced-motion.svelte.ts` and `theme.svelte.ts` return the "light / no reduction" defaults when `window` is absent.

## 6. CSS variables scheme
All variables live on `[data-cool-toaster]` (light defaults) and `[data-cool-toaster][data-theme="dark"]`. Naming:
`--cool-toast-{token}` for globals (fill, border-color, border-width, shadow, text, description, timestamp,
progress-track, close, font, radius), `--cool-toast-{type}-color`, `--cool-toast-{type}-progress`,
`--cool-toast-{type}-action-bg|-action-bg-hover|-action-bg-active` for the five types. Internal per-toast inline
variables: `--cool-toast-progress-duration`. Full table with values: `handoff.md` §B.6. The blob `fill` is
`fillColor ?? 'var(--cool-toast-fill)'` so the variable governs the SVG as well.

## 7. Testing strategy (how design serves Strict TDD)
- Pure modules (`morph-path`, `resolve-options`, `animation-config`, `timers`, `animation-presets`) get unit tests with
  exact numbers.
- Store tests import `toast-store.svelte.ts` under the Svelte Vite plugin and drive it with fake timers; no DOM.
- Component tests render `<Toaster>` via `@testing-library/svelte`, call the public `toast` API, and assert the
  data-attribute contract (handoff §B.8). `motion`'s `animate` is mocked with a controllable stub
  (`tests/mocks/motion.ts`) that calls `onUpdate(to)` + `onComplete()` synchronously or on demand.
- `tests/setup.ts` installs `@testing-library/jest-dom`, stubs `matchMedia`, `ResizeObserver`, `PointerEvent`,
  `requestAnimationFrame` (sync) and `HTMLElement.prototype.offsetWidth/offsetHeight` getters driven by a per-test map.
