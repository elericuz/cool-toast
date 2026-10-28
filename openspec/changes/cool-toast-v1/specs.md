# Specs — cool-toast-v1

Each scenario id (`STORE-3`, `RENDER-7`, …) is an acceptance criterion. worker-qa turns scenarios into tests in
`tests/` (mirroring `src/lib/`); worker-web implements until they pass. Timings are exact unless marked "≈".

Conventions used below:
- "compact toast" = no `description` and no `action`. "expanded toast" = has either.
- `PH` = 34 (pill height, px). Timing constants are listed in `handoff.md` §B.7.
- Tests use `vi.useFakeTimers()`; "after N ms" means `vi.advanceTimersByTime(N)`.
- DOM selectors are the public data attributes listed in `handoff.md` §B.8 (`[data-cool-toast]`, …).

---

## 1. Store & queue (`STORE`)

**STORE-1 Lazy, SSR-safe creation**
Given the module `toast-store.svelte.ts` is imported in an environment without `window`
When no toast function has been called
Then no `$state` object has been created and no `setTimeout` has been scheduled; importing throws nothing.

**STORE-2 Id generation**
Given `toast('A')` is called without `id`
Then it returns a non-empty string id; two consecutive calls return different ids.
Given `toast('A', { id: 'x' })` and `toast('B', { id: 7 })`
Then they return `'x'` and `7` unchanged, and `toast.dismiss('x')` / `toast.dismiss(7)` remove exactly those toasts.

**STORE-3 Type and phase defaults**
Given `toast('A')` → record `type: 'default'`, `phase: 'default'`.
Given `toast.success('A')` → `type: 'success'`, `phase: 'success'` (same for error/warning/info).

**STORE-4 visibleToasts cap and FIFO queue**
Given `visibleToasts` is 3 (default) and no toasts exist
When 5 toasts are created (ids 1..5)
Then toasts 1, 2, 3 are `active` and rendered; 4 and 5 are `queued` and not rendered.
When toast 1 is dismissed and its exit completes
Then toast 4 becomes active (FIFO) and toast 5 stays queued.

**STORE-5 maxQueue + drop-oldest (default)**
Given `visibleToasts` 1 and `maxQueue` 2
When toasts a, b, c, d are created
Then a is active, queue is `[c, d]` (b was dropped as the oldest queued entry).

**STORE-6 maxQueue + drop-newest**
Given `visibleToasts` 1, `maxQueue` 2, `queueOverflow: 'drop-newest'`
When toasts a, b, c, d are created
Then a is active, queue is `[b, c]`, and `toast('d')` still returned an id.

**STORE-7 dismiss(id) on a queued toast**
Given a queued toast q
When `toast.dismiss(q)` is called
Then q is removed from the queue, no DOM node ever appears for it, `onDismiss` for q is NOT called
(it was never shown), and active toasts are untouched.

**STORE-8 dismiss() clears everything**
Given 3 active and 2 queued toasts
When `toast.dismiss()` is called
Then the queue is empty and all 3 active toasts leave the DOM after their exit transition (≤ 350 ms);
`onDismiss` fires once per active toast; `onAutoClose` fires for none.

**STORE-9 dismiss({ type })**
Given active toasts success s1, error e1 and queued toasts success s2, info i2
When `toast.dismiss({ type: 'success' })` → s1 dismissed and s2 removed from the queue; e1 and i2 untouched.
When `toast.dismiss({ type: ['error', 'info'] })` → e1 dismissed and i2 removed.

**STORE-10 Callbacks: auto close vs manual**
Given a compact toast with `onDismiss` and `onAutoClose` spies and `duration` 1000
When 1000 ms pass → `onAutoClose(id)` then `onDismiss(id)` are called once each, in that order.
Given the same toast but `toast.dismiss(id)` is called at 500 ms → only `onDismiss(id)` is called.
Given the same toast but the close button is clicked → only `onDismiss(id)` (manual; fixes goey quirk).
Given the same toast but swipe-dismissed → only `onDismiss(id)`.
Given the same toast but Escape dismissed → only `onDismiss(id)`.

