# Design — cool-toast-v1.2-landing-redesign

## D1 Tokens (`src/app.css`, `@theme`)

- Colours (OKLCH), user decision: white + greys + navy accents. `--color-brand-700: oklch(0.28 0.07 255)` (navy:
  hero stage, primary CTA, selected pills, links), `--color-brand-800: oklch(0.23 0.07 255)` (hover),
  `--color-brand-50: oklch(0.97 0.006 255)` (panel/strip tint), `--color-ink-900: oklch(0.20 0.015 255)` (headings),
  `--color-ink-700: oklch(0.38 0.015 255)` (body), `--color-ink-500: oklch(0.52 0.015 255)` (captions ≥ 14px),
  `--color-line: oklch(0.90 0.008 255)` (dividers). Hue 250–260, chroma ≤ 0.08: no indigo, purple or saturated blue.
- Fonts: Geologica (300–800 variable) display + body; Geist Mono code. Google Fonts `@import` first line.
- Radii: `--radius-pill: 9999px`, `--radius-panel: 16px`, `--radius-input: 8px`.
- Z-index scale: nav 10, toaster (library) above; no 999.

## D2 Composition

1. Nav 64px: wordmark, "Playground", "Install", npm icon link, primary pill "Fire a toast".
2. Hero grid 7/5 on `lg`, stacked below: left copy (h1, sentence, CTAs), right navy stage (`bg-brand-700`,
   radius 16, min-height ~480px) containing five type pills in white that fire that type. The Toaster is
   `position="bottom-right"` so fired toasts land over/near the stage on desktop.
3. Playground: `bg-brand-50` panel, grid 5/7 (controls / live code). Controls reuse `SegmentedControl` and
   `ToggleControl` restyled; `CodeBlock` keeps the copy button.
4. Blob strip: `bg-brand-50` full-width band; four `<svg viewBox="0 0 320 112">` with white paths, captions under
   each (pill, neck, body, settled) and real timings (330 ms delay, 900 ms spring). Mobile: horizontal scroll-snap.
5. Install + API: left three code blocks (install, layout, component); right `toast.*` reference in 3 groups with one
   divider between groups.
6. Footer: goey-toast MIT attribution, LICENSE, npm link.

## D3 Motion

CSS keyframes `rise` (opacity + translateY 12px) with `animation-delay` per hero element, gated by
`@media (prefers-reduced-motion: no-preference)`. `$effect` in the layout fires `toast('Welcome to Cool-Toast')` after
700 ms (cleared on destroy). Sections 4–5 add `is-visible` via IntersectionObserver; base state is visible, the class
only replays the `rise` animation when motion is allowed.

## D4 Reuse

`playground.svelte.ts` keeps its state and snippet generation; `theme` fixed to `'light'`, `themeChoices` removed.
`snippets.ts` keeps the install/API strings. All seven components are rewritten visually; `SegmentedControl`,
`ToggleControl`, `CodeBlock` keep their props.
