---
name: Bobr
description: Juicy 2.5D mahalla where a child teaches a cheeky beaver fractions. v1 (ink outline, press-down buttons), awaiting the owner's review
colors:
  sand: "#faf2e6"
  paper: "#fefbf6"
  clay-100: "#f2e2d0"
  ink: "#352118"
  ink-muted: "#69564c"
  lazuli: "#1868a0"
  lazuli-deep: "#124a7b"
  tile: "#21abb8"
  apricot: "#f6a14f"
  non: "#cf8f43"
  terracotta: "#b75131"
  lamp: "#faca4b"
  garden: "#4fa866"
  dusk: "#7c8799"
  alert: "#c9302d"
  pie-1: "#e5974c"
  pie-2: "#69c27e"
  pie-3: "#1ebde3"
  pie-4: "#beac3d"
  pie-5: "#75aef5"
  pie-6: "#f28788"
typography:
  display:
    fontFamily: "Unbounded Variable, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 4vw, 2.5rem)"
    fontWeight: 650
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Unbounded Variable, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1.2
  numeral:
    fontFamily: "Unbounded Variable, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1
  body:
    fontFamily: "Onest Variable, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 450
    lineHeight: 1.5
  label:
    fontFamily: "Onest Variable, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.3
rounded:
  sm: "10px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  pill: "999px"
stroke:
  ink: "3px"
  ink-thin: "2px"
  color: "{colors.ink}"
ledge:
  rest: "5px"
  pressed: "1px"
  hover: "6px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  2xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.lazuli}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "14px 28px"
    height: "52px"
    border: "{stroke.ink} solid {colors.ink}"
    ledge: "{ledge.rest} ink, pressed {ledge.pressed}"
  button-primary-hover:
    backgroundColor: "{colors.lazuli-deep}"
    ledge: "{ledge.hover}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "14px 24px"
    height: "52px"
    border: "{stroke.ink} solid {colors.ink}"
    ledge: "{ledge.rest} ink, pressed {ledge.pressed}"
  answer-input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.numeral}"
    rounded: "{rounded.md}"
    height: "72px"
    border: "{stroke.ink} solid {colors.ink}"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "24px"
    border: "{stroke.ink} solid {colors.ink}"
  ai-badge:
    backgroundColor: "{colors.clay-100}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
    border: "{stroke.ink-thin} solid {colors.ink}"
---

# Design System: Bobr

Source of truth for how Bobr looks. It is **v1**: v0's palette and fonts stay, and the owner asked for
more game juice for 11–12-year-olds (18.11): a thick ink outline, buttons that physically press down, fast
punchy feedback, and a cheeky Bobr. v1 still waits for the owner's OK; product screens are not styled
until then (the skeleton UI stays grey and functional).
Order of precedence: `docs/BOBR_SPEC.md` → `PRODUCT.md` → this file → `lib/motion.ts` → any design
skill. Runtime tokens live in `app/globals.css` under the same names. The living sheet is `/dev/styleguide`; snapshots for review in `docs/design/v1/`.

## 1. Overview

A warm evening in a mahalla. Sun-baked clay walls with flat roofs, turquoise doors, apricots, and non
bread fresh from the tandir. Houses light up as topics are learned. The world is 2.5D: soft volume and
one warm key light from the top left, like a clay diorama under a lamp, now drawn with a confident ink
line, the way a good comic draws a toy. It is not flat vector, and it is not a glossy 3D game.

Everything you can press feels like a chunky clay key: it sits on an ink ledge and sinks when pressed.
Feedback is fast and physical (a punch, a pop, a sink), and it lands and stops. Characters carry the
emotion. Bobr is a cheeky PNG-posed beaver who idles, blinks and overreacts; Ustoz is the Humo bird.

## 2. Colors: The Mahalla Palette

Unchanged from v0. OKLCH is canonical (`app/globals.css`); the hex values above are the sRGB equivalents.

### Primary
- **lazuli** `oklch(50% 0.115 245)`: primary actions, focus, Ustoz's accents. Paper text on it is 5.8:1.
- **lazuli-deep** `oklch(40% 0.10 250)`: hover.

### Secondary
- **apricot** `oklch(78% 0.14 62)`: Bobr's warmth, highlights, "you taught Bobr" moments. Ink text only (7.4:1).
- **non** `oklch(70% 0.12 68)`: bread crust; the fraction pie's base and rim, house walls.

### Tertiary
- **tile** `oklch(68% 0.11 205)`: *firuza*, the turquoise of Samarkand tiles. Doors and window frames,
  the number line, the one tile band per screen.
- **lamp** `oklch(86% 0.15 88)`: warm window light of an *alive* house. It is the only "glow" in the product.

### Neutral
- **sand** `oklch(96.5% 0.018 80)`: page background. Never pure white, never grey.
- **paper** `oklch(99% 0.008 85)`: cards and input surfaces.
- **clay-100** `oklch(92% 0.03 70)`: wells, chips, the AI badge.
- **ink** `oklch(27% 0.035 45)`: text, **every outline, every ledge**. Warm brown-black, never `#000`.
- **ink-muted** `oklch(47% 0.03 50)`: secondary text (6.2:1 on sand).
- **dusk** `oklch(62% 0.03 260)`: *dimmed* houses (≥ 7 days without review).

