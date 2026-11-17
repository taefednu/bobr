# Product

## Register

product

## Users

Children aged 11–12 in 5th grade in Uzbekistan who struggle with fractions. They use the app in Uzbek (Latin script) or Russian, on a school laptop or a parent's phone, usually after school or before a test.
Parents check progress from their own screen. They see a summary of what the child learned, never the chat itself.

The job: find the real gap in fractions (often in an earlier grade's topic), close it, and get ready for a specific test date.

## Product Purpose

Bobr is an AI math tutor for fractions, built for the Ministry of Education track "find knowledge gaps and build an individual path".
The child does not level up their own account. They teach Bobr, a teenage beaver who is sweet and hopelessly dim. Ustoz, a Humo bird, guides the child with questions and never gives the answer away.
Progress is a mahalla (Uzbek neighbourhood): each topic is a house that goes from empty, to scaffold, to built, to alive (the child taught Bobr), and dims if not revisited for 7 days.

Success: the child solves 3 tasks in a row without hints, then explains the idea well enough that Bobr solves one too. The parent's house lights up on their own screen at that same moment.

## Brand Personality

Warm, funny, patient. Three words: **cozy, curious, alive**.
Bobr is the comic relief, clumsy and proud of every small win. Ustoz is calm and a little wry. The child is the smart one in the room.
Emotional goal: "I'm the one who gets it": confidence, not reward-chasing.

## Anti-references

- Duolingo: flat vector, thick outlines, an owl that guilt-trips, streak anxiety, push-notification nagging.
- Gamified stores: coins, gems, HP, shops, loot boxes, leaderboards.
- Babyish edtech: primary-colour rainbow, Comic Sans energy, cartoon clip-art, talking down.
- Generic AI SaaS: purple gradients, glassmorphism dashboards, bento grids, centered hero with gradient text.
- Characters that claim to be alive, say they missed the child, or ask them not to leave.

## Design Principles

1. **The child teaches, the beaver learns.** Bobr's confusion and delight are the main feedback; UI chrome stays quiet.
2. **Code decides, characters speak.** Numbers, answers and verdicts look certain and stable; only the characters wobble.
3. **The mahalla is the progress bar.** Progress is shown as a place that comes alive, never as points.
4. **One thing per screen.** One task, one action, one hero moment.
5. **Honest AI.** The "Bobr is an AI and can make mistakes" badge is always visible and never styled away.

## Accessibility & Inclusion

Proposed, not yet confirmed by the owner:
- WCAG 2.2 AA contrast for all text, including text on illustrated backgrounds.
- Touch targets ≥ 44 px; works with a laptop touchpad and on a 390 px phone.
- `prefers-reduced-motion` respected: characters stop idling, transitions become instant, information stays.
- Two scripts at equal quality: Uzbek Latin with correct `oʻ gʻ` (U+02BB) and Russian Cyrillic. Layouts must survive the longer of the two strings, not the Russian one.
- No colour-only state: house states and answer states also carry a shape or icon and a label.
- No time pressure on answers; the chat has strict daily limits and a night lock (21:00–07:00).