**STORE-11 Queue advance after exit**
Given `visibleToasts` 1, toast a active, b queued
When a auto-closes
Then b becomes active only after a's record is removed (not while a is still exiting), and a's
`onDismiss` is called before b's record is created.

**STORE-12 Timer pause/resume primitive**
Given the store starts a timer of 1000 ms for id x
When paused at 400 ms and resumed 5000 ms later
Then the callback fires exactly 600 ms after resume (remaining time preserved), and never fires twice.

**STORE-13 Toaster config is reactive**
Given `<Toaster visibleToasts={1} />` is rendered with toasts a active and b queued
When the `visibleToasts` prop changes to 2
Then b becomes active without any new `toast()` call.

**STORE-14 Existing id updates in place**
Given `toast('A', { id: 'x' })` is active (or queued)
When `toast.success('B', { id: 'x', description: 'd' })` is called
Then there is still exactly one record with id `x`, at the same position in `active`/`queue`, with title `B`,
type `success` and the new options applied; its lifetime timer restarts; no duplicate is created and `promise`
settlement relies on this same path.
Given the record with id `x` is already dismissing (exit or collapse in progress)
When `toast('B', { id: 'x' })` is called
Then the dismissal is cancelled and the same record restarts its lifecycle from the entry state with the new content
(internal `version` increments; the component treats a version change as a fresh mount of that record).

---

## 2. Toast API & option resolution (`API`)

**API-6 Promise resolvers vs Snippets**
In `PromiseData.success`, `.error`, `.description.success` and `.description.error`, any function value is a
resolver called with the settlement value; a Svelte `Snippet` is a function at runtime, so a Snippet must be wrapped
(`success: () => mySnippet`). The types do not accept a bare `Snippet` in those four fields.

**API-1 Signatures** (type-level, checked with `expectTypeOf` or `// @ts-expect-error`)
`toast(title: string, options?: ToastOptions): string | number`;
`toast.success|error|warning|info` same; `toast.promise<T>(p, data): string`;
`toast.update(id, options: ToastUpdateOptions): void`; `toast.dismiss(idOrFilter?): void`.
`toast.custom` and `toast.loading` do not exist (`// @ts-expect-error`).

**API-2 animationPresets values**
`animationPresets` equals exactly
`{ smooth: {bounce: .1, spring: true}, subtle: {bounce: .05, spring: true}, snappy: {bounce: .4, spring: true}, bouncy: {bounce: .6, spring: true} }`.

**API-3 Resolution order (toast → preset → Toaster → defaults)**
Given Toaster `{ preset: 'bouncy', showTimestamp: false }`
- `toast('A')` → `bounce .6, spring true, showTimestamp false`.
- `toast('A', { preset: 'subtle' })` → `bounce .05`.
- `toast('A', { preset: 'subtle', bounce: .2 })` → `bounce .2` (explicit prop beats preset).
- `toast('A', { showTimestamp: true })` → `showTimestamp true`.
Given a Toaster with no props → `bounce .4, spring true, showProgress false, showTimestamp true, duration 4000,
displayDuration 4000`.

**API-4 Duration semantics**
- Compact toast: `duration` = option → Toaster `duration` → 4000. `Infinity` disables auto close.
- Expanded toast: `duration` option is IGNORED; lifetime = `timing.displayDuration` → 4000.
- `timing.displayDuration` on a compact toast is ignored (parity).

**API-5 `resolveOptions` is pure**
Given the same `(toastOptions, toasterProps)` input twice → deep-equal output; input objects are not mutated.

---

## 3. Toaster rendering & accessibility (`RENDER`)

**RENDER-1 Toaster DOM**
Given `<Toaster />` is mounted
Then exactly one `[data-cool-toaster]` element exists with `data-position="bottom-right"`,
`data-side="right"`, `data-theme` in `{light, dark}`, `dir="ltr"`, inline CSS vars `--cool-toast-gap: 14px`
and `--cool-toast-offset: 24px`; it contains an `<ol>` with no `<li>` and the two announcer regions.

