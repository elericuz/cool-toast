# Tasks — cool-toast-v1.2-landing-redesign

- [x] T1 Tokens and base styles: rewrite `src/app.css` (fonts, @theme, utilities) — worker-web
- [x] T2 Layout + nav + hero + welcome toast: `(site)/+layout.svelte`, `Hero.svelte`, new `SiteNav.svelte` — worker-web
- [x] T3 Playground restyle: `Playground.svelte`, `SegmentedControl.svelte`, `ToggleControl.svelte`, `CodeBlock.svelte`,
      `playground.svelte.ts` (theme removed) — worker-web
- [x] T4 Blob strip + Install/API + footer: new `BlobStrip.svelte`, `InstallSection.svelte`, `SiteFooter.svelte`,
      `+page.svelte` assembly, `phosphor-svelte` devDep — worker-web
- [x] T5 Static review DEMO-1..18 + browser check (1280×800, 390×844) — worker-qa

## Round 2 (user feedback on the first render)

- [x] T6 Library: scoped toasters (`Toaster` props `id`, `inline`; `ToastOptions.toasterId`) — worker-qa RED → worker-web GREEN → worker-qa verify
- [x] T7 Hero stage: inline `hero` toaster + autoplay loop over the five types, aligned type rows — worker-web
- [x] T8 API reference section (Toaster props, toast methods, options, promise, presets, CSS vars) — worker-web
- [x] T9 Footer "Made with ♥ by elericuz" — worker-web
- [x] T10 README.md regenerated with the readme-creator structure (English) — worker-web; worker-qa reviews
- [x] T11 Final QA: DEMO-1..18 + TOASTER-1..6 + full test suite — worker-qa
- [x] T12 API examples per tab (DEMO-25) — worker-web; worker-qa static check
