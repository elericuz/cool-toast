# Design — cool-toast-v1.1-premium-polish

Amends `openspec/changes/cool-toast-v1/design.md`. Only D4, D10 and D11 change; one decision is added (D16).
Everything else in v1 (D1–D3, D5–D9, D12–D15, module layout, data flow, SSR, testing strategy) stands.

## D4 (amended) — Pure path functions

Algorithm unchanged. Constants: `PH = PILL_HEIGHT = 44`, `pr = PILL_RADIUS = PH / 2 = 22`, `curve = 14·t`,
`cr = min(16, (bodyH − PH)·0.45)`, pill when `t ≤ 0 || bodyH − PH < 8`. `morph-path.ts` keeps importing from
`constants.ts`; the change is one line in `constants.ts`. Rationale: a 44 px pill holds a 20 px header line with
12 px above and below — the "premium" vertical rhythm — and 22 px radius keeps the pill fully round.

## D11 (amended) — Measurement

`measure()` in `Toast.svelte`:

```
pw = header.offsetWidth + PILL_PADDING_X        // header includes the compact timestamp when it is rendered
bw = max(content.offsetWidth, pw)
th = max(content.offsetHeight, PILL_HEIGHT)
```

Two rules are new:

1. **The header is the pill's content, timestamp included.** The compact timestamp (`data-slot="header"`) is
   rendered inside `[data-cool-toast-header]` whenever the toast is not showing its body — pill state and the whole
   collapsing state. It is removed only when the body is shown (expanded/morphing), where the description-row or
   action-slot timestamp takes over. So `header.offsetWidth` already contains it and the pill path encloses it.
2. **Leaving nodes do not count.** Elements that are mid-exit (`out:` transitions) carry `data-leaving="true"`.
   `measure()` temporarily hides them (`display: none`), reads the offsets, and restores them: `pw/bw/th` describe
   the toast's next shape, not the shape that is going away. In jsdom the stub getters honour the same rule
   (`defaultSize` ignores `[data-leaving]` descendants) so RENDER-19 can assert it.

Ordering during collapse (`collapse()`):

```
view.state = 'collapsing'
bodyShown = false            // header timestamp mounts; body gets data-leaving and starts its out: fade
await tick()                 // DOM reflects the new header
measure()                    // pw now includes the timestamp; th/bw ignore the leaving body → compact dims
driver.collapse(...)         // target pill width is already the final one
```

Clarification (lead, Wave 2): `measure()` after `bodyShown = false` yields the **target** dims of the collapse
(`pw` incl. timestamp, compact `bw`/`th`). The **start** dims are the snapshot of the expanded dims taken before the
body leaves (`expandedDims`, as in v1 `collapse`). The driver interpolates from start to target, so the wrapper
width frames go `bw_expanded → pillW` (320 → 136 with the stubs); they never jump to the compact measurement.

The driver's `onUpdate` writes two things per frame, both outside Svelte reactivity (D3): the path `d` and the
wrapper's inline `width` (`pillW + (bw − pillW)·t`, i.e. the body width of the path at that `t`). In the pill state
the width is `pillW`; expanded it is `bw`.

## D10 (amended) — Mirroring and close button placement

The close button moves from the `<li>` into `.cool-toast-wrapper`, after the content. Position: `top: -6px` and
`right: -6px` (`'top-right'`) or `left: -6px` (`'top-left'`), relative to the wrapper — which, by D11, is exactly as
wide as the blob in every state. On the right side the wrapper is mirrored (`scaleX(-1)`), so the button receives
the same counter-mirror as the content (`[data-side="right"] [data-cool-toast-close] { transform: scaleX(-1) }`),
keeping the "×" glyph upright. Note the semantic flip: on a right-side toast `right: -6px` in wrapper space is the
viewport's left corner. This matches goey (the button hugs the corner nearest the screen edge) and is what the W3
visual checklist verifies; no JS branch is needed.

## D16 (new) — Containment rule