**RENDER-2 Position → side mapping**
`top-left`/`bottom-left` → `data-side="left"`; `*-right` → `right`; `*-center` → `center`.
Given `dir="rtl"`: `*-left` → `right`, `*-right` → `left`, `*-center` → `center`.
The toaster also carries `data-y="top|bottom"`.

**RENDER-3 Toast DOM structure (compact)**
Given `toast('Saved')`
Then an `<li data-cool-toast data-type="default" data-phase="default" data-expanded="false" data-state="pill">`
contains, in order: `svg[data-cool-toast-blob]` with one `<path>` (`aria-hidden="true"`), and
`[data-cool-toast-content]` with `[data-cool-toast-header]` → `[data-cool-toast-icon]`, `[data-cool-toast-title]`
text "Saved", `[data-cool-toast-timestamp]`. No description, action or progress elements exist.

**RENDER-4 Toast DOM structure (expanded)**
Given `toast('Saved', { description: 'Your file is safe', action: { label: 'Undo', onClick } })`
When 330 ms pass
Then `data-expanded="true"`, `[data-cool-toast-description]` text "Your file is safe",
`[data-cool-toast-timestamp]` is inside the description row (not the header), and
`button[data-cool-toast-action]` text "Undo" with `aria-label="Undo"`. Before 330 ms, `data-expanded="false"`.

**RENDER-5 Timestamp placement and format**
With `vi.setSystemTime(new Date(2026, 0, 1, 9, 5, 7))`:
- compact → timestamp in header, text equals `new Date(...).toLocaleTimeString(undefined, {hour:'numeric', minute:'2-digit', second:'2-digit'})`.
- description → timestamp beside the description (`[data-cool-toast-description-row] > [data-cool-toast-timestamp]`).
- action only → timestamp above the action wrapper (`[data-cool-toast-timestamp][data-slot="action"]`).
- `showTimestamp: false` (toast or Toaster) → no timestamp element.

**RENDER-6 Icons per type**
`default` → bell path; `success` → circle + check; `error` → circle + X; `warning` → circle + "!";
`info` → circle + "i"; `loading` → spinner `path[d="M21 12a9 9 0 1 1-6.219-8.56"]` with class
`cool-toast-spin`. All SVGs: 18×18, `stroke="currentColor"`, `stroke-width="2"`, `aria-hidden="true"`.
Given `icon` snippet → it replaces the built-in icon.

**RENDER-7 Toast roles and live attributes**
`default|success|info|loading` → `role="status" aria-live="polite" aria-atomic="true"`.
`error|warning` → `role="alert" aria-live="assertive" aria-atomic="true"`.

**RENDER-8 Announcer**
Given `<Toaster />`
Then two visually hidden regions exist: `[data-cool-toast-announcer="polite"][role=status][aria-live=polite][aria-atomic=true]`
and `[data-cool-toast-announcer="assertive"][role=alert][aria-live=assertive][aria-atomic=true]`.
When `toast.success('Saved', { description: 'Done' })` → after the next frame the polite region text is
`"Saved: Done"`; after 7000 ms it is empty.
When `toast.error('Failed')` → the assertive region text is `"Failed"`.
When `description` is a Snippet → announcement is the title only.

**RENDER-9 Close button**
Given Toaster `closeButton: false` (default) → no `[data-cool-toast-close]`.
Given `closeButton: true` or `'top-left'` → `button[data-cool-toast-close][data-side="top-left"]`
with `aria-label="Close notification"`. `'top-right'` → `data-side="top-right"`.
Given `labels={{ close: 'Cerrar' }}` → `aria-label="Cerrar"`.
When clicked → toast dismissed (manual, STORE-10). During `loading` phase the button is not rendered.

**RENDER-10 Escape**
Given `closeOnEscape` true (default) and toasts a (older) and b (newer) active
When `Escape` is pressed on `document` → b is dismissed, a stays. Pressed again → a dismissed.
Given `closeOnEscape: false` → nothing happens.

