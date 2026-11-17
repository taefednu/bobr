---
name: Bobr
description: Cozy 2.5D mahalla where a child teaches a beaver fractions. v0, awaiting the owner's review
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
  button-primary-hover:
    backgroundColor: "{colors.lazuli-deep}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "14px 24px"
    height: "52px"
  answer-input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.numeral}"
    rounded: "{rounded.md}"
    height: "72px"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "24px"
  ai-badge:
    backgroundColor: "{colors.clay-100}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
---

# Design System: Bobr

Source of truth for how Bobr looks. It is v0: the owner has not approved the palette and fonts yet.
Order of precedence: `docs/BOBR_SPEC.md` → `PRODUCT.md` → this file → `lib/motion.ts` → any design
skill. Runtime tokens live in `app/globals.css` under the same names. The living sheet is `/dev/styleguide`.

## 1. Overview

A warm evening in a mahalla. Sun-baked clay walls, lazuli-blue tiles from Samarkand, apricots, and
non bread fresh from the tandir. Houses light up as topics are learned. The world is 2.5D: soft volume
and one warm key light from the top left, like a clay diorama under a lamp. It is not flat vector, and it
is not a glossy 3D game.

Characters carry the emotion. Bobr is a PNG-posed beaver who idles, blinks and reacts; Ustoz is the
Humo bird. The UI around them is calm, stays put, and reads well at 11 years old.

## 2. Colors: The Mahalla Palette

OKLCH is canonical (`app/globals.css`); the hex values above are the sRGB equivalents.

### Primary
- **lazuli** `oklch(50% 0.115 245)`: primary actions, focus, Ustoz's accents. Paper text on it is 5.8:1.
- **lazuli-deep** `oklch(40% 0.10 250)`: hover and pressed.

### Secondary
- **apricot** `oklch(78% 0.14 62)`: Bobr's warmth, highlights, "you taught Bobr" moments. Ink text only (7.4:1).
- **non** `oklch(70% 0.12 68)`: bread crust; the fraction pie's base and rim.

### Tertiary
- **tile** `oklch(68% 0.11 205)`: tile ornament, the number line, secondary info.
- **lamp** `oklch(86% 0.15 88)`: warm window light of an *alive* house. It is the only "glow" in the product.

### Neutral
- **sand** `oklch(96.5% 0.018 80)`: page background. Never pure white, never grey.
- **paper** `oklch(99% 0.008 85)`: cards and input surfaces.
- **clay-100** `oklch(92% 0.03 70)`: wells, chips, the AI badge.
- **ink** `oklch(27% 0.035 45)`: text. Warm brown-black, never `#000`.
- **ink-muted** `oklch(47% 0.03 50)`: secondary text (6.2:1 on sand).
- **dusk** `oklch(62% 0.03 260)`: *dimmed* houses (≥ 7 days without review).

### State colours (house = topic)
| State | Fill | Also carries |
|---|---|---|
| empty | sand outline | dashed footprint |
| scaffold (gap) | terracotta `oklch(56% 0.14 38)` | wooden scaffold shape |
| built (solved_self) | non + clay | solid walls, dark windows |
| alive (taught_bobr) | non + lamp windows | lit windows, smoke from the tandir |
| dimmed | dusk | closed shutters |

### Named Rules
- **Pie rule.** The six slice colours `pie-1…6` share L 74 % and C 0.12–0.13 and differ only in hue, so no slice looks "more correct". Gradients interpolate `in oklch`.
- **One glow rule.** Only `lamp` glows, and only in alive houses and the moment Bobr gets it right.
- **Alert is rare.** `alert` is for system errors only. A wrong answer is never red: Bobr gets curious, the UI stays neutral.

## 3. Typography

**Unbounded** (display, numbers) + **Onest** (everything else), both self-hosted via `@fontsource-variable`
so the offline demo works. Both have `ʻ` U+02BB, `ʼ` U+02BC and Cyrillic, verified by reading the font
cmaps. Unbounded lacks Uzbek Cyrillic `ғ`, which Bobr does not use.

### Hierarchy
| Role | Font | Size | Weight |
|---|---|---|---|
| display | Unbounded | clamp(28–40 px) | 650 |
| title | Unbounded | 22 px | 600 |
| numeral (fractions, answer input) | Unbounded | 36 px, tabular | 700 |
| body | Onest | 17 px / 1.5 | 450 |
| label, buttons | Onest | 15 px | 600 |

