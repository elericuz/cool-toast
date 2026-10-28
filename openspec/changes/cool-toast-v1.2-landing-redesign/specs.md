# Specs — cool-toast-v1.2-landing-redesign

Demo-only requirements (DEMO-*). Verified by worker-qa statically (grep + read) and in the browser by the user.

## Theme

- DEMO-1: The page declares no dark-mode rule: no `prefers-color-scheme`, no `dark:` variants, no `[data-theme="dark"]`
  in `src/app.css` or `src/routes/**`. `<Toaster theme="light">` is mounted once in `src/routes/(site)/+layout.svelte`.
- DEMO-2: Body background is `oklch(1 0 0)`. No colour token with hue 40–100 and chroma < 0.06 (cream band).
- DEMO-3: Exactly one brand hue (255 ± 10, chroma ≤ 0.08: navy) in `@theme` plus neutral greys of the same hue; no
  hue in 260–320 (indigo/purple) anywhere; toast type colours remain the library's.

## Typography

- DEMO-4: Fonts registered in `@theme`: `--font-display`/`--font-sans` = Geologica, `--font-mono` = Geist Mono. No
  Inter, Roboto, Arial, system-ui, Space Grotesk, Bricolage, DM Sans, Outfit, Plus Jakarta, Instrument, Fraunces, serif.
- DEMO-5: h1 uses `clamp()` with max ≤ 4.5rem, letter-spacing ≥ −0.04em, `text-wrap: balance`; body ≤ 65ch.

## Structure

- DEMO-6: Sections in order: nav, hero (split), playground (one tinted panel), blob strip, install + API, footer. At
  least 4 distinct layout families; no two consecutive image+text splits.
- DEMO-7: At most one uppercase tracked label on the page; no numbered section markers; no decorative dots; no scroll
  cue; no version string; no em-dash or en-dash in any visible string.
- DEMO-8: Hero: h1 ≤ 8 words, one sentence ≤ 20 words, two CTAs ("Fire a toast", "Copy install"); nothing else.
- DEMO-9: Every "Fire a toast" control calls the real `toast` API; no div-based toast mock anywhere.
- DEMO-10: Blob strip renders `<path d={morphPath(136, 320, 112, t)}>` for t ∈ {0, 0.35, 0.7, 1} imported from
  `src/lib/morph-path.ts` (relative import allowed only in the demo).
- DEMO-11: Playground keeps every current control except theme; the snippet shows `theme="light"` and has a copy
  button that fires a toast as feedback.

## Styling rules (svelte-creator)

- DEMO-12: No `<style>` blocks, no `style=` attributes, no arbitrary Tailwind values (`[...]`); utilities via
  `@apply` in `@layer utilities` in `src/app.css`.
- DEMO-13: Radius lock: interactive pills 9999px, panels/code 16px, inputs 8px; nothing larger than 16px on surfaces.
- DEMO-14: No element combines a 1px border with a shadow blur ≥ 16px; no `background-clip: text`; no backdrop blur.

## Motion and a11y

- DEMO-15: Hero reveal (stagger ≤ 60 ms, ease-out-expo, ≤ 500 ms) and one automatic welcome toast ~700 ms after mount;
  under `prefers-reduced-motion: reduce` the stagger is disabled and content is visible without animation.
- DEMO-16: Scroll reveals use `IntersectionObserver`; content is visible by default; no `scroll` listener.
- DEMO-17: Body text contrast ≥ 4.5:1 on white and on the tinted panel; focus-visible ring on every control; all
  controls keyboard-operable; icons from `phosphor-svelte` only.
- DEMO-18: `npm run check`, `npm run lint`, `npm run format:check` clean; `npm test` 488/488 unchanged.

## Round 2: scoped toasters (library, Strict TDD)

- TOASTER-1: `ToasterProps.id?: string` (default `'default'`). Each mounted `<Toaster>` renders only the toasts whose
  `toasterId` equals its `id`; toasts without `toasterId` go to `'default'`.
- TOASTER-2: `ToastOptions.toasterId?: string`. `toast()`, `toast.success/error/warning/info`, `toast.promise` honour it.
  `toast.update(id, …)` and `toast.dismiss(id)` locate the toast in whichever toaster holds it; `toast.dismiss()` with no
  argument or with a filter applies to every toaster.
- TOASTER-3: Queue limits (`visibleToasts`, `maxQueue`, `queueOverflow`) and config are per toaster id.
- TOASTER-4: `ToasterProps.inline?: boolean` (default `false`). When true the root `[data-cool-toaster]` gets
  `data-inline="true"` and the stylesheet positions it `absolute` with `inset: 0` inside its nearest positioned
  ancestor instead of `fixed`; `position` and `offset` keep working inside that box.
- TOASTER-5: The announcer (`Announcer.svelte`) keeps announcing toasts of every toaster.
- TOASTER-6: `index.ts` exports unchanged (`Toaster`, `toast`, `animationPresets`, types); `ToasterProps` and
  `ToastOptions` gain the fields above; README documents them.

## Round 2: demo

- DEMO-19: Hero stage mounts `<Toaster id="hero" inline position="bottom-center" theme="light" visibleToasts={1}>` and
  an autoplay loop fires one toast per type (default, success, error, warning, info) every ~3.6 s with a description and
  an action so the pill→body morph shows; the loop pauses while the stage is hovered/focused or out of view and does
  not start under `prefers-reduced-motion: reduce` (types are then fired only by click).
- DEMO-20: The stage lists the five types as aligned rows (icon in the library's semantic colour, type name, sample
  title) in one column of equal width; the row matching the toast on screen is highlighted; clicking a row fires it
  immediately and restarts the loop from that type.
- DEMO-21: An "API" section documents, from the real `types.ts` and `README.md`: `<Toaster>` props (name, type,
  default, one line), `toast` methods with signatures, `ToastOptions`, `toast.promise` data shape, `animationPresets`
  names, and the CSS variable groups, grouped under tabs or headings; no row-by-row hairlines.
- DEMO-22: Footer shows "Made with ♥ by elericuz" (phosphor `Heart` icon, link https://github.com/elericuz) next to the
  attribution and links.
- DEMO-23: `README.md` follows the readme-creator structure (Features, Tech Stack table, Prerequisites, Getting
  Started, Project Structure, Usage/API, Testing, License) in English, no placeholder text, commands matching
  `package.json`, keeping the existing API/theming content. It includes a short "AI assistance" note stating that the
  library and its demo were developed with AI assistance (Claude Code) under the author's direction and review.
- DEMO-24: Every clickable control in the demo (buttons, tabs, segmented pills, switches, copy buttons) renders with
  `cursor: pointer` (Tailwind `cursor-pointer` in the shared utilities).
- DEMO-25: Every API tab (Toaster, toast, Options, Theming) opens with at least one real, copyable code example
  (`CodeBlock`) that uses the entries documented in that tab, and each group inside a tab has a one-line example
  where the usage is not obvious (scoped toasters, promise, update/dismiss, custom colours via CSS variables).