**RENDER-11 Hover pause (compact)**
Given a compact toast with `duration` 1000
When the pointer enters the `<li>` at 400 ms and leaves at 2000 ms
Then the toast is still present at 2000 ms and auto-closes at 2600 ms.

**RENDER-12 Compact auto-dismiss**
Given `toast('A')` with defaults → after 3999 ms present; after 4000 ms the exit starts and `onAutoClose` fires;
after 4000 + 350 ms the `<li>` is removed.
Given `duration: Infinity` → still present after 60 000 ms.

**RENDER-13 Theme attribute**
`theme="light"` → `data-theme="light"`; `"dark"` → `"dark"`.
`theme="system"` (default): `matchMedia('(prefers-color-scheme: dark)').matches` true → `"dark"`, false → `"light"`;
firing the media query `change` event flips the attribute.

**RENDER-14 Stack order and mirroring attributes**
Given position `bottom-right` and toasts a then b → `<ol>` children order is `[b, a]` (newest first; CSS places the
newest nearest the edge). Given `top-*` → order `[b, a]` as well, with `data-y="top"`.
Right side: `<li data-side="right">` (CSS applies `scaleX(-1)` to the blob wrapper and un-mirrors content).

**RENDER-15 Progress bar**
Given `showProgress: true` and an expanded toast with `displayDuration` 4000
When expanded (330 ms) → `[data-cool-toast-progress]` exists with `data-type` and inline
`--cool-toast-progress-duration: 2770ms`, `data-paused="false"`.
When hovered → `data-paused="true"`. Compact toasts and `showProgress: false` → no progress element.
Given `toast.promise(p, { showProgress: true, ... })` → after resolve with expanded content, the progress element
exists (fixes goey).

**RENDER-16 Custom colours**
Given `fillColor: '#123456', borderColor: '#abcdef'` → `path[fill="#123456"][stroke="#abcdef"][stroke-width="1.5"]`.
Given `borderWidth: 3` with `borderColor` → `stroke-width="3"`. Without `borderColor` → `stroke="none"`,
`stroke-width="0"`. Without `fillColor` → `fill="var(--cool-toast-fill)"`.

**RENDER-17 `classes` pass-through**
Given `classes: { wrapper: 'w', content: 'c', header: 'h', title: 't', icon: 'i', description: 'd', actionWrapper: 'aw', actionButton: 'ab' }`
on an expanded toast → each listed element has the corresponding class.

---

## 4. Gooey morph path (`MORPH`)

Pure functions in `src/lib/morph-path.ts`. `pw` pill width, `bw` body width, `th` total height.

**MORPH-1 Pill at t = 0**
`morphPath(120, 300, 90, 0)` equals
`M 0,17 A 17,17 0 0 1 17,0 H 103 A 17,17 0 0 1 120,17 A 17,17 0 0 1 103,34 H 17 A 17,17 0 0 1 0,17 Z`
(whitespace-normalised).

**MORPH-2 Pill threshold**
For any `t` where `(PH + (th − PH)·t) − PH < 8`, the output is the pill of MORPH-1
(e.g. `morphPath(120, 300, 90, 0.1)` → bodyH 39.6 → pill).

**MORPH-3 Full body at t = 1**
`morphPath(120, 300, 90, 1)` contains, in order: `M 0,17`, `A 17,17 0 0 1 17,0`, `H 103`,
`A 17,17 0 0 1 120,17`, `L 120,20` (bodyTop = 34 − 14), `Q 120,34 134,34` (curve 14, qEndX = min(134, 284)),
`H 284` (bodyW 300 − cr 16), `A 16,16 0 0 1 300,50`, `L 300,74`, `A 16,16 0 0 1 284,90`, `H 16`,
`A 16,16 0 0 1 0,74`, `Z`.

**MORPH-4 Intermediate interpolation**
`morphPath(120, 300, 90, 0.5)`: bodyH 62, curve 7, cr min(16, 28·.45)=12.6, bodyW 210, bodyTop 27,
qEndX min(127, 197.4)=127. The path never emits `curve` on its own; assert the ordered fragments that derive
from it: `L 120,27`, `Q 120,34 127,34`, `H 197.4`, `A 12.6,12.6 0 0 1 210,46.6`, `L 210,49.4`,
`A 12.6,12.6 0 0 1 197.4,62`, `H 12.6`, `A 12.6,12.6 0 0 1 0,49.4` (numbers rounded to 3 decimals).

