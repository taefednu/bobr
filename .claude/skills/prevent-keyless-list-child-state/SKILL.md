---
name: prevent-keyless-list-child-state
description: "Prevention: a parent renders a step/task/slide child without a key, so React reuses one instance across items — useState initialisers and mount-only effects never re-run, and item N shows item N-1's state. Auto-check before seeding state from a prop, or writing a mount-only effect, in a component rendered per step/item."
allowed-tools:
  - Grep
  - Read
---

# Prevent: per-item child state when the parent renders it without a key

## Bug class

A parent walks through items — wizard steps, mission tasks, carousel slides —
and renders one child at a time:

```tsx
<TaskRenderer task={content[step]} answer={answers[step]} onAnswer={...} />
```

No `key`. When `step` changes and the child's element type stays the same, React
**reconciles it as the same instance**. State survives. Therefore:

- `useState(initialFromProp)` runs **once, ever** — the initialiser is ignored on
  every later item
- `useEffect(..., [])` fires once — every item after the first is skipped

Two bugs from one root, seen together in one file:

- a task ignored its saved `answer`, so returning to it reset the child's work
- the "obvious" fix — seed `useState` from `answer` — would have introduced a
  *worse* bug: two consecutive tasks of the same type share the instance, so
  task 2 would open showing task 1's answers

## Detection

```bash
# per-item render with no key
grep -nE "<[A-Z][A-Za-z]*(Renderer|Task|Step|Slide)?[^>]*\b(step|index|idx|current)\b" src/**/*.tsx | grep -v "key="

# state seeded from a prop (the thing that silently stops working)
grep -nE "useState\([^)]*\b(answer|value|initial|defaultValue)\b" src/**/*.tsx
```

Then read the parent: is the child rendered inside a `.map` with a `key`, or as a
single element chosen by an index?

## Fix pattern

**Preferred — make the child controlled.** No local state at all; render from the
prop, report through the callback. Immune to the whole class, and usually the
idiom the sibling components already use:

```tsx
const order = answer && answer.length === items.length ? answer : defaultOrder;
function move(...) { onAnswer(next); }   // no setState
```

Add a shape guard (`length ===`) so a stored value from older content cannot
desync the render.

**If local state is genuinely needed**, give the child a key so each item gets a
fresh instance:

```tsx
<TaskRenderer key={step} ... />
```

**If an effect must run per item**, key it on the item, not on mount:

```tsx
useEffect(() => { ... }, [task]);   // not []
```

## Trigger

Apply when: seeding state from a prop; writing a mount-only effect in a component
rendered per step/item; or fixing a "resume loses my input" / "shows the previous
item's data" report.
