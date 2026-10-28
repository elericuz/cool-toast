# Proposal — cool-toast-v1.1-premium-polish

Change: `cool-toast-v1.1-premium-polish` · Status: proposed · Artifact store: openspec (this directory) ·
Parent: `cool-toast-v1` (archived baseline; its `handoff.md` §B remains the public contract except where amended here).

## Intent

Polish the visual result of Cool-Toast after the first demo review. Two kinds of defects were found in the user's
screenshots:

1. **Cramped feel.** The pill and the expanded body reuse goey's tight padding (`7px 10px`); the title, description
   and action button sit too close to the blob edge and to each other. The user wants a "premium" density: more air
   horizontally and vertically, a slightly larger description, a deeper but softer shadow, and a progress bar that is
   inset from the body edge instead of flush against it.
2. **Content escaping the blob.** The SVG path is the only painted surface, yet three elements render outside it:
   - in the compact pill (and while collapsing) the timestamp is drawn to the right of the pill, because the pill
     width `pw` is measured from the header without the timestamp (or before the header timestamp exists);
   - the close button is positioned against the `<li>` box, which is as wide as the expanded body, so in the pill
     state it floats far away from the blob's corner;
   - during collapse the body text stays visible while the path already shrank, so text is painted on nothing.

Why now: the library is otherwise complete (433/433 tests). These defects are visible in every demo interaction and
would be the first thing a user of the package sees.

## Scope

### In scope

1. **Geometry and density constants** (`src/lib/constants.ts`): pill height 34 → 44, pill radius 17 → 22; a new
   `PILL_PADDING_X` of 36 (18 px per side). `NECK_CURVE_MAX` 14, `BODY_CORNER_MAX` 16 and `PILL_THRESHOLD` 8 stay.
   The path functions keep deriving from `PILL_HEIGHT`; no algorithm change.
2. **Stylesheet** (`src/lib/styles.css`): new padding, typography, radii, shadow and progress inset values; new CSS
   variables `--cool-toast-pill-padding`, `--cool-toast-body-padding`, `--cool-toast-title-size`,
   `--cool-toast-description-size`, `--cool-toast-radius-body`; close button inset rules; clipping rules for the
   non-expanded states.
3. **Containment rule** (`src/lib/Toast.svelte`, `src/lib/Toaster.svelte`): everything the toast renders lies inside
   the current path at every frame. Concretely: `pw` includes the compact timestamp and padding; the wrapper width
   tracks the path width in every state; content is clipped in every non-expanded state; the close button is a child
   of the wrapper and sits on the blob's corner; collapse shows the header timestamp before the collapse target is
   measured; measurement ignores elements that are leaving (`data-leaving`).
4. **Specs and tests**: MORPH-1..8 literals updated to PH 44; new STYLE-9, STYLE-10, RENDER-18, RENDER-19,
   RENDER-20; `tests/setup.ts` stub sizes updated (compact 150×44, expanded 320×112, header 100).
5. **README**: CSS variable table gains the five new variables; the padding/typography defaults are documented.

### Out of scope

- Any change to the public JS/TS API (`index.ts`, types, props, option resolution). `handoff.md` v1 §B.1–B.5 are
  untouched.
- New animations or timing changes. All v1 §B.7 timing constants stay.
- Demo page changes (`src/routes/**`, `src/app.css`): the demo consumes the library CSS; nothing to edit.
- The spinner, icon set and icon size (18 px) stay.
- Colour palette changes other than the shadow values.

## Approach (summary; see `design.md`)

- One source of truth for geometry: `constants.ts`. CSS repeats the same numbers as defaults of the new variables;
  STYLE-9 asserts both agree (`PILL_HEIGHT` 44 = header line-height 20 + vertical padding 24).
- Containment is implemented as a rule, not as per-element patches: the wrapper is the only element whose inline
  size is set from JS, and it is set from the same `dims`/driver values that draw the path. Everything else is CSS
  (`overflow: hidden`, `clip-path`, close button anchored to the wrapper).
- Strict TDD in three waves: W1 constants/paths/CSS, W2 component containment, W3 docs and visual review.

## Risks

| Risk | Mitigation |
|---|---|
| R1 Changing `PILL_HEIGHT` shifts every literal in MORPH tests and the driver/lifecycle tests that reuse `120/300/90`. | worker-qa updates all literals in one RED pass (W1-T1 lists every file); the morph-path algorithm does not change, so GREEN is `constants.ts` only. |
| R2 Measuring `pw` with the timestamp while `bodyShown` toggles can read a header that still contains an exiting node. | Collapse shows the header timestamp first and measures the target after the body is marked `data-leaving`; `measure()` ignores `[data-leaving]` subtrees (RENDER-19). |
| R3 Clipping the content during morphing could clip the body fade-in. | Clip width follows the interpolated path width (driver `onUpdate` writes the wrapper width per frame); the body fades inside a region that grows with the blob. |
| R4 Close button moving into the wrapper changes its coordinate space on the mirrored right side (`scaleX(-1)`). | The button is a wrapper child but receives the counter-mirror transform like the content (D10 amendment); RENDER-20 asserts the side rules in CSS, and the W3 manual checklist covers right-side placement. |
| R5 Wider pill (`18px` sides + timestamp) overflows narrow viewports. | `max-width: calc(100vw − 2·offset)` on the `<li>` stays; `pw` is clamped to `bw` (MORPH-5). |

## Success criteria

1. All MORPH, STYLE and RENDER scenarios in `specs.md` green; the rest of the v1 suite stays green after the literal
   updates (no behavioural regressions).
2. In the demo, for all six positions and both themes: no text or button pixel outside the blob in pill, morphing,
   expanded and collapsing states (W3 manual checklist).
3. `npm run check`, `npm run lint`, `npm run format:check` clean.