### State colours (house = topic)
| State | Fill | Also carries |
|---|---|---|
| empty | sand, dashed ink footprint | no walls |
| scaffold (gap) | terracotta `oklch(56% 0.14 38)` | wooden scaffold beams |
| built (solved_self) | non walls, flat roof | turquoise door, dark windows |
| alive (taught_bobr) | non walls + lamp windows | lit windows, smoke from the tandir in the yard |
| dimmed | dusk | closed shutters |

### Named Rules
- **Pie rule.** The six slice colours `pie-1…6` share L 74 % and C 0.12–0.13 and differ only in hue, so no slice looks "more correct". Gradients interpolate `in oklch`.
- **One glow rule.** Only `lamp` glows, and only in alive houses and the moment Bobr gets it right.
- **Alert is rare.** `alert` is for system errors only. A wrong answer is never red: Bobr gets curious, the UI stays neutral.
- **Outline contrast.** The ink outline reads against the background (sand/paper, ≥ 12:1), not against the fill; on lazuli it is a dark rim, which is the point.

## 3. Typography

Unchanged from v0. **Unbounded** (display, numbers) + **Onest** (everything else), both self-hosted via
`@fontsource-variable` so the offline demo works. Both have `ʻ` U+02BB, `ʼ` U+02BC and Cyrillic, verified
by reading the font cmaps. Unbounded lacks Uzbek Cyrillic `ғ`, which Bobr does not use.

### Hierarchy
| Role | Font | Size | Weight |
|---|---|---|---|
| display | Unbounded | clamp(28–40 px) | 650 |
| title | Unbounded | 22 px | 600 |
| numeral (fractions, answer input) | Unbounded | 36 px, tabular | 700 |
| body | Onest | 17 px / 1.5 | 450 |
| label, buttons, AI badge | Onest | 15 px | 600 (`--text-label--font-weight`) |

### Named Rules
- **Body never under 16 px.** The readers are 11.
- **Fractions are stacked, not slashed,** in tasks and on the pie: numerator over denominator with a bar. A slashed `3/10` appears only inside running text and in the answer input.
- **Ratio ×1.25.** No sizes outside the table.
- **Uzbek is the long string.** Lay out for the Uzbek label; Russian fits then.

## 4. Line and Elevation

A clay diorama drawn in ink. One key light from the top left (−45°): highlights sit top-left, soft
shadows fall bottom-right, tinted with ink hue, never neutral grey.

### Ink line
| Token | Value | Use |
|---|---|---|
| `--stroke-ink` | 3 px ink | buttons, cards, inputs, pie rim, houses |
| `--stroke-ink-thin` | 2 px ink | chips, AI badge, small icons, house details |

### Ledge (pressables only)
A pressable sits on a hard ink ledge under it. Pressed, it sinks and the ledge shrinks; the bottom edge of
the ledge never moves, so the key looks like it goes into the table, not like it shrinks.

| Token | Value | Meaning |
|---|---|---|
| `TARGETS.ledgePx` (`lib/motion.ts`) | 5 | ledge at rest |
| `TARGETS.pressDepthPx` | 4 | how far the cap sinks; pressed ledge = 5 − 4 = 1 px |
| `TARGETS.hover.lift` | −1 | hover (mouse only) lifts the cap; ledge 6 px |

The ledge is drawn from the button's `y` (one MotionValue): `ledge = ledgePx − y`. Never animate the
shadow and the position separately: they drift and the ledge pokes out under the button.

### Shadow vocabulary
| Token | Value | Use |
|---|---|---|
| `--shadow-rest` | `inset 0 1px 0 oklch(100% 0 0 / .7), 0 6px 16px -8px oklch(27% .035 45 / .25)` | cards, inputs |
| `--shadow-lift` | `inset 0 1px 0 oklch(100% 0 0 / .7), 0 14px 28px -12px oklch(27% .035 45 / .30)` | dragged pie slice |
| `--shadow-clay` | `inset 0 2px 0 oklch(100% 0 0 / .7), inset 0 -3px 0 oklch(27% .035 45 / .18)` (v1: stronger, so the highlight shows on paper keys too) | volume on every pressable and slice |
| `--shadow-well` | `inset 0 3px 0 oklch(27% .035 45 / .10)` | the answer input: a well pressed into the clay |
| `--shadow-drop` | `0 10px 18px -8px oklch(27% .035 45 / .35)` | the soft warm drop under a pressable, shrinks when pressed |

### Named Rules
- **Ink ledge, not a darker fill.** The ledge is always ink, never a darker shade of the button colour, and the cap always keeps `--shadow-clay` (top-left highlight) and the soft warm drop. A flat fill on a same-hue ledge is the Duolingo button; ours is a clay key on an ink base. A critic can check this by eye.
- **Only pressables have a ledge.** Cards, inputs and badges have the outline and a soft shadow, no ledge. A ledge promises "press me".
- **No glassmorphism, no blur panels.** Clay is opaque.

