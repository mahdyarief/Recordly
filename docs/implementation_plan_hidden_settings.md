# Implementation Plan: Hide Zoom Level & Playback Speed Settings

## Goal
Hide the **Zoom Level** and **Playback Speed** setting panels (currently always visible at the bottom of `SettingsPanel.tsx`) so they **only appear when a zoom or speed track item is selected** on the timeline.

---

## Current Behaviour

In `SettingsPanel.tsx` (lines 2214–2329), the **bottom dock** of the panel always renders two sections:

| Section | Lines | Visibility Logic |
|---|---|---|
| **Zoom Level** | 2215–2275 | Buttons disabled when no zoom selected, but section always visible |
| **Playback Speed** | 2277–2329 | Buttons disabled when no speed selected, but section always visible |

Both sections show a hint text ("Select a region...") when nothing is selected, but the entire UI block is always mounted and visible.

---

## Proposed Changes

### File: `src/components/video-editor/SettingsPanel.tsx`

**Change 1 — Zoom Level section (lines 2215–2275)**

Wrap the entire zoom level block in a conditional: only render when `selectedZoomId` is truthy (i.e., a zoom track item is selected). Remove the hint text and "not enabled" logic since we won't show the section at all when nothing is selected.

- Keep Delete Zoom button inside zoom section (no change)
- Move Delete Trim button to its own small block, visible only when `selectedTrimId` is set and `selectedZoomId` is not

**Change 2 — Playback Speed section (lines 2277–2329)**

Wrap the entire speed block in a conditional: only render when `selectedSpeedId` is truthy. Remove the hint text since the section will be fully hidden when nothing is selected.

**Change 3 — Bottom dock container**

When neither zoom, trim, nor speed is selected, hide the entire bottom dock (`flex-shrink-0 border-t` container) by adding a conditional `hidden` class:

```tsx
className={cn(
  "flex-shrink-0 border-t border-white/10 bg-[#151518] p-4 pt-3",
  !selectedZoomId && !selectedTrimId && !selectedSpeedId && "hidden"
)}
```

---

## Summary of Changes

| What changes | Where | How |
|---|---|---|
| Zoom Level buttons | Bottom dock of `SettingsPanel.tsx` | Only render when `selectedZoomId` is truthy |
| Delete Zoom button | Same | Only render inside the zoom section |
| Delete Trim button | Bottom dock | Move to its own small block, only when `selectedTrimId && !selectedZoomId` |
| Playback Speed buttons | Bottom dock | Only render when `selectedSpeedId` is truthy |
| Bottom dock container | Bottom dock | Hidden entirely when no zoom/trim/speed is selected |

---

## What Does NOT Change

- Timeline track rows in `TimelineEditor.tsx` — untouched
- `selectedZoomId`, `selectedSpeedId`, `selectedTrimId` props — already passed from `VideoEditor.tsx` to `SettingsPanel.tsx`, no new props needed
- Settings panel scrollable body content — untouched
- Zoom transition settings (zoomSectionContent) in the scrollable body — untouched

---

## Files to Edit

| File | Scope |
|---|---|
| `src/components/video-editor/SettingsPanel.tsx` | Lines 2214–2330 (bottom dock conditional rendering) |

No other files need to change. This is a pure UI rendering change with no state, props, or business logic modifications required.
