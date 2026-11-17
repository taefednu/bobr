---
name: prevent-css-centering-animation
description: "Prevention: CSS animation overriding element centering transform. Check when implementing spinning rings or floating elements with absolute positioning."
allowed-tools:
  - Read
---

# Prevent: CSS Animation vs Centering Transform Conflict

## Bug class

Two related bugs that appear when combining `position: absolute` centering with CSS animations:

### Bug 1 — Spinning ring misalignment
Element uses `position:absolute; top:50%; left:50%` for centering.
CSS keyframe only has `translate(-50%,-50%)` in the `to` frame.
Result: element starts at top-left of container, jumps to center at animation end.

**Wrong:**
```css
@keyframes spin {
  to { transform: translate(-50%,-50%) rotate(360deg); }
}
```

**Correct — translate in BOTH from AND to:**
```css
@keyframes spin {
  from { transform: translate(-50%,-50%) rotate(0deg); }
  to   { transform: translate(-50%,-50%) rotate(360deg); }
}
```

### Bug 2 — Float animation breaks absolute positioning
Element uses `position:absolute; top:50%; left:50%; transform:translate(-50%,-50%)` for centering.
A float animation sets `transform: translateY(...)` — this OVERRIDES the centering transform.
Result: element flies to top-left when animation plays.

**Wrong:**
```tsx
// Position by absolute+transform:
charStyle = { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }
// + animation: "float 3s infinite" where float sets translateY() — BREAKS CENTERING
```

**Correct — use flex centering for the floating element:**
```tsx
// Parent is flex container:
orbWrapStyle = { position: "relative", width: 220, height: 220, display: "flex", alignItems: "center", justifyContent: "center" }
// Child is a flex item (NOT absolutely positioned):
charStyle = { position: "relative", zIndex: 2, flexShrink: 0 }
// Float animation only uses translateY — no conflict:
// @keyframes float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-14px) } }
```

## Summary rule

- **Spinning ring** (`position:absolute` + rotation): always include `translate(-50%,-50%)` in EVERY keyframe.
- **Floating element** (animation sets translateY): center it with flexbox on parent, NOT with absolute+transform on the element itself.

## Trigger

Apply when: implementing concentric spinning rings, floating/bobbing characters, or any element that combines CSS centering with a keyframe animation.
