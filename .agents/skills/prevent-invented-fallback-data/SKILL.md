---
name: prevent-invented-fallback-data
description: "Prevention: UI shows invented fallback values (fake default entity, made-up minutes/XP, ?? magic-estimate) instead of honest empty state or real data. Auto-check when writing `?? t(...)`/`?? <literal>` fallbacks for user-visible data."
allowed-tools:
  - Bash
  - Grep
---

# Prevent: Invented Fallback Data

## Bug class
User-visible values that are *fabricated* when real data is missing:
- fake default entity in i18n (`hero.defaultProjectName: "Введение в ИИ"` shown when user has no project)
- made-up quantities (`t("finishFallback") = "~5 мин"`, `duration or 10`, `xp ?? (100-progress)*0.5`)
- same fact rendered from two different sources (greeting name from `dashboard.student_name`, sidebar from `preferred_name` chain → user sees two names)

Users read all of these as "захардкожено" — even though every literal lives in i18n/seed.
Session 94: 4 instances survived a "0 must-fix" hardcode sweep because the sweep only
greps literals, not fabricated semantics.

## Detection
```bash
# user-visible ?? fallbacks onto literals / t() defaults
grep -nE '\?\?\s*t\(|\?\?\s*["'\''`][^"'\''`]+["'\''`]|\|\|\s*[0-9]+\b' src/**/*.tsx
# backend: `or <number>` in aggregation of user-visible quantities
grep -nE 'or [0-9]+\b' app/domains/**/*.py
```
For each hit ask: **if the data is missing, is the shown value TRUE?**
- true neutral label ("Проект") — OK
- invented entity/quantity — defect

## Fix pattern
- No data → honest empty state (`hero.noProject.*` + hide progress/chips), not a fake sample.
- Quantities: render only when the backend really returned them (`!= null && > 0`); never estimate inline.
- One fact = one source: resolve display name/value once (App-level const), pass down as prop.

## Trigger
Apply when: adding any `??`/`||` fallback for data rendered to the user; when a card shows
numbers "to motivate" (time left, reward); when the same fact appears in two components.