### Named Rules
- **Body never under 16 px.** The readers are 11.
- **Fractions are stacked, not slashed,** in tasks and on the pie: numerator over denominator with a bar. A slashed `3/10` appears only inside running text and in the answer input.
- **Ratio ×1.25.** No sizes outside the table.

## 4. Elevation

A clay diorama: one key light from the top left (−45°), so highlights sit top-left and shadows fall
bottom-right. Shadows are tinted with ink hue, never neutral grey.

### Shadow Vocabulary
| Token | Value | Use |
|---|---|---|
| `--shadow-rest` | `0 1px 0 oklch(100% 0 0 / .7) inset, 0 6px 16px -8px oklch(27% .035 45 / .25)` | cards, inputs |
| `--shadow-lift` | `0 1px 0 oklch(100% 0 0 / .7) inset, 0 14px 28px -12px oklch(27% .035 45 / .30)` | hover (mouse only), dragged pie slice |
| `--shadow-press` | `0 1px 0 oklch(100% 0 0 / .5) inset, 0 3px 8px -6px oklch(27% .035 45 / .30)` | pressed |
| `--shadow-clay` | `inset 0 2px 0 oklch(100% 0 0 / .45), inset 0 -3px 0 oklch(27% .035 45 / .12)` | volume on buttons and slices |

### Named Rules
- **Volume, not ledge.** Depth comes from a soft inner highlight and a tinted drop shadow. A hard 4 px darker bottom border is the Duolingo button. Do not use it.
- **No glassmorphism, no blur panels.** Clay is opaque.

## 5. Components

Motion values come only from `lib/motion.ts` (`useMotion()`); rules are in skill `bobr-animation`.

### Buttons
Pill, 52 px tall (≥ 44 px target), `--shadow-clay` + `--shadow-rest`. Press: `TARGETS.pressScale` with
`TRANSITIONS.press` and `--shadow-press`. Hover lift only under `(hover: hover)`. One primary per screen.
Answer buttons and intents from LLM buttons look the same; the label is the only difference.

### Cards / Containers
Paper on sand, `rounded.lg`, `--shadow-rest`. Cards appear from `TARGETS.appearFromScale` (0.9), never
from 0. No card inside a card.

### Inputs / Fields
The answer input is the hero of a task: 72 px tall, numeral typography, centered. Wrong answer: the
input does not shake or turn red. It stays neutral and Bobr reacts. Focus: 3 px lazuli ring with 2 px offset.

### Navigation
No nav bar inside a lesson. The mahalla map is home; one back affordance top-left.

### Domain components
- **Pie (Лепёшка):** a round non bread in 2.5D (slight top-down tilt, rim from `non`), slices in `pie-1…6`, 2 px paper gap between slices. A slice pops out with `TRANSITIONS.pop`; values change with `TRANSITIONS.count`, no overshoot.
- **Strip (Полоска):** a tiled bar like a mosaic band, `tile` grout lines, cells `rounded.sm`.
- **Number line (Прямая):** an ink line on sand, ticks in `ink-muted`, the point is a lazuli bead that springs (`TRANSITIONS.move`).
- **House:** five states from the table in §2; each state change is the one animated moment on the map.
- **AI badge:** always visible, `ai-badge` tokens, never hidden behind a menu, never animated.
- **Characters:** PNG poses with transparent backgrounds, see skill `bobr-animation`. They float and blink; UI never does.

## 6. Do's and Don'ts

### Do
- Use tokens from `app/globals.css`; add a missing one there with a name, not a hex in the component.
- Show every state: loading (the character waits, < 150 ms), empty, error, crisis overlay.
- Check both languages at 390 px and 1280 px with `npm run ui-check`.
- Keep one hero moment per screen; on the parent screen it is the house lighting up.

### Don't
- No coins, gems, hearts, HP, streak flames, shop, leaderboards, confetti rain, "come back" nudges.
- No Duolingo cues: flat vector, thick outlines, ledge buttons, owl-green.
- No purple or neon gradients, gradient text, glassmorphism, bento grids, landing-page heroes.
- No GSAP, Three.js, Lottie or other new animation dependencies: framer-motion + CSS cover it.
- No emoji in the UI; icons are inline SVG.
- No red for wrong answers, no shaking inputs, no timers on answers.
- No text baked into images (both languages must work).
- No pure black, no pure white page background, no grey shadows.
