# @elericuz/cool-toast

Gooey, morphing toast notifications for Svelte 5, ported from [goey-toast](https://github.com/anl331/goey-toast). A
compact pill morphs into a full body when it has a description or an action, driven by spring physics, with swipe to
dismiss, a promise lifecycle and accessible live regions.

## Features

- Compact pill toasts that morph into an expanded body when they carry a description or an action.
- Spring or tween animation with four presets (`smooth`, `subtle`, `snappy`, `bouncy`) and per-toast overrides.
- Five types (`default`, `success`, `error`, `warning`, `info`) plus a `loading` phase for promises.
- `toast.promise` that shows a spinner and settles into success or error in place.
- `toast.update` to change a visible or queued toast in place, and `toast.dismiss` by id, by type or for all.
- Queue with `visibleToasts`, `maxQueue` and `queueOverflow`.
- Scoped toasters: several `<Toaster id="...">` on one page, toasts routed with `toasterId`, and `inline` toasters
  that live inside a positioned container.
- Swipe to dismiss, `Escape` to dismiss, hover to pause, optional close button and progress bar.
- Polite and assertive live regions, configurable labels and full `prefers-reduced-motion` support.
- Light, dark and system themes; every colour, padding, radius and shadow is a CSS custom property. No CSS framework
  required.

## Tech Stack

| Area              | Technology                                                                |
| ----------------- | ------------------------------------------------------------------------- |
| Framework         | Svelte 5 (runes), `svelte` `^5.0.0` as a peer dependency                  |
| Packaging         | SvelteKit in library mode with `@sveltejs/package`                        |
| Language          | TypeScript                                                                |
| Animation         | [`motion`](https://motion.dev), the only runtime dependency               |
| Testing           | Vitest, Testing Library (`@testing-library/svelte`, `jest-dom`) and jsdom |
| Linting and style | ESLint, Prettier, `svelte-check`                                          |
| Demo site only    | Tailwind CSS 4 and `phosphor-svelte` (not part of the published package)  |

## Prerequisites

- To use the package: a Svelte 5 project (`svelte` `^5.0.0`).
- To work on this repository: Node.js 22.17 or later (required by SvelteKit 3) and npm.

## Getting Started

### Installation

```sh
npm i @elericuz/cool-toast
```

### Usage in a root layout

Import the stylesheet once and render a `<Toaster />`, usually in your root layout:

```svelte
<script lang="ts">
	import '@elericuz/cool-toast/styles.css';
	import { Toaster } from '@elericuz/cool-toast';

	let { children } = $props();
</script>

<Toaster position="bottom-right" />
{@render children()}
```

The stylesheet is required: without it toasts render unstyled. It does not depend on any CSS framework.

### Firing toasts

Call `toast` from anywhere:

```ts
import { toast } from '@elericuz/cool-toast';

toast('Saved');
toast.success('Profile updated', { description: 'Your changes are live.' });
toast.error('Upload failed', { action: { label: 'Retry', onClick: retry } });
```

## API

### `<Toaster>` props

| Prop             | Type                                   | Default                           | Description                                                                                             |
| ---------------- | -------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `id`             | `string`                               | `'default'`                       | Names this Toaster. It renders only the toasts sent with the same `toasterId`.                          |
| `inline`         | `boolean`                              | `false`                           | Fills its nearest positioned ancestor instead of the viewport; `position` and `offset` apply inside it. |
| `position`       | `Position`                             | `'bottom-right'`                  | `top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, `bottom-right`.                  |
| `theme`          | `'light' \| 'dark' \| 'system'`        | `'system'`                        | `system` follows `prefers-color-scheme` and updates live.                                               |
| `gap`            | `number`                               | `14`                              | Space between toasts, in px.                                                                            |
| `offset`         | `string`                               | `'24px'`                          | Distance from the viewport edge (any CSS length).                                                       |
| `duration`       | `number`                               | `4000`                            | Lifetime of compact toasts, in ms. `Infinity` disables auto close.                                      |
| `visibleToasts`  | `number`                               | `3`                               | Maximum toasts on screen; the rest wait in a FIFO queue.                                                |
| `maxQueue`       | `number`                               | `Infinity`                        | Maximum queued toasts.                                                                                  |
| `queueOverflow`  | `'drop-oldest' \| 'drop-newest'`       | `'drop-oldest'`                   | What to drop when the queue is full.                                                                    |
| `closeButton`    | `boolean \| 'top-left' \| 'top-right'` | `false`                           | Shows a close button; `true` means `'top-left'`. Hidden while a promise is loading.                     |
| `closeOnEscape`  | `boolean`                              | `true`                            | `Escape` dismisses the newest toast.                                                                    |
| `swipeToDismiss` | `boolean`                              | `true`                            | Horizontal swipe (mouse or touch) of 100 px dismisses.                                                  |
| `preset`         | `AnimationPresetName`                  | none                              | `smooth`, `subtle`, `snappy` or `bouncy` (see `animationPresets`).                                      |
| `spring`         | `boolean`                              | `true`                            | `false` uses eased tweens instead of springs.                                                           |
| `bounce`         | `number`                               | `0.4`                             | Spring bounce.                                                                                          |
| `showProgress`   | `boolean`                              | `false`                           | Progress bar on expanded toasts.                                                                        |
| `showTimestamp`  | `boolean`                              | `true`                            | Creation time on each toast.                                                                            |
| `dir`            | `'ltr' \| 'rtl'`                       | `'ltr'`                           | Text direction; in RTL left and right positions mirror.                                                 |
| `labels`         | `{ close?: string }`                   | `{ close: 'Close notification' }` | Accessible texts, for translation.                                                                      |

### `toast`

```ts
toast(title: string, options?: ToastOptions): string | number;
toast.success(title: string, options?: ToastOptions): string | number;
toast.error(title: string, options?: ToastOptions): string | number;
toast.warning(title: string, options?: ToastOptions): string | number;
toast.info(title: string, options?: ToastOptions): string | number;
toast.promise<T>(promise: Promise<T>, data: PromiseData<T>): string;
toast.update(id: string | number, options: ToastUpdateOptions): void;
toast.dismiss(idOrFilter?: string | number | { type: ToastType | ToastType[] }): void;
```

- Every function returns the toast id (generated, or the `id` you passed).
- Calling `toast()` with the `id` of an existing toast replaces it in place instead of creating a duplicate.
- `toast.update` changes a visible or queued toast in place (`title`, `description`, `type`, `action`, `icon`,
  `showTimestamp`). `icon: null` removes the icon. Updating to `type: 'error'` plays a shake.
- `toast.update(id)` and `toast.dismiss(id)` find the toast in whichever Toaster holds it.
- `toast.dismiss()` with no argument clears every queue and dismisses every visible toast in every Toaster. A
  filter dismisses by type, also in every Toaster.

### `ToastOptions`

| Option                          | Type                                                            | Description                                                                                                        |
| ------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `description`                   | `string \| Snippet`                                             | Body text or snippet; makes the toast expand.                                                                      |
| `action`                        | `{ label: string; onClick: () => void; successLabel?: string }` | Action button; makes the toast expand. With `successLabel`, a click shows that label, collapses and dismisses.     |
| `icon`                          | `Snippet`                                                       | Replaces the built-in icon.                                                                                        |
| `duration`                      | `number`                                                        | Compact toasts only, in ms. `Infinity` keeps it open.                                                              |
| `id`                            | `string \| number`                                              | Custom id.                                                                                                         |
| `toasterId`                     | `string`                                                        | Id of the Toaster that shows the toast. Default `'default'`.                                                       |
| `classes`                       | `ToastClasses`                                                  | Extra classes for `wrapper`, `content`, `header`, `title`, `icon`, `description`, `actionWrapper`, `actionButton`. |
| `fillColor`                     | `string`                                                        | Background colour of the blob.                                                                                     |
| `borderColor`                   | `string`                                                        | Border colour.                                                                                                     |
| `borderWidth`                   | `number`                                                        | Border width; default `1.5` when `borderColor` is set.                                                             |
| `timing`                        | `{ displayDuration?: number }`                                  | Expanded toasts only: total time on screen, in ms (default `4000`).                                                |
| `preset`, `spring`, `bounce`    |                                                                 | Per-toast animation overrides.                                                                                     |
| `showProgress`, `showTimestamp` | `boolean`                                                       | Per-toast overrides of the Toaster props.                                                                          |
| `onDismiss`                     | `(id) => void`                                                  | Called once whenever the toast is dismissed.                                                                       |
| `onAutoClose`                   | `(id) => void`                                                  | Called only when the toast closes on its own (timer), before `onDismiss`.                                          |

Resolution order for each option: toast option → toast `preset` (bounce/spring only) → Toaster prop → Toaster
`preset` → default. Expanded toasts ignore `duration`; compact toasts ignore `timing.displayDuration`.

### `toast.promise`

```ts
toast.promise(save(), {
	loading: 'Saving…',
	success: (data) => `Saved ${data.name}`,
	error: (err) => `Failed: ${(err as Error).message}`,
	description: { loading: 'Please wait', success: () => 'All good' },
	action: { error: { label: 'Retry', onClick: retry } }
});
```

The toast shows a spinner while pending and never auto closes; it settles into `success` or `error` in place. A
rejection is handled and does not propagate. If the toast is dismissed before the promise settles, the result is
ignored.

`PromiseData` accepts `toasterId` like any toast option, so a promise toast can go to a scoped Toaster.

**Resolver rule:** in `success`, `error`, `description.success` and `description.error`, any function is treated as
a resolver and called with the result. A Svelte `Snippet` is also a function, so pass it wrapped:
`description: { success: () => mySnippet }`. `description.loading` accepts a string or a Snippet directly.

### `animationPresets`

```ts
import { animationPresets } from '@elericuz/cool-toast';
// { smooth: { bounce: 0.1, spring: true }, subtle: { bounce: 0.05, spring: true },
//   snappy: { bounce: 0.4, spring: true }, bouncy: { bounce: 0.6, spring: true } }
```

### Scoped toasters

Every `<Toaster>` has an `id` (`'default'` when omitted) and owns its own queue, limits and live regions. A toast goes
to the Toaster whose `id` matches its `toasterId`; toasts without `toasterId` go to `'default'`.

```svelte
<script lang="ts">
	import { Toaster, toast } from '@elericuz/cool-toast';
</script>

<!-- App-wide toaster -->
<Toaster position="bottom-right" />

<!-- Inline toaster: fills the nearest positioned ancestor -->
<div class="preview">
	<Toaster id="preview" inline position="bottom-center" visibleToasts={1} />
</div>

<button onclick={() => toast('Saved')}>Global</button>
<button onclick={() => toast.success('Rendered', { toasterId: 'preview' })}>Preview</button>

<style>
	.preview {
		position: relative;
		min-height: 320px;
		overflow: hidden;
	}
</style>
```

An inline Toaster is positioned `absolute` with `inset: 0` inside its nearest positioned ancestor and does not capture
pointer events outside its list; `position` and `offset` place the toasts inside that box.

### Types

Exported types: `ToastType`, `ToastPhase`, `ToastOptions`, `ToastUpdateOptions`, `ToastAction`, `ToastClasses`,
`ToastTimings`, `PromiseData`, `DismissFilter`, `AnimationPreset`, `AnimationPresetName`, `ToasterProps`,
`Position`, `Theme`.

## Theming

The `theme` prop selects `'light'`, `'dark'` or `'system'` (default); `system` follows `prefers-color-scheme` and
updates live.

Override any of these CSS custom properties on `[data-cool-toaster]` (dark values apply under
`[data-theme="dark"]`):

| Variable                                                | Light                                                                             | Dark                                                                             |
| ------------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `--cool-toast-font`                                     | system font stack                                                                 | same                                                                             |
| `--cool-toast-fill`                                     | `#ffffff`                                                                         | `#1a1a1a`                                                                        |
| `--cool-toast-border-color`                             | `none`                                                                            | `none`                                                                           |
| `--cool-toast-border-width`                             | `1.5`                                                                             | `1.5`                                                                            |
| `--cool-toast-shadow`                                   | `drop-shadow(0 10px 24px rgba(0,0,0,.10)) drop-shadow(0 2px 6px rgba(0,0,0,.06))` | `drop-shadow(0 10px 24px rgba(0,0,0,.45)) drop-shadow(0 2px 6px rgba(0,0,0,.3))` |
| `--cool-toast-pill-padding`                             | `12px 18px`                                                                       | same                                                                             |
| `--cool-toast-body-padding`                             | `12px 18px 18px`                                                                  | same                                                                             |
| `--cool-toast-title-size`                               | `13px`                                                                            | same                                                                             |
| `--cool-toast-description-size`                         | `14px`                                                                            | same                                                                             |
| `--cool-toast-radius-body`                              | `16px`                                                                            | same                                                                             |
| `--cool-toast-description-color`                        | `#444444`                                                                         | `#e0e0e0`                                                                        |
| `--cool-toast-timestamp-color`                          | `#999999`                                                                         | `#777777`                                                                        |
| `--cool-toast-close-color`                              | `#555555`                                                                         | `#e0e0e0`                                                                        |
| `--cool-toast-progress-track`                           | `rgba(0,0,0,.06)`                                                                 | `rgba(255,255,255,.1)`                                                           |
| `--cool-toast-default-color` / `-progress`              | `#555555` / `#999999`                                                             | `#cccccc` / `#888888`                                                            |
| `--cool-toast-default-action-bg` / `-hover` / `-active` | `#E8E8E8` / `#DCDCDC` / `#D0D0D0`                                                 | `#3a3a3a` / `#444444` / `#4e4e4e`                                                |
| `--cool-toast-success-color`                            | `#4CAF50`                                                                         | `#66BB6A`                                                                        |
| `--cool-toast-success-action-bg` / `-hover` / `-active` | `#C8E6C9` / `#A5D6A7` / `#81C784`                                                 | `#1b5e20` / `#2e7d32` / `#388e3c`                                                |
| `--cool-toast-error-color`                              | `#E53935`                                                                         | `#EF5350`                                                                        |
| `--cool-toast-error-action-bg` / `-hover` / `-active`   | `#FFCDD2` / `#EF9A9A` / `#E57373`                                                 | `#b71c1c` / `#c62828` / `#d32f2f`                                                |
| `--cool-toast-warning-color`                            | `#C49000`                                                                         | `#FFB300`                                                                        |
| `--cool-toast-warning-action-bg` / `-hover` / `-active` | `#FFECB3` / `#FFE082` / `#FFD54F`                                                 | `#4a3800` / `#5c4600` / `#6e5400`                                                |
| `--cool-toast-info-color`                               | `#1E88E5`                                                                         | `#42A5F5`                                                                        |
| `--cool-toast-info-action-bg` / `-hover` / `-active`    | `#BBDEFB` / `#90CAF9` / `#64B5F6`                                                 | `#0d47a1` / `#1565c0` / `#1976d2`                                                |
| `--cool-toast-loading-color`                            | `#555555`                                                                         | `#cccccc`                                                                        |

`--cool-toast-gap` and `--cool-toast-offset` are set from the `gap` and `offset` props. Per-toast colours can also
be set with `fillColor`, `borderColor` and `borderWidth`, and extra classes with `classes`.

`--cool-toast-progress-duration` is set inline on each progress bar by the library (the visible time of the toast);
treat it as read-only.

### Density and layout

- `--cool-toast-pill-padding` and `--cool-toast-body-padding` set the padding of the compact pill and of the
  expanded body. The expanded body is 320 to 400 px wide (never wider than the viewport minus twice the `offset`).
- `--cool-toast-radius-body` rounds the clipping box that keeps text inside the blob while it morphs.
- The pill is drawn 44 px tall: a 20 px header line plus 12 px of vertical pill padding on each side. If you change
  the vertical part of `--cool-toast-pill-padding`, the toast still measures its content and the blob grows to fit,
  but the pill will no longer be 44 px tall (advanced override).
- The library writes the inline `width` and `height` of `.cool-toast-wrapper` on every animation frame so that it
  matches the blob; do not size the wrapper from your own CSS. The close button sits on the wrapper's top corner
  (`-6px` inset), so it follows the blob in every state.

## Accessibility and reduced motion

- Each Toaster has two live regions that announce its toasts: informative toasts politely (`role="status"`, `aria-live="polite"`), errors and
  warnings assertively (`role="alert"`, `aria-live="assertive"`). The announcement is `title: description` when the
  description is text.
- The close button has an accessible label, configurable with `labels.close`.
- `Escape` dismisses the newest toast of each mounted Toaster (disable it with `closeOnEscape={false}`); hovering
  pauses the timers.
- Icons and the gooey blob are decorative (`aria-hidden`).

When the user prefers reduced motion (`prefers-reduced-motion: reduce`), toasts expand and collapse instantly, there
is no squish or shake, fades take 10 ms and the visible time of an expanded toast is `displayDuration` minus 10 ms.

## Project Structure

```text
.
├── src/
│   ├── lib/                 # The published package: Toaster, toast, store, styles.css, types
│   │   └── index.ts         # Single public entry point
│   ├── routes/
│   │   └── (site)/          # Demo site (not published): hero, playground, API reference
│   └── app.css              # Demo styles (Tailwind 4); the package does not use it
├── tests/                   # Vitest suites, component tests, fixtures and the motion mock
├── openspec/                # Spec-driven design artifacts per change (proposal, specs, design, tasks)
├── static/                  # Demo static assets
├── LICENSE
├── NOTICE                   # goey-toast attribution and permission notice
└── package.json
```

Only `dist/` (built from `src/lib` by `npm run package`) is published.

## Development

```sh
npm install
npm run dev           # demo site with Vite
npm run check         # svelte-kit sync + svelte-check
npm run lint          # ESLint
npm run format        # Prettier (write); npm run format:check to verify
npm run package       # build the library into dist/ with svelte-package
```

## Testing

```sh
npm test              # Vitest, single run
npm run test:watch    # Vitest in watch mode
```

The suite has 507 tests across 30 files in `tests/` (Vitest, Testing Library and jsdom; component tests mock `motion` from `tests/mocks`).

The library is developed with strict test-driven development: every change to `src/lib` starts with a failing test
in `tests/`, then the minimum code that makes it pass, then a refactor with the suite green.

## AI assistance

The library and its demo site were developed with AI assistance (Claude Code), under the direction and review of
Eric Valera Miller.

## Attribution

Cool-Toast is an independent Svelte reimplementation of [goey-toast](https://github.com/anl331/goey-toast) by anl331.
goey-toast is released under the MIT License; its notice is reproduced in `LICENSE` and `NOTICE`.

## License

MIT © 2026 Eric Valera Miller. See `LICENSE`.
