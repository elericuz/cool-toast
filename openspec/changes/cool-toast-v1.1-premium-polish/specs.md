# Specs — cool-toast-v1.1-premium-polish

Delta specs over `openspec/changes/cool-toast-v1/specs.md`. Sections not listed here are unchanged. Scenario ids
keep the v1 numbering; new ids continue each sequence. worker-qa turns every scenario into a test; every scenario
is designed to run in jsdom with the `tests/setup.ts` stubs listed in `handoff.md` §E.

Stub sizes assumed by every number below (handoff §E): header `100×20`, compact content `150×44`, expanded content
`320×112`. Derived: `pw = 100 + PILL_PADDING_X (36) = 136`, `bw = 320`, `th = 112`.

---

## 4. Gooey morph path (`MORPH`) — REPLACED

Pure functions in `src/lib/morph-path.ts`. `pw` pill width, `bw` body width, `th` total height. `PH = PILL_HEIGHT = 44`,
`PR = PILL_RADIUS = 22`. The algorithm is the one of v1 design D4; only the constants change.

**MORPH-1 Pill at t = 0**
`morphPath(136, 320, 112, 0)` equals
`M 0,22 A 22,22 0 0 1 22,0 H 114 A 22,22 0 0 1 136,22 A 22,22 0 0 1 114,44 H 22 A 22,22 0 0 1 0,22 Z`
(whitespace-normalised). `morphPath(200, 320, 112, 0)` equals the same with `H 178`, `200,22`, `178,44`.

**MORPH-2 Pill threshold**
For any `t` where `(PH + (th − PH)·t) − PH < 8`, the output is the pill of MORPH-1. With `th = 112`:
`t = 0.1` → bodyH 50.8 (6.8 < 8) → pill; `t = 0.11` → 7.48 → pill; `t = 0.12` → 8.16 → not the pill, and the largest
y of the path is `52.16`.

**MORPH-3 Full body at t = 1**
`morphPath(136, 320, 112, 1)` contains, in order: `M 0,22`, `A 22,22 0 0 1 22,0`, `H 114`, `A 22,22 0 0 1 136,22`,
`L 136,30` (bodyTop = 44 − 14), `Q 136,44 150,44` (curve 14, qEndX = min(150, 304)), `H 304` (bodyW 320 − cr 16;
cr = min(16, 68·.45 = 30.6) = 16), `A 16,16 0 0 1 320,60`, `L 320,96`, `A 16,16 0 0 1 304,112`, `H 16`,
`A 16,16 0 0 1 0,96`, `Z`.
Second case `morphPath(100, 250, 92, 1)`: th 92 → cr = min(16, 48·.45 = 21.6) = 16; fragments `L 100,30`,
`Q 100,44 114,44`, `H 234`, `A 16,16 0 0 1 250,60`, `L 250,76`.

**MORPH-4 Intermediate interpolation**
`morphPath(136, 320, 112, 0.5)`: bodyH 78, curve 7, cr = min(16, 34·.45) = 15.3, bodyW 228, bodyTop 37,
qEndX = min(143, 212.7) = 143. Ordered fragments: `L 136,37`, `Q 136,44 143,44`, `H 212.7`,
`A 15.3,15.3 0 0 1 228,59.3`, `L 228,62.7`, `A 15.3,15.3 0 0 1 212.7,78`, `H 15.3`, `A 15.3,15.3 0 0 1 0,62.7`
(numbers rounded to 3 decimals).

**MORPH-5 pillW clamp**
`morphPath(400, 320, 112, 0)` uses `pillW = 320` (min(pw, bw)): `H 298`, `320,22`, `298,44`.

**MORPH-6 Centre variant**
`morphPathCenter(136, 320, 112, 0)` is a pill centred at `pillOffset = 92`: starts `M 92,22`, ends `Z`, pill spans
92..228 (no x greater than 228). At `t = 1`: body spans 0..320 with two fillets, `qLeftX = max(16, 92 − 14) = 78`,
`qRightX = min(304, 228 + 14) = 242`; `78`, `242`, `0`, `320` all appear and max y is `112`.
`morphPathCenter(100, 320, 112, 0)` starts `M 110,22`.

