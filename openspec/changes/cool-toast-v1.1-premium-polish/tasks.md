# Tasks — cool-toast-v1.1-premium-polish

Strict TDD. Per task: worker-qa writes RED and pastes the failure reason → worker-web writes the minimum GREEN →
worker-qa re-runs, reviews and approves to lead-worker. Within a wave worker-qa writes ALL RED tests first, then
worker-web goes GREEN file by file. Legend: `qa` = worker-qa, `web` = worker-web. "Acceptance" lists spec ids.

## Wave 1 — Geometry, constants and stylesheet (no component logic)

- [ ] **W1-T1** Update geometry literals · owner qa (RED) → web (GREEN) · files: `tests/constants.test.ts`
  (CONST-1: `PILL_HEIGHT` 44, `PILL_RADIUS` 22, `PILL_PADDING_X` 36), `tests/morph-path.test.ts` (MORPH-1..8 with
  the new numbers), `tests/setup.ts` (stub sizes header 100×20, compact 150×44, expanded 320×112; `defaultSize`
  ignores `[data-leaving]` descendants), stub-coupled literals in `tests/components/Toast.effects.test.ts`,
  `tests/components/Toast.expanded-lifecycle.test.ts` (`PW 136, BW 320, TH 112`),
  `tests/components/Toast.reduced-motion.test.ts`, `tests/morph-driver.test.ts` / GREEN: `src/lib/constants.ts`
  only (`PILL_HEIGHT = 44`, `PILL_PADDING_X = 36`; `morph-path.ts` untouched) · depends-on: — · acceptance:
  CONST-1, MORPH-1..8; the full suite stays green after GREEN.
- [ ] **W1-T2** Premium density stylesheet · owner qa → web · files: `tests/styles.test.ts` (STYLE-9, STYLE-10,
  STYLE-11; update the v1 `--cool-toast-shadow` light/dark values and the `300px/380px` assertion to `320px/400px`) /
  GREEN: `src/lib/styles.css` (new variables light + dark shadow, padding via `var()`, typography, header gap 10px,
  action button, progress inset `margin: 14px 0 0; border-radius: 2px`, body radius var, clipping rules by
  `data-state`, close button side rules with `left/right: auto` reset and right-side counter-mirror,
  `.cool-toast-body[data-leaving="true"] { pointer-events: none }`) · depends-on: W1-T1 (STYLE-9 imports
  `PILL_HEIGHT`) · acceptance: STYLE-9, STYLE-10, STYLE-11; STYLE-2..6 still green.

W1-T1 and W1-T2 RED can be written in parallel; GREEN is sequential (`constants.ts` first).

## Wave 2 — Containment in the components

- [ ] **W2-T1** Pill width includes the timestamp · owner qa → web · files:
  `tests/components/Toast.containment.test.ts` (new; RENDER-18) / GREEN: `src/lib/Toast.svelte` (header timestamp
  rendered whenever the body is not shown — pill and collapsing; `measure()` as D11; wrapper inline `width` set to
  `pillW` after `measure()`/`snap(0)` and to the interpolated width from the driver `onUpdate`; expanded → `bw`) ·
  depends-on: W1-T2 · acceptance: RENDER-18; RENDER-3, RENDER-5, ANIM-7 (pill resize) still green.
- [ ] **W2-T2** Collapse containment and leaving-node measurement · owner qa → web · files:
  `tests/components/Toast.containment.test.ts` (RENDER-19) / GREEN: `src/lib/Toast.svelte` (`collapse()` order per
  D11: `bodyShown = false` → `tick()` → `measure()` → `driver.collapse`; `.cool-toast-body` gets
  `data-leaving="true"` while exiting — set before the `out:` transition starts and kept until the node is removed;
  `measure()` hides `[data-leaving]` nodes while reading; the driver `onUpdate` writes `wrapper.style.width`),
  `src/lib/morph-driver.ts` only if `onUpdate` needs the interpolated width exposed (no `$state`) · depends-on:
  W2-T1 · acceptance: RENDER-19; ANIM-1, ANIM-3 (hover re-expand from collapsing), ANIM-10, RENDER-15 still green.
- [ ] **W2-T3** Close button anchored to the wrapper · owner qa → web · files:
  `tests/components/Toast.containment.test.ts` (RENDER-20) and the v1 close-button tests that select by parent /
  GREEN: `src/lib/Toast.svelte` (move the `{#if resolved.closeButton && !isLoading}` block inside
  `.cool-toast-wrapper`, after the content), `src/lib/styles.css` only if W1-T2 missed a rule · depends-on: W1-T2
  (parallel with W2-T1; same file `Toast.svelte` → GREEN sequential after W2-T2) · acceptance: RENDER-20; RENDER-9
  still green.

## Wave 3 — Docs and visual review

- [ ] **W3-T1** README theming table · owner web · files: `README.md` (five new variables with defaults, the new
  shadow values, the "pill height = 20 + vertical padding" note, `min-width 320 / max-width 400`) · depends-on:
  W2-T3 · acceptance: worker-qa review against handoff §B.6-delta (every new variable listed with its default).
- [ ] **W3-T2** Static review + manual visual checklist · owner qa · files: none (report to lead-worker) ·
  depends-on: W3-T1 · acceptance: `npm run check`, `npm run lint`, `npm run format:check` clean; `grep` for `$state`
  in `morph-driver.ts`/`swipe.ts` unchanged; the checklist in `handoff.md` §I is delivered to the user to run in
  the demo (`npm run dev`).
