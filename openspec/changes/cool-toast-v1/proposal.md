# Proposal — cool-toast-v1

Change: `cool-toast-v1` · Status: proposed · Artifact store: openspec (this directory)

## Intent

Build **Cool-Toast**, a Svelte 5 toast notification library that reproduces the "gooey" morphing toast of
`goey-toast` 0.5.0 (React + sonner + framer-motion) with feature parity, then adds a small set of deliberate
improvements ("our touch"). The library is published to npm as a SvelteKit library package and ships with a demo
page used to develop and showcase it.

Why: the team needs this toast for its own Svelte projects. No Svelte equivalent exists; the React package cannot
be consumed from Svelte.

## Scope

### In scope

1. **Library** (`src/lib`, published):
   - `<Toaster />` component with reactive props (position, theme, gap, offset, duration, visibleToasts,
     maxQueue, queueOverflow, closeButton, closeOnEscape, swipeToDismiss, preset, spring, bounce, showProgress,
     showTimestamp, dir, labels).
   - `toast()` API: `toast`, `toast.success/.error/.warning/.info`, `toast.promise`, `toast.update`,
     `toast.dismiss`, plus `animationPresets` and the full type surface.
   - Own store (`$state` runes, lazily created, SSR-safe) owning the queue, ids, timers, hover pause and
     callbacks.
   - Own stack layout (flex column + gap per position). No sonner height-sync hacks.
   - Gooey morph: pure path functions (`morphPath`, `morphPathCenter`) driven per frame by `motion`'s `animate`,
     writing straight to the DOM.
   - Animations with goey's exact constants: morph, pill resize, landing squishes, header squish, icon swap,
     error shake, fades, progress bar, swipe. All honour `prefers-reduced-motion`.
   - Accessibility: aria-live announcer (polite/assertive), per-toast roles, labelled close button, Escape,
     reduced motion.
   - Styling via one CSS file with `--cool-toast-*` custom properties; goey's values as defaults.
   - LICENSE (MIT) + NOTICE crediting goey-toast; README with API, CSS variables and attribution.
2. **Demo page** (`src/routes`, not published): playground built with the `svelte-creator` skill adapted for a
   library (no backend), covering every option, code snippets and install instructions.
3. **Test suite** (`tests/`, Strict TDD): vitest + Testing Library + jsdom, fake timers.

### Out of scope

- Any backend, API proxy, database, auth or background job (TODO.txt constraint).
- `toast.custom`, `toast.loading` methods (not in goey either; `loading` is a phase inside `promise`).
- `richColors` prop (no visible effect in goey).
- Multiple simultaneous `<Toaster />` instances (one per app; a dev warning is acceptable).
- Focus management beyond Escape (goey has none; can be a later change).
- A CLI, agent skill or shadcn registry entry (goey extras).
- Deploying the demo (dev-only, decision #3).
- Running `npm run build` / `svelte-package` inside this workflow (lead-worker rule).

## Approach

1. **Stack**: SvelteKit scaffolded with `npx sv create` (as `svelte-creator` prescribes), Svelte 5 runes,
   TypeScript, packaged with `@sveltejs/package`. `svelte` ^5 is a peer dependency. The only runtime dependency
   is `motion`.
2. **Reimplement, do not transpile**: the port is written from the technical study
   (`goey-toast-study.md`), not by copying goey's source. Constants, path algorithm and CSS values are reproduced
   because they define the look; the code structure is Svelte-native.
3. **Reactivity boundary**: everything that changes per frame (`t`, interpolated dims, transforms) lives in plain
   variables and is written with `setAttribute` / `style.*`. Everything that changes per event (toast list,
   phase, hover, expanded) lives in `$state`.
4. **Strict TDD in waves** (see `tasks.md` and `handoff.md`): worker-qa writes RED tests for a wave, worker-web
   turns them GREEN file by file, worker-qa verifies and approves. Wave 0 (scaffold) and Wave 5 (demo) have no
   unit tests; Wave 5 is verified statically.
5. **Parity first, then our touch**: every goey behaviour is kept unless it is a documented bug or an artefact
   of fighting sonner; the deviations are listed in `design.md` §4 and `handoff.md` §D.

## Risks

| # | Risk | Mitigation |
|---|---|---|
| R1 | `sv create` may produce SvelteKit 3 (no `svelte.config.js`, `#lib` alias instead of `$lib`). `@sveltejs/package` must still find `src/lib`. | Wave 0 verifies `svelte-package --help` and the config shape; library code uses **relative imports only** (never `$lib`/`#lib`), so packaging is alias-independent. File ownership adapts (see handoff §C). |
| R2 | `motion`'s `animate(from, to, opts)` semantics (`onUpdate`, `stop()`, `duration`+`bounce` spring) differ from framer-motion's. | Wave 3 starts with a 10-line spike inside the morph driver; constants stay the same, only the adapter changes. Documented in design §3.4. |
| R3 | jsdom has no layout: `offsetWidth/Height`, `ResizeObserver`, `matchMedia`, `PointerEvent` are missing or zero. | `tests/setup.ts` stubs them; morph tests assert path strings from the pure functions and `d`/`data-state` attributes, not pixels. |
| R4 | Svelte 5 `.svelte.ts` modules under vitest need the Svelte Vite plugin and browser resolve conditions. | Vitest config: `plugins: [sveltekit()]`, `resolve.conditions: ['browser']`, `environment: 'jsdom'`. Proven by the Wave 0 smoke test. |
| R5 | Timer-heavy behaviour (330/900/800/1200 ms chains) is fragile under fake timers if timers are created in effects. | Store owns timers through one `timers` module (`setTimeout` injected), tests use `vi.useFakeTimers()` and `vi.advanceTimersByTime`. |
| R6 | Mirroring with `scaleX(-1)` breaks text, icons or RTL. | Spec scenarios on `data-side` and `dir`; manual check in the demo at Wave 5. |
| R7 | Scope creep from "our touch". | Deviations frozen in handoff §D; anything else is a new change. |

## Decisions (approved by the user, 2026-10-28)

1. **npm package name**: `@elericuz/cool-toast` (styles: `import '@elericuz/cool-toast/styles.css'`). LICENSE
   copyright holder: "Eric Valera Miller".
2. **`description` / `icon`**: only `string | Snippet` (icon: `Snippet`). No HTML strings, no `{@html}`.
3. **Demo**: dev-only (`npm run dev`); the adapter generated by the template is kept.
4. **Default `theme`**: `'system'` (follows `prefers-color-scheme`).
