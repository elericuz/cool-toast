# Product

## Register

brand

## Users

Svelte 5 developers evaluating a toast library for their own apps. They arrive from npm, GitHub or a
link, on a laptop, in the middle of building something. The job: see the gooey toast move within
five seconds, confirm the API is small and typed, copy the install command, leave.

## Product Purpose

Cool-Toast (`@elericuz/cool-toast`) is a Svelte 5 port of goey-toast: a notification toast whose
blob morphs from a pill into a body and back. The landing page is the demo: it must let the visitor
fire real toasts, tweak the options that matter, and read the resulting code. Success is a developer
installing the package after playing with the page.

## Brand Personality

Precise, playful, tactile. The voice is an engineer who enjoys physics: short declarative sentences,
no marketing verbs, numbers only when they are real (durations, pixel sizes, spring values).

Reference: sonner.emilkowal.ski (demo-first, the toast is tried in the hero, minimal copy, code
visible next to the thing it produces).

## Anti-references

- Generic SaaS landing: three equal feature cards, uppercase tracked eyebrows above every section,
  purple gradients, glow effects, Inter / Space Grotesk, "Elevate your notifications" copy.
- Editorial / magazine lane: italic display serif, ruled columns, monospace used as a technical
  costume, drop caps.
- Dark mode of any kind: the page is light only. The white toast blob on a saturated surface is the
  image.

## Design Principles

1. The toast is the hero: every section shows the real component, never a mock of it.
2. Code sits next to what it produces: each control updates a snippet the visitor can copy.
3. Commit to one colour: a single saturated brand colour carries the page; the toast types keep
   their own semantic colours.
4. Motion is the product: the page moves only where the library moves, plus one orchestrated
   first load.
5. Nothing decorative that the library does not need: no dots, no numbers, no labels on images.

## Accessibility & Inclusion

WCAG 2.2 AA: body text contrast at least 4.5:1, interactive targets at least 24 px, visible focus
rings, keyboard-operable playground, `prefers-reduced-motion` honoured by the page and by the
library (the toast snaps instead of morphing). English UI copy.