**MORPH-5 pillW clamp**
`morphPath(400, 300, 90, 0)` uses `pillW = 300` (min(pw, bw)).

**MORPH-6 Centre variant**
`morphPathCenter(120, 300, 90, 0)` is a pill centred at `pillOffset = 90`: starts `M 90,17`, ends `Z`, pill spans
90..210. At `t = 1`: body spans 0..300 with two fillets, `qLeftX = max(16, 90 − 14) = 76`,
`qRightX = min(284, 210 + 14) = 224`. Both appear in the output.

**MORPH-7 Monotonic height**
For `t` in `{0, .25, .5, .75, 1}`, the largest y value in the path is non-decreasing (`34, 48, 62, 76, 90`).

**MORPH-8 Memoisation**
Calling `morphPath` twice with identical args returns the same string instance (`toBe`).

---

## 5. Animations & reduced motion (`ANIM`)

Driven by `motion`'s `animate`; tests assert DOM state, not physics. Spring constants are verified statically by
worker-qa against `handoff.md` §B.7.

**ANIM-1 Expand timeline states**
Given an expanded toast
- at 0 ms → `data-state="pill"`, `data-expanded="false"`, `path.d` equals the pill path for its measured dims.
- at 330 ms → `data-expanded="true"`, `data-state="morphing"`.
- when the morph controller completes (test stubs `animate` to complete synchronously) → `data-state="expanded"`,
  `path.d` equals `morphPath(pw, bw, th, 1)`, wrapper inline `width` cleared, content `max-height`/`clip-path`/
  `overflow` cleared.

**ANIM-2 Collapse → dismiss**
Given an expanded toast, `displayDuration` 4000, `animate` stub completes synchronously
When 330 + 2770 ms pass → `data-state="collapsing"`, description and action leave the DOM (≤ 350 ms),
then `data-state="pill"`, `data-expanded="false"`.
When 800 more ms pass → `onAutoClose` then `onDismiss`, exit starts; the `<li>` is gone 350 ms later.

**ANIM-3 Hover during collapse re-expands**
Given the toast of ANIM-2 at `data-state="collapsing"`
When the pointer enters → `data-state="morphing"` then `"expanded"`; no dismiss while hovered;
`[data-cool-toast-progress]` is re-keyed (new element instance). When the pointer leaves → the display timer
restarts with the full display time (`displayDuration − 330 − 900`, 2770 ms by default; the previous timer had
already fired, so there is no remaining time to resume) and the collapse happens again.

**ANIM-4 Reduced motion snapping**
Given `matchMedia('(prefers-reduced-motion: reduce)').matches` is true and an expanded toast
Then `data-expanded="true"` at 0 ms (delay 330 → 0); `path.d` equals the `t = 1` path immediately
(`animate` never called for the morph); `data-reduced-motion="true"` on the `<li>`; no squish/shake transforms are
applied; display timer = `displayDuration − 10`.

**ANIM-3b Hover never reverts a `successLabel` collapse**
Given an expanded toast collapsing because its action with `successLabel` was clicked
When the pointer enters during the collapse → no re-expand; the toast finishes collapsing and dismisses 1200 ms after
the click as in RENDER-9.

**ANIM-10 Collapse landing squish**
Given an expanded toast with `spring` true and no reduced motion
When an automatic collapse starts (`data-state` becomes `"collapsing"`)
Then one squish animation starts on the `<li>` wrapper with the squish spring (`squishSpring(b)`: stiffness
`200 + b·437.5`, damping `24 − b·20`, mass `.7`),
using compress `.035` and expand `.018` (`scaleY 1 − .035·(b/.4)·sin(vπ)`, `scaleX 1 + .018·(b/.4)·sin(vπ)`,
origin `center top`); it is debounced like the other landing squishes (300 ms) and skipped when `spring` is false
or reduced motion is on.