The blob path is the only painted surface. Invariant: **every rendered pixel of a toast lies inside the current
path, at every frame, in every state.** Implementation, by state (`data-state` on the `<li>`):

| State | Wrapper inline width | Content clipping | Header timestamp |
|---|---|---|---|
| `pill` | `pillW` | `overflow: hidden` + `clip-path: inset(0 round var(--cool-toast-radius-body))` | rendered |
| `morphing` | interpolated body width per frame | same clip | not rendered (body timestamp) |
| `expanded` | `bw` | none (`overflow: visible`) — the body is fully inside | not rendered |
| `collapsing` | interpolated body width per frame, non-increasing | same clip as pill | rendered |

Why clip with both `overflow: hidden` and `clip-path`: `overflow` is cheap and jsdom-assertable from the
stylesheet; `clip-path: inset(... round 16px)` rounds the clip to the body radius so a sliver of text cannot show in
the square corner outside the arc while the blob shrinks. Both are CSS-only, selected by `data-state`, so
`Toast.svelte` sets no per-frame style other than `width` and the path.

Amendment (lead, Wave 2): the clipping box is the **wrapper**, not the content. The wrapper tracks the path in
BOTH dimensions per frame: inline `width` = path body width and inline `height` = `bodyH = PH + (th − PH)·t`
(pill: `PH`; expanded: `th`), with `overflow: hidden` and `clip-path: inset(0 round var(--cool-toast-radius-body))`
on the wrapper in every non-expanded state. The content keeps its intrinsic size inside (grid single track is fine);
text can therefore never paint outside the blob horizontally or vertically. The driver writes `d`, `width` and
`height` per frame (allowed inline writes: those three plus the squish/shake transform).

Structure required by that clip (so the blob's drop-shadow and the close button, which both extend beyond the path,
are not clipped): `.cool-toast-wrapper` is the sized frame (inline width/height, `position: relative`, NOT clipped)
and contains, in order: the blob `<svg>` (absolute, `overflow: visible`, shadow intact), a new `.cool-toast-clip`
box (`width/height: 100%`, `overflow: hidden`, `clip-path: inset(0 round var(--cool-toast-radius-body))` when not
expanded, `clip-path: none; overflow: visible` when expanded) that holds `[data-cool-toast-content]`, and the close
button (absolute at the `-6px` corners of the frame). §B.8-delta "close button direct child of the wrapper" stays true.

Why the wrapper width (and not the content width) is driven: the content keeps its intrinsic size (`min-width 320`
when expanded) so text does not reflow during the morph; the wrapper is the clipping box and the close button's
offset parent. One number, written by the driver that already owns the frame.

## CSS variables scheme (amends v1 §6)

New variables declared on `[data-cool-toaster]` with defaults in `handoff.md` §B.6-delta. Padding and typography
values are consumed only through `var()` so users can re-tune density without touching `constants.ts`; the one
coupling that must hold is `PILL_HEIGHT = header line-height + vertical pill padding` (44 = 20 + 24). If a user
overrides `--cool-toast-pill-padding` vertically, the content measures taller than `PILL_HEIGHT` and `th`/`bw`
follow it (D11 uses `max(..., PILL_HEIGHT)`), so the path stays correct; only the pill looks taller than 44. This is
documented in README as an advanced override.

## Testing strategy (amends v1 §7)

- `tests/setup.ts` stub sizes become header 100×20, compact content 150×44, expanded 320×112, and `defaultSize`
  skips `[data-leaving]` descendants when deciding "expanded" and when reporting height. Those getters are
  worker-qa's.
- The `motion` mock's `progressAll(t)` drives the collapse frames of RENDER-19; width assertions read
  `wrapper.style.width`.
- MORPH tests change literals only; `constants.test.ts` gains `PILL_PADDING_X` and the new values.
- Component tests that reused the old defaults (`120/300/90`, `from: 120`) in `Toast.effects`,
  `Toast.expanded-lifecycle`, `Toast.reduced-motion`, `morph-driver` are updated to `136/320/112` in the same RED
  pass (they are stub-coupled, not behaviour changes).