**MORPH-7 Monotonic height**
For `t` in `{0, .25, .5, .75, 1}` with `(136, 320, 112)`, the largest y value is `44, 61, 78, 95, 112`.

**MORPH-8 Memoisation**
Unchanged: identical args return the same string instance; alternating args `(136, 320, 112, .5)` /
`(150, 340, 120, .8)` stay correct.

---

## 3. Toaster rendering & accessibility (`RENDER`) — ADDED SCENARIOS

Unchanged v1 scenarios that these amend: RENDER-3 (compact DOM order), RENDER-5 (timestamp placement), RENDER-9
(close button attributes/behaviour), RENDER-15 (progress bar).

**RENDER-18 Compact pill width includes the timestamp**
Given `toast('Saved')` with default `showTimestamp` (true) and the setup stubs
Then, in `data-state="pill"`:
- `[data-cool-toast-timestamp][data-slot="header"]` is a descendant of `[data-cool-toast-header]`;
- the blob path `d` equals `morphPath(136, 150, 44, 0)` normalised (`pw = header.offsetWidth 100 + 36`; `bw` is the
  compact content width 150, so `pillW = 136`);
- the wrapper `.cool-toast-wrapper` has inline `width: 136px` (the pill width, equal to the path's pill width);
- given `showTimestamp: false` the header stub reads `data-test-w="80"` set by the test → path is
  `morphPath(116, 150, 44, 0)` and the wrapper width is `116px`.
Given `data-test-w="140"` on the header (long title) → `pw = 176`, `bw = max(content 150, pw 176) = 176`, so the
path is `morphPath(176, 176, 44, 0)` (pill width 176, never clamped below the header) and the wrapper is `176px`.

**RENDER-19 Collapse keeps content inside the shrinking blob**
Given an expanded toast (`toast('Saved', { description: 'Your file is safe' })`, 330 ms + morph complete) and the
`motion` mock in progress mode
When the display timer fires and `data-state` becomes `"collapsing"`
Then:
- `[data-cool-toast-timestamp][data-slot="header"]` exists inside `[data-cool-toast-header]` from the first
  collapsing frame, and `.cool-toast-body` carries `data-leaving="true"` while its exit transition runs;
- `[data-cool-toast-content]` has computed/declared `overflow: hidden` and a `clip-path` (asserted via the
  stylesheet rule `[data-cool-toast][data-state="collapsing"] [data-cool-toast-content]` in `styles.css` and via
  the `data-state` attribute on the `<li>`);
- for `progressAll(t)` with `t` in `{1, .75, .5, .25, 0}` the wrapper inline width is non-increasing frame to frame
  and equals the body width of the path at that `t` (`pillW + (bw − pillW)·t` with `pillW = 136`, `bw = 320`:
  `320, 274, 228, 182, 136`);
- when the collapse completes (`data-state="pill"`) the path is the pill `morphPath(136, 320, 112, 0)` (same string
  as `morphPath(136, 150, 44, 0)`: a pill depends only on `pillW`), and the wrapper width is `136px` — the width the
  header-with-timestamp needs; once the body exit finishes and the content is re-measured, `dims` are back to the
  compact `150×44` and the path string does not change.
Measurement rule: when `measure()` runs while a `[data-leaving]` element is still in the DOM, `pw`/`bw`/`th` ignore
it (the test gives the leaving body `data-test-h="200"` and expects `th` unaffected: the path after collapse is the
compact pill).

**RENDER-20 Close button anchored to the blob**
Given Toaster `closeButton: 'top-right'`
Then `button[data-cool-toast-close][data-side="top-right"]` is a direct child of `.cool-toast-wrapper` (not of the
`<li>`), and `styles.css` declares:
- `[data-cool-toast-close] { position: absolute; top: -6px; width: 20px; height: 20px; border-radius: 50% }`;
- `[data-cool-toast-close][data-side="top-right"] { right: -6px; left: auto }`;
- `[data-cool-toast-close][data-side="top-left"] { left: -6px; right: auto }`;
- `[data-cool-toast][data-side="right"] [data-cool-toast-close] { transform: scaleX(-1) }` (counter-mirror, D10).
Given `closeButton: true` → `data-side="top-left"` and the same parent. In `data-state="pill"` the wrapper inline
width is the pill width (RENDER-18), so the button's offset parent is 136 px wide: the test asserts
`button.offsetParent === wrapper` (jsdom returns the nearest positioned ancestor) and the wrapper's inline width.
RENDER-9 behaviour (label, click → manual dismiss, hidden during `loading`) is unchanged.

---

## 9. Styling & theming (`STYLE`) — ADDED SCENARIOS

Tests parse `src/lib/styles.css` as text with the existing parser in `tests/styles.test.ts` (`declarationsFor`,
`norm`).

**STYLE-9 Premium density values and new variables**
`[data-cool-toaster]` declares (light), and `[data-cool-toaster][data-theme="dark"]` overrides where a dark value is
listed:

| Variable | Light | Dark |
|---|---|---|
| `--cool-toast-pill-padding` | `12px 18px` | — |
| `--cool-toast-body-padding` | `12px 18px 18px` | — |
| `--cool-toast-title-size` | `13px` | — |
| `--cool-toast-description-size` | `14px` | — |
| `--cool-toast-radius-body` | `16px` | — |
| `--cool-toast-shadow` | `drop-shadow(0 10px 24px rgba(0,0,0,.10)) drop-shadow(0 2px 6px rgba(0,0,0,.06))` | `drop-shadow(0 10px 24px rgba(0,0,0,.45)) drop-shadow(0 2px 6px rgba(0,0,0,.3))` |

And these rules:
- `[data-cool-toast-content] { padding: var(--cool-toast-pill-padding) }`;
- `[data-cool-toast][data-expanded="true"] [data-cool-toast-content] { min-width: 320px; max-width: 400px; padding: var(--cool-toast-body-padding) }`;
- `[data-cool-toast-header] { height: 20px; gap: 10px }` (icon–title gap 8px is allowed via a separate rule on the
  icon; the header `gap` that separates title and timestamp is `10px`);
- `[data-cool-toast-title] { font-size: var(--cool-toast-title-size); font-weight: 600; line-height: 20px; letter-spacing: -0.01em }`;
- `[data-cool-toast-timestamp] { font-size: 12px }`;
- `[data-cool-toast-description] { font-size: var(--cool-toast-description-size); line-height: 1.5 }` and
  `.cool-toast-body { padding-top: 10px }` (description margin-top 10 from the header);
- `[data-cool-toast-action] { padding: 12px 20px; font-size: 14px; font-weight: 600; border-radius: 999px }`;
- `[data-cool-toast-icon] { width: 18px; height: 18px }` (unchanged, asserted so the 44 = 20 + 24 budget holds);
- every new variable is read through `var()` somewhere in the file (same "consumed" check as STYLE-2).
`PILL_HEIGHT` (44) equals header height (20) + the vertical padding of `--cool-toast-pill-padding` (12 + 12); the test
imports `PILL_HEIGHT` from `src/lib/constants.ts` and asserts `20 + 12 + 12 === PILL_HEIGHT`.

**STYLE-10 Progress bar inset**
`[data-cool-toast-progress] { margin: 14px 0 0; border-radius: 2px; overflow: hidden }` and
`.cool-toast-progress-bar { height: 3px }`. The progress element is inside `[data-cool-toast-content]` (so the
body padding-bottom of 18 px separates it from the blob edge); the v1 STYLE-4 animation assertions stay.

**STYLE-11 Containment rules**
`styles.css` declares:
- `.cool-toast-wrapper { position: relative; width: fit-content }` (JS sets inline `width` per RENDER-18/19);
- `[data-cool-toast]:not([data-state="expanded"]) [data-cool-toast-content] { overflow: hidden; clip-path: inset(0 round var(--cool-toast-radius-body)) }`;
- `[data-cool-toast][data-state="expanded"] [data-cool-toast-content] { overflow: visible; clip-path: none }`;
- `.cool-toast-body[data-leaving="true"] { pointer-events: none }`.

---

## 7. Constants (`CONST`) — static verification (worker-qa, `tests/constants.test.ts`)

**CONST-1 Geometry**
`PILL_HEIGHT` 44, `PILL_RADIUS` 22, `NECK_CURVE_MAX` 14, `BODY_CORNER_MAX` 16, `PILL_THRESHOLD` 8,
`PILL_PADDING_X` 36. Every v1 timing constant unchanged.