**ANIM-5 Icon swap**
Given a promise toast
When it resolves → the loading icon is removed and the success icon is rendered inside a `{#key phase}` block
(old icon leaves within 200 ms, new icon present at 200 ms).

**ANIM-6 Error shake marker**
Given `toast.update(id, { type: 'error' })` → the `<li>` gets `data-shake="true"` and the shake controller runs;
the attribute is removed when it completes (stub completes synchronously → attribute absent after a tick).

**ANIM-7 Pill resize on title change (compact)**
Given a compact toast in `data-state="pill"`
When `toast.update(id, { title: 'Much longer title here' })` → `path.d` is the pill path for the NEW measured pw
once the resize controller completes; `data-state` stays `"pill"`.

**ANIM-8 Progress bar duration**
`--cool-toast-progress-duration` equals `displayDuration − 330 − 900` ms (`2770ms` by default) and
`displayDuration − 10` under reduced motion.

**ANIM-9 Spring vs tween selection** (unit test of `animation-config.ts` pure helpers)
`morphExpandOptions(bounce .4, spring true)` → `{ type: 'spring', duration: .9, bounce: .4 }`;
`spring false` → `{ duration: .6, ease: [.4, 0, .2, 1] }`.
`morphCollapseOptions(.4, true, preDismiss: true)` → `{ duration: .9, ease: [.4,0,.2,1] }`;
`preDismiss false` → `{ type: 'spring', duration: .9, bounce: .35 }`.
`pillResizeOptions(.4, true)` → `{ type: 'spring', duration: .5, bounce: .35 }`; `spring false` →
`{ duration: .4, ease: [.4,0,.2,1] }`.
`squishSpring(bounce .4)` → `{ type: 'spring', stiffness: 375, damping: 16, mass: 0.7 }`;
`bounce .6` → `stiffness 462.5, damping 12`.
`squishTransform(v, bounce .4, kind 'mount')` at `v = .5` → `scaleX(1.06) scaleY(0.88)` (intensity sin(π/2) = 1);
`kind 'collapse'` → `scaleX(1.018) scaleY(0.965)`. With `mirrored: true` the string starts with `scaleX(-1) `.
`shakeTransform(v)` → `translateX(${sin(v·π·6)·(1−v)·3}px)`.

---

## 6. Swipe to dismiss (`SWIPE`)

Pointer Events on the `<li>`. `dx` is horizontal displacement from `pointerdown`.

**SWIPE-1 Threshold reached**
Given `swipeToDismiss` true (default)
When `pointerdown` at x 0, `pointermove` to x 120, `pointerup`
Then the toast is dismissed (manual; `onDismiss` only), `data-swiping` was `"true"` during the move.

**SWIPE-2 Below threshold snaps back**
When `pointerdown` at 0, `pointermove` to 60, `pointerup`
Then the toast stays; inline `transform` and `opacity` are cleared; `data-swiping` absent.

**SWIPE-3 Live transform and opacity**
When `pointermove` to dx 75 → inline `transform: translateX(75px)`, `opacity: 0.5` (1 − 75/150), `transition: none`.
At dx 150 or more → `opacity: 0`.

**SWIPE-4 Dead zone and vertical rejection**
`pointermove` to dx 8 → no transform (|dx| ≤ 10). First move with `|dy| > |dx|` and `|dy| > 10` → gesture
cancelled; further horizontal moves in the same gesture do nothing.

**SWIPE-5 Disabled**
Given `swipeToDismiss: false` → pointer sequence of SWIPE-1 does nothing (toast stays, no transform).

**SWIPE-6 Negative direction and mouse**
`pointerType: 'mouse'` and dx −120 → dismissed (both directions, mouse and touch).

**SWIPE-7 Hover pause interplay**
During a swipe the display timer stays paused (pointer is inside); after a snap-back and `pointerleave` it resumes.

---

## 7. Promise lifecycle (`PROMISE`)

