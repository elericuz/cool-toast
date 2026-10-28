# Handoff — cool-toast-v1.2-landing-redesign

Demo only. No library code, no new unit tests (the demo has none; Strict TDD applies to `src/lib` which is untouched).
worker-qa's role is the static review and browser verification of DEMO-1..18.

## A. Assignment

| Task | Owner | Files | Depends on |
|---|---|---|---|
| T1 tokens/base | worker-web | `src/app.css` | — |
| T2 layout/nav/hero | worker-web | `src/routes/(site)/+layout.svelte`, `components/SiteNav.svelte`, `components/Hero.svelte` | T1 |
| T3 playground | worker-web | `components/Playground.svelte`, `SegmentedControl.svelte`, `ToggleControl.svelte`, `CodeBlock.svelte`, `playground.svelte.ts` | T1 |
| T4 strip/install/footer/page | worker-web | `components/BlobStrip.svelte`, `InstallSection.svelte`, `SiteFooter.svelte`, `+page.svelte`, `snippets.ts`, `package.json` (devDep `phosphor-svelte`) | T2, T3 |
| T5 review | worker-qa | reads everything above; runs `npm run check`, `lint`, `format:check`, `npm test` | T4 |

One wave for worker-web (T1→T4 sequential, same owner), then T5. worker-qa reports CRITICAL/WARNING per DEMO id;
CRITICAL goes back to worker-web.

## B. Contracts

Public package API: unchanged. `src/lib/index.ts` unchanged.

Demo-internal:
- `Playground` class: `theme` removed as a control; `toasterProps` returns `{ position, theme: 'light', closeButton,
  preset, ... }`; `fire(type?: ToastType)`, `copyInstall()`, `burst()`, `promise(kind)` remain.
- `SegmentedControl<T extends string>` props: `label, choices: Choice<T>[], value: T, onchange(v: T)`.
- `ToggleControl` props: `label, checked, onchange(v: boolean)`.
- `CodeBlock` props: `code: string, lang: 'bash' | 'svelte' | 'ts', label?: string`; emits a toast on copy.
- `BlobStrip` has no props; imports `morphPath` from `../../../lib/morph-path.ts`.

## C. Design decisions (lead; not negotiable between workers)

Palette (user: white + greys + navy, see D1), fonts, radii, sections, motion: see design.md D1–D3. Copy: English, no em/en dashes, CTA labels "Fire a toast"
and "Copy install" only. Light only; `Toaster theme="light"`.

## D. Definition of done

check/lint/format:check clean; 488/488 tests unchanged; DEMO-1..18 pass; screenshots at 1280×800 and 390×844 show
hero in the first viewport with h1 ≤ 2 lines and nav on one line.

## E. Round 2 (approved items from the user's review of the first render)

| Task | Owner | Files | Depends on | Specs |
|---|---|---|---|---|
| T6 scoped toasters | worker-qa (RED) → worker-web (GREEN) → worker-qa | `src/lib/{types.ts,toast-store.svelte.ts,toast.ts,Toaster.svelte,Announcer.svelte,styles.css}` / `tests/toaster-scope.test.ts`, `tests/styles.test.ts` | — | TOASTER-1..6 |
| T7 hero loop | worker-web | `(site)/components/Hero.svelte`, new `(site)/hero-loop.svelte.ts`, `src/app.css` | T6 | DEMO-19, DEMO-20 |
| T8 API section | worker-web | new `(site)/components/ApiReference.svelte`, `snippets.ts`, `+page.svelte` | — | DEMO-21 |
| T9 footer | worker-web | `SiteFooter.svelte` | — | DEMO-22 |
| T10 README | worker-web (readme-creator structure) | `README.md` | T6 | DEMO-23 |
| T11 final QA | worker-qa | all | T7–T10 | all |

### Contract for T6

```ts
interface ToasterProps { id?: string; inline?: boolean; /* existing */ }
interface ToastOptions { toasterId?: string; /* existing */ }
```

Store: `getStore(id = 'default')` keeps a `Map<string, ToastStore>`; `Toaster` registers its config in the store of
its `id` on mount; `toast.*` picks the store by `options.toasterId ?? 'default'`; `update`/`dismiss(id)` search every
store; `dismiss()`/`dismiss(filter)` iterate every store. Markup: `[data-cool-toaster][data-inline="true"]` →
`position: absolute; inset: 0; pointer-events: none` with the list keeping `pointer-events: auto`. Existing tests
must stay green (default id behaves exactly as today).

### Decisions

Hero loop interval 3600 ms (display ≈ 2770 ms + exit); stage toaster `visibleToasts={1}` so each type replaces the
previous; demo uses `toasterId: 'hero'` only inside the stage. README in English, no emoji headers (technical tone), with an "AI assistance" section (user request): developed with
AI assistance (Claude Code), directed and reviewed by Eric Valera Miller. Commit messages stay without AI attribution.