## 5. Components

Motion values come only from `lib/motion.ts` (`useMotion()`); rules are in skill `bobr-animation`.

### Buttons
Pill, 52 px tall (≥ 44 px target), `--stroke-ink` outline, ink ledge, `--shadow-clay` + `--shadow-drop`.
Press: the cap sinks `pressDepthPx` with `TRANSITIONS.press` (fast down, a small springy bounce back up).
Layout never moves: the button reserves the ledge in its own box (bottom margin = `ledgePx`), so the row
does not jump. Hover lift only under `(hover: hover)`. Focus: `--focus-ring` (3 px lazuli), drawn as a
separate ring on the non-moving wrapper around cap *and* ledge, so it does not jump on press. Disabled: clay-100 fill, ink-muted label and outline, no ledge (it cannot be pressed). One primary per
screen. Answer buttons and intents from LLM buttons look the same; the label is the only difference.

### Cards / Containers
Paper on sand, `rounded.lg`, ink outline, `--shadow-rest`, no ledge. Cards appear from
`TARGETS.appearFromScale` (0.9), never from 0. No card inside a card.

### Inputs / Fields
The answer input is the hero of a task: 72 px tall, numeral typography, centered, ink outline,
`--shadow-well`. Focus: lazuli ring. Correct: the input *punches* (`TRANSITIONS.punch`, scale to
`TARGETS.punchScale` and back) and Bobr reacts. Wrong: the input does not shake or turn red. It stays
neutral and Bobr reacts.

### Feedback (juice)
Fast and physical, then still. Every child action gets a response inside 100 ms: a sink, a pop, a punch.
- press → sink (`press`); correct → punch (`punch`) + Bobr pose; slice picked → pop (`pop`).
- Nothing loops on UI. Nothing counts up with overshoot (numbers use `count`).

### Navigation
No nav bar inside a lesson. The mahalla map is home; one back affordance top-left.

### Domain components
- **Pie (Лепёшка):** a round non bread in 2.5D (slight top-down tilt), ink rim, a ring of tiny stamped
  dots on the crust (the *chekich* stamp, the one ornament on the bread), slices in `pie-1…6` with a 2 px
  paper gap. A slice pops out with `TRANSITIONS.pop`; values change with `TRANSITIONS.count`, no overshoot.
- **Strip (Полоска):** a tiled bar like a mosaic band, ink outline, `tile` grout lines, cells `rounded.sm`.
- **Number line (Прямая):** an ink line on sand, ticks in `ink-muted`, the point is a lazuli bead with an ink outline that springs (`TRANSITIONS.move`).
- **House:** a mahalla house in 2.5D: front wall lit, side wall darker (light from the top left), a
  **flat roof** with a low parapet and wooden beam ends (*vassa*) poking out under it, a turquoise door and
  window frames, ink outline. Five states from the table in §2; each state change is the one animated
  moment on the map. An alive house has a small tandir dome in the yard with a wisp of smoke.
- **Tile band:** a thin (≤ 16 px) turquoise geometric band, at most one per screen (map header, parent card). It is an accent, not a frame.
- **AI badge:** always visible, `ai-badge` tokens with a thin ink outline, never hidden behind a menu, never animated.
- **Characters:** PNG poses with transparent backgrounds, see skill `bobr-animation`. They float and blink; UI never does.

## 6. Uzbek colour, lightly

The mahalla is a place, not a pattern library. Allowed accents, one or two per screen: flat roofs with
beam ends, turquoise doors and frames, the non with its stamp, the tandir dome, one tile band. Not
allowed: ornament borders around everything, suzani wallpaper, ikat backgrounds, gold, domes and
minarets as decoration. The child should feel "this is my street", not "this is a souvenir".

## 7. Do's and Don'ts

### Do
- Use tokens from `app/globals.css` and `lib/motion.ts`; add a missing one there with a name, not a literal in the component.
- Give every pressable the ink ledge and the press; give nothing else a ledge.
- Show every state: rest, hover, pressed, focus, disabled; loading (the character waits, < 150 ms), empty, error, crisis overlay.
- Check both languages at 390 px and 1280 px with `npm run ui-check`.
- Keep one hero moment per screen; on the parent screen it is the house lighting up.

### Don't
- No coins, gems, hearts, HP, streak flames, shop, leaderboards, confetti rain, "come back" nudges.
- No Duolingo cues: flat vector fills, a ledge in a darker shade of the fill, owl-green, a guilt-tripping mascot.
- No purple or neon gradients, gradient text, glassmorphism, bento grids, landing-page heroes.
- No GSAP, Three.js, Lottie or other new animation dependencies: framer-motion + CSS cover it.
- No emoji in the UI; icons are inline SVG.
- No red for wrong answers, no shaking inputs, no timers on answers.
- No text baked into images (both languages must work).
- No pure black, no pure white page background, no grey shadows.
- No looping UI motion (pulses, shimmer); only characters idle.