**PROMISE-1 Loading state**
Given `toast.promise(p, { loading: 'Saving…', success: 'Saved', error: 'Failed' })`
Then it returns a string id; the toast has `data-type="default" data-phase="loading"`, title "Saving…", spinner
icon, no close button, no auto-dismiss while pending (present after 60 000 ms), polite announcement "Saving…".

**PROMISE-2 Success with function resolvers**
Given `success: (d) => `Saved ${d.n}`` and `p` resolves `{ n: 3 }`
Then title "Saved 3", `data-type="success" data-phase="success"`, polite announcement "Saved 3".

**PROMISE-3 Error with function resolvers**
Given `error: (e) => `Failed: ${e.message}`` and `p` rejects `new Error('boom')`
Then title "Failed: boom", `data-type="error" data-phase="error"`, assertive announcement, `data-shake` observed.
The rejection does not propagate (no unhandled rejection).

**PROMISE-4 Per-phase description and action**
Given `description: { loading: 'Please wait', success: (d) => 'All good', error: 'Try again' }` and
`action: { success: { label: 'Open', onClick }, error: { label: 'Retry', onClick } }`
Then during loading: description "Please wait", no action. After resolve: description "All good", action "Open".
After reject: description "Try again", action "Retry".

**PROMISE-5 Timer after settlement**
Given no description/action and `p` resolves at 1000 ms → compact toast; auto-closes 4000 ms after settlement
(default compact duration), `onAutoClose` fires.
Given `description.success` present → expanded lifetime from settlement = `timing.displayDuration` ?? 4000 using
the expanded timeline (ANIM-2).

**PROMISE-6 showProgress on promise toasts**
Given `showProgress: true` in `PromiseData` (or on the Toaster) and `description.success`
Then after resolve + 330 ms the progress element exists (RENDER-15).

**PROMISE-7 Dismissed while pending**
Given `toast.dismiss(id)` during loading → toast removed; when `p` later resolves, nothing is rendered and no
error is thrown.

---

## 8. Update & dismiss (`UPDATE`)

**UPDATE-1 title/description/type**
Given active toast a (default)
When `toast.update(a, { title: 'New', description: 'Desc', type: 'success' })`
Then title "New", description "Desc" (toast becomes expanded → morph), `data-type="success" data-phase="success"`,
polite announcement "New: Desc".

**UPDATE-2 icon null clears the icon**
`toast.update(a, { icon: null })` → `[data-cool-toast-icon]` is empty (no svg). Passing a Snippet restores it.

**UPDATE-3 action and showTimestamp**
`toast.update(a, { action: { label: 'Go', onClick } })` → action button "Go" present.
`toast.update(a, { showTimestamp: false })` → timestamp removed.

**UPDATE-4 Queued toast update (fixes goey)**
Given `visibleToasts` 1, a active, b queued
When `toast.update(b, { title: 'Later', type: 'warning' })` and then a is dismissed
Then b renders with title "Later", `data-type="warning"`, and `toast.dismiss({ type: 'warning' })` while b was
queued would have removed it.

**UPDATE-5 Unknown id**
`toast.update('nope', { title: 'x' })` and `toast.dismiss('nope')` are no-ops and do not throw.

**UPDATE-6 Action with successLabel**
Given expanded toast with `action: { label: 'Undo', onClick, successLabel: 'Undone' }`
When the action is clicked → `onClick` called once; title becomes "Undone"; `data-phase="success"`; description and
action leave; `data-state` → `collapsing` → `pill`; 1200 ms after the collapse completes the toast is dismissed
(manual: `onDismiss` only). If `onClick` throws, the error is caught (`console.error`) and the flow continues.

**UPDATE-7 Action without successLabel**
Click → `onClick` called; toast stays expanded; nothing else changes.

---

## 9. Styling & theming (`STYLE`)

**STYLE-1 Stylesheet export**
`package.json` `exports['./styles.css']` points to `dist/styles.css`; `src/lib/styles.css` exists and is copied by
`svelte-package` (verified by file presence and export map, not by building).

