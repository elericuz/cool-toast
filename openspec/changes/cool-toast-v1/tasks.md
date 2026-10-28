# Tasks — cool-toast-v1

Strict TDD. For every task with tests: worker-qa writes RED (and confirms the failure reason) → worker-web writes the
minimum GREEN → worker-qa re-runs, reviews, approves to lead-worker. Tests live in `tests/` mirroring `src/lib/`
(`src/lib/morph-path.ts` → `tests/morph-path.test.ts`; components → `tests/components/<Name>.test.ts`).
Within a wave, worker-qa writes ALL RED tests first (one task = one test file or one `describe` cluster), then
worker-web goes GREEN file by file. Tasks on different files in the same wave may run in parallel.

Legend: owner `web` = worker-web, `qa` = worker-qa. "Acceptance" lists spec scenario ids.

## Wave 0 — Scaffold (no unit tests except the smoke test)

- [ ] **W0-T1** Scaffold project · owner web · files: whole repo via `npx -y sv create . --template minimal --types ts --no-add-ons --install npm` (or into a temp dir then moved), `package.json`, `tsconfig.json`, `vite.config.ts` (+ `svelte.config.js` if generated) · depends-on: — · acceptance: `npm run check` passes on the scaffold.
- [ ] **W0-T2** Library packaging config · owner web · files: `package.json` (`name "@elericuz/cool-toast"`, `version 0.1.0`, `type: module`, `svelte`, `types`, `exports` for `.` and `./styles.css`, `files: ['dist']`, `sideEffects: ['**/*.css']`, `peerDependencies.svelte ^5`, `dependencies.motion`, scripts `package`, `lint`, `format`, `format:check`, `check`, `test`), `.npmignore`/`files`, `src/lib/index.ts` stub (`export {}`), `src/lib/styles.css` empty with header comment · depends-on: W0-T1 · acceptance: STYLE-8 (verified in W4-T5), file presence.
- [ ] **W0-T3** Dev tooling · owner web · files: `package.json` devDeps (`vitest`, `@testing-library/svelte`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`, `@sveltejs/package`, `prettier`, `prettier-plugin-svelte`, `eslint`, `eslint-plugin-svelte`, `typescript-eslint`, `@tailwindcss/vite`, `tailwindcss`), `vitest.config.ts` (`plugins: [sveltekit()]`, `test.environment 'jsdom'`, `setupFiles ['tests/setup.ts']`, `include ['tests/**/*.test.ts']`, `resolve.conditions ['browser']`), `eslint.config.js`, `.prettierrc`, `.prettierignore`, `.gitignore` · depends-on: W0-T1 · acceptance: `npm run lint`, `npm run format:check` run.
- [ ] **W0-T4** LICENSE + NOTICE · owner web · files: `LICENSE` (MIT, "Copyright (c) 2026 Eric Valera Miller", + NOTICE section crediting goey-toast, see design D14), `NOTICE` · depends-on: — · acceptance: text present as in handoff §F.
- [ ] **W0-T5** Test harness + smoke test · owner qa · files: `tests/setup.ts` (jest-dom, matchMedia/ResizeObserver/PointerEvent/rAF stubs, offsetWidth/Height getter hook), `tests/mocks/motion.ts` (controllable `animate` stub), `tests/smoke.test.ts` (renders a trivial `.svelte` fixture from `tests/fixtures/Hello.svelte` and imports a `.svelte.ts` fixture with `$state`) · depends-on: W0-T3 · acceptance: `npm test -- tests/smoke.test.ts` green; proves R3/R4 mitigations.

## Wave 1 — Pure core + store

- [ ] **W1-T1** Morph path functions · owner qa (RED) → web (GREEN) · files: `tests/morph-path.test.ts`, `src/lib/morph-path.ts`, `src/lib/constants.ts` (PH, PILL_RADIUS, NECK_CURVE 14, MAX_CORNER 16, PILL_THRESHOLD 8) · depends-on: W0-T5 · acceptance: MORPH-1..8.
- [ ] **W1-T2** Animation presets + option resolution · owner qa → web · files: `tests/resolve-options.test.ts`, `tests/animation-presets.test.ts`, `src/lib/animation-presets.ts`, `src/lib/resolve-options.ts`, `src/lib/types.ts` (ToastOptions, ToasterProps, ResolvedToastOptions …) · depends-on: W0-T5 · acceptance: API-2, API-3, API-4, API-5.
- [ ] **W1-T3** Animation config helpers · owner qa → web · files: `tests/animation-config.test.ts`, `src/lib/animation-config.ts`, `src/lib/constants.ts` (timings) · depends-on: W0-T5 · acceptance: ANIM-9.
- [ ] **W1-T4** Pausable timers · owner qa → web · files: `tests/timers.test.ts`, `src/lib/timers.ts` · depends-on: W0-T5 · acceptance: STORE-12.
- [ ] **W1-T5** Store: create, ids, types, dismiss by id/filter/all · owner qa → web · files: `tests/toast-store.test.ts` (describe "records"), `src/lib/toast-store.svelte.ts`, `src/lib/toast.ts` · depends-on: W1-T2, W1-T4 · acceptance: STORE-1, STORE-2, STORE-3, STORE-7, STORE-8 (store-level part), STORE-9, UPDATE-5.
- [ ] **W1-T6** Store: queue, visibleToasts, maxQueue, overflow, reactive config · owner qa → web · files: `tests/toast-store.test.ts` (describe "queue"), `src/lib/toast-store.svelte.ts` · depends-on: W1-T5 · acceptance: STORE-4, STORE-5, STORE-6, STORE-11 (store-level), STORE-13 (store-level: `setConfig`).
- [ ] **W1-T7** Store: callbacks with manual flag, update incl. queued, settle · owner qa → web · files: `tests/toast-store.test.ts` (describe "callbacks/update"), `src/lib/toast-store.svelte.ts` · depends-on: W1-T6 · acceptance: STORE-10 (store-level: `dismiss(id, {manual})`), UPDATE-1 (record-level), UPDATE-4, PROMISE-7 (record-level `settle` no-op), API-1 (type tests in `tests/api.types.test.ts`).

## Wave 2 — Rendering & lifecycle (components)

- [ ] **W2-T1** Toaster shell: DOM, positions, side mapping, theme, config sync, Escape · owner qa → web · files: `tests/components/Toaster.test.ts`, `src/lib/Toaster.svelte`, `src/lib/theme.svelte.ts`, `src/lib/index.ts` (export Toaster, toast) · depends-on: W1-T7 · acceptance: RENDER-1, RENDER-2, RENDER-10, RENDER-13, STORE-13 (end-to-end).
- [ ] **W2-T2** Announcer · owner qa → web · files: `tests/components/Announcer.test.ts`, `src/lib/Announcer.svelte`, store `announce` hook · depends-on: W2-T1 · acceptance: RENDER-8, PROMISE-1 (announcement part).
- [ ] **W2-T3** Toast compact rendering: structure, icons, timestamp, roles, classes, colours · owner qa → web · files: `tests/components/Toast.compact.test.ts`, `src/lib/Toast.svelte`, `src/lib/Icon.svelte` · depends-on: W2-T1 · acceptance: RENDER-3, RENDER-5 (compact), RENDER-6, RENDER-7, RENDER-14, RENDER-16, RENDER-17 (compact subset).
- [ ] **W2-T4** Toast expanded rendering: description/action/timestamp placement, close button + labels · owner qa → web · files: `tests/components/Toast.expanded.test.ts`, `src/lib/Toast.svelte` · depends-on: W2-T3 · acceptance: RENDER-4, RENDER-5 (expanded), RENDER-9, RENDER-17 (full), UPDATE-7.
- [ ] **W2-T5** Compact lifecycle: duration, hover pause, auto-dismiss, callbacks, queue advance · owner qa → web · files: `tests/components/Toast.lifecycle.test.ts`, `src/lib/Toast.svelte` · depends-on: W2-T3 · acceptance: RENDER-11, RENDER-12, STORE-10 (DOM-level), STORE-11 (DOM-level), STORE-8 (DOM-level).
- [ ] **W2-T6** Expanded lifecycle timeline with stubbed driver: expand at 330, display timer, collapse, 800 ms dismiss, progress var, successLabel · owner qa → web · files: `tests/components/Toast.expanded-lifecycle.test.ts`, `src/lib/Toast.svelte`, `src/lib/morph-driver.ts` (interface + snap implementation only) · depends-on: W2-T4, W1-T3 · acceptance: ANIM-1 (states only), ANIM-2, ANIM-8, RENDER-15 (non-promise), UPDATE-6.
- [ ] **W2-T7** Promise lifecycle · owner qa → web · files: `tests/components/Toast.promise.test.ts`, `src/lib/toast.ts`, `src/lib/Toast.svelte` · depends-on: W2-T6 · acceptance: PROMISE-1..7, RENDER-15 (promise), ANIM-5.
- [ ] **W2-T8** Update through the DOM · owner qa → web · files: `tests/components/Toast.update.test.ts`, `src/lib/Toast.svelte` · depends-on: W2-T7 · acceptance: UPDATE-1, UPDATE-2, UPDATE-3, UPDATE-4 (DOM-level).

## Wave 3 — Animation layer

- [ ] **W3-T1** Morph driver with `motion`: controllers, interrupt, start-from-current, flush writes · owner qa → web · files: `tests/morph-driver.test.ts` (with `tests/mocks/motion.ts`), `src/lib/morph-driver.ts` · depends-on: W2-T6 · acceptance: ANIM-1 (d at t=0/1, cleared styles), ANIM-3 (driver-level: `expand()` from current t stops the running controller), ANIM-7.
- [ ] **W3-T2** Hover re-expand + progress re-key · owner qa → web · files: `tests/components/Toast.hover.test.ts`, `src/lib/Toast.svelte` · depends-on: W3-T1 · acceptance: ANIM-3 (DOM-level), SWIPE-7.
- [ ] **W3-T3** Squishes, header squish, shake, pill resize wiring · owner qa → web · files: `tests/components/Toast.effects.test.ts`, `src/lib/Toast.svelte`, `src/lib/morph-driver.ts` · depends-on: W3-T1 · acceptance: ANIM-6, ANIM-7 (DOM-level), ANIM-9 constants statically re-verified by qa against handoff §B.7.
- [ ] **W3-T4** Swipe attachment · owner qa → web · files: `tests/swipe.test.ts`, `src/lib/swipe.ts`, `src/lib/Toast.svelte` (apply attachment) · depends-on: W2-T5 · acceptance: SWIPE-1..6, STORE-10 (swipe line).
- [ ] **W3-T5** Reduced motion · owner qa → web · files: `tests/reduced-motion.test.ts`, `tests/components/Toast.reduced-motion.test.ts`, `src/lib/reduced-motion.svelte.ts`, `src/lib/Toast.svelte`, `src/lib/morph-driver.ts` · depends-on: W3-T1 · acceptance: ANIM-4, ANIM-8 (reduced value).

## Wave 4 — Styles, exports, docs

- [ ] **W4-T1** `styles.css` variables + dark overrides · owner qa → web · files: `tests/styles.test.ts`, `src/lib/styles.css` · depends-on: W2-T4 · acceptance: STYLE-2, STYLE-3, STYLE-6.
- [ ] **W4-T2** `styles.css` layout, keyframes, reduced-motion block, mirroring, close/action/progress rules · owner qa → web · files: `tests/styles.test.ts`, `src/lib/styles.css` · depends-on: W4-T1 · acceptance: STYLE-4, STYLE-5; visual check by web in the dev server.
- [ ] **W4-T3** Final `index.ts` exports and type surface · owner qa → web · files: `tests/index.test.ts`, `tests/api.types.test.ts`, `src/lib/index.ts`, `src/lib/types.ts` · depends-on: W3-T5 · acceptance: STYLE-7, API-1.
- [ ] **W4-T4** README (install, Toaster props, toast API, options, CSS variables, a11y, attribution) · owner web · files: `README.md` · depends-on: W4-T3 · acceptance: qa review: every public prop/function/variable in handoff §B appears.
- [ ] **W4-T5** package.json contract test + `npm run check` clean · owner qa → web · files: `tests/package.test.ts`, `package.json` · depends-on: W4-T3 · acceptance: STYLE-1, STYLE-8, DEMO-1 (library part).

## Wave 5 — Demo page (static verification)

- [ ] **W5-T1** Demo CSS (`src/app.css`): Google Fonts, Tailwind import, `@theme` palette + fonts, utilities, keyframes · owner web · files: `src/app.css` · depends-on: W4-T2 · acceptance: DEMO-4.
- [ ] **W5-T2** Route skeleton: `(site)` layout with `<Toaster>` bound to playground state, delete `src/routes/+page.svelte`, `+layout.svelte` root favicon kept · owner web · files: `src/routes/(site)/+layout.svelte`, `src/routes/(site)/+page.svelte`, `src/lib-demo/` or `src/routes/(site)/components/` (demo-only components, never under `src/lib`) · depends-on: W5-T1 · acceptance: DEMO-2, DEMO-7.
- [ ] **W5-T3** Playground controls + code snippets + install section · owner web · files: `src/routes/(site)/components/*.svelte`, `src/routes/(site)/playground.svelte.ts` · depends-on: W5-T2 · acceptance: DEMO-3, DEMO-5, DEMO-6.
- [ ] **W5-T4** Static verification + a11y review · owner qa · files: none (reports) · depends-on: W5-T3 · acceptance: DEMO-1, DEMO-3 (grep), DEMO-8.

## Closing

- [ ] **W5-T5** Verify report (`sdd-verify`) and archive · owner lead-worker · depends-on: all · acceptance: all scenario ids mapped to passing tests or static checks (user decisions recorded in handoff §H).
