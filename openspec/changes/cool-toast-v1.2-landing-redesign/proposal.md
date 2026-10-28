# Proposal — cool-toast-v1.2-landing-redesign

## Intent

Replace the demo landing page (`src/routes/(site)/**`, `src/app.css`) with a light-only, demo-first design built with
the `impeccable` and `taste-skill` guidance. The library (`src/lib/**`) does not change.

## Why

The current demo is a dark editorial page (ink background, ember/lagoon accents, blurred blobs, grain). The user asked
for a redesign in light mode only. PRODUCT.md (new) fixes the brief: register brand, personality "precise, playful,
tactile", reference sonner.emilkowal.ski, anti-references generic SaaS and editorial lanes.

## Scope

In: `src/app.css`, `src/routes/(site)/**`, `src/routes/+layout.svelte` if present, `PRODUCT.md`, `phosphor-svelte`
devDependency, `README.md` demo paragraph if it mentions the dark demo.
Out: `src/lib/**`, tests of the library, `package.json` exports, publishing.

## Approach

Design read: demo-first landing for Svelte developers; dials VARIANCE 7 / MOTION 6 / DENSITY 3. Restrained colour
strategy (user decision): pure white page, cool greys, one navy `oklch(0.28 0.07 255)` used solid (hero stage, CTA,
focus, selected pills).
One type family (Geologica) in weights, Geist Mono only in code. The only imagery is the real component: toasts fired
from the page and real `morphPath` blobs.

## Success

User runs `npm run dev`, sees the hero toast fire within a second, every playground control updates the snippet,
`npm run check`/`lint`/`format:check` clean, 488 library tests unaffected, worker-qa approves the static review.