**STYLE-2 CSS custom properties with goey defaults**
`src/lib/styles.css` declares on `[data-cool-toaster]` every variable in `handoff.md` §B.6 with the listed default
and redeclares the dark values under `[data-cool-toaster][data-theme="dark"]`. Test: parse the file as text and
assert each `--cool-toast-*: value;` pair (light) and each dark override.

**STYLE-3 No Tailwind dependency**
`src/lib/styles.css` contains no `@import 'tailwindcss'`, `@apply`, `@theme` or `@layer`.

**STYLE-4 Progress keyframes and spinner**
The stylesheet declares `@keyframes cool-toast-progress-shrink` (scaleX 1 → 0, `transform-origin: left center`),
`.cool-toast-progress-bar { animation: cool-toast-progress-shrink var(--cool-toast-progress-duration, 4000ms) linear forwards }`,
`[data-paused="true"] .cool-toast-progress-bar { animation-play-state: paused }` and
`@keyframes cool-toast-spin` with `.cool-toast-spin { animation: cool-toast-spin 1s linear infinite }`.

**STYLE-5 Reduced motion CSS**
`@media (prefers-reduced-motion: reduce)` sets `transition: none` and `animation-duration: 0.01ms` for
`[data-cool-toast] *` except the progress bar (which keeps its duration so the timer stays visible).

**STYLE-6 Type colour hooks**
Title, icon, action button and progress bar use `var(--cool-toast-<type>-color)` via `[data-type="<type>"]` rules;
action backgrounds use `var(--cool-toast-<type>-action-bg|-hover|-active)`.

**STYLE-7 Index exports**
`src/lib/index.ts` exports exactly: `Toaster`, `toast`, `animationPresets` (runtime) and the types listed in
`handoff.md` §B.5. Test: `Object.keys(await import('../src/lib/index.ts')).sort()` equals
`['Toaster', 'animationPresets', 'toast']`.

**STYLE-8 package.json contract**
`name` is `@elericuz/cool-toast`; `peerDependencies.svelte` matches `^5`; `dependencies` has exactly `motion`; `exports['.']` has `types` and
`svelte`; `files` includes `dist`; `svelte` field points to `./dist/index.js`; `sideEffects` lists `**/*.css`.

---

## 10. Demo page (`DEMO`) — static verification only

**DEMO-1** `npm run check`, `npm run lint` and `npm run format:check` pass with the demo present.
**DEMO-2** `src/routes/(site)/+page.svelte` exists; `src/routes/+page.svelte` does not; `src/routes/(site)/+layout.svelte`
imports `../../app.css` and renders `<Toaster />` once with the playground-bound props.
**DEMO-3** No `<style>` block and no `style=""` attribute in any `src/routes/**/*.svelte`; no arbitrary Tailwind values
(`\[[^\]]+\]` inside `class=`).
**DEMO-4** `src/app.css` imports Google Fonts, `@import 'tailwindcss'`, defines `@theme` with `--color-*` and two
`--font-*` families, none of them Inter, Roboto, Arial, Helvetica, system-ui or Space Grotesk; no purple-on-white
gradient utilities.
**DEMO-5** The playground exposes controls for: type (5), position (6), preset (4), description on/off, action
on/off (+ successLabel), promise (resolve/reject), theme (3), showProgress, showTimestamp, closeButton (3), queue demo
(fires 6 toasts), swipe hint, reduced-motion indicator. Each control is a labelled form element (`<label>` or
`aria-label`).
**DEMO-6** Install instructions (`npm install @elericuz/cool-toast`), the `import '@elericuz/cool-toast/styles.css'` line, a `<Toaster />` snippet and at
least one `toast(...)` snippet are rendered in `<pre><code>` blocks; snippets are generated from the current control
state.
**DEMO-7** No `hooks.server.ts`, no `src/routes/api`, no `(admin)` group, no `.env`, no `adapter-node`, no `dotenv`.
**DEMO-8** A11y review (manual by worker-qa): keyboard reaches every control, visible focus, contrast of demo text
≥ 4.5:1, `prefers-reduced-motion` honoured by the page's own animations.
