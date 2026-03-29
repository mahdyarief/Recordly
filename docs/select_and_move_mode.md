# Implementation Plan - Select & Move Mode & Selection Awareness

This plan outlines the steps to implement the "Select & Move" modes and time-selection-aware playback, matching the reference implementation in `recordly_dev`.

## User Review Required
Please review the proposed architectural changes. This touches the core of the VideoEditor's event handlers and timeline component interactions.

## Proposed Changes

### 1. Types
#### [MODIFY] [types.ts](file:///d:/Github/Recordly/src/components/video-editor/types.ts)
- Add the `TimeSelection` interface:
  ```ts
  export interface TimeSelection {
    startMs: number;
    endMs: number;
  }
  ```

### 2. Video Editor State & Shortcuts
#### [MODIFY] [VideoEditor.tsx](file:///d:/Github/Recordly/src/components/video-editor/VideoEditor.tsx)
- Introduce `timelineMode` state (`'move' | 'select'`).
- Introduce `timeSelection` state (`TimeSelection | null`).
- Pass the new states down to `TimelineEditor` and `timeSelection` to `VideoPlayback`.
- Add Keyboard shortcuts for 'V' (Move Mode) and 'E' (Select Mode).

### 3. Timeline Interaction & UI
#### [MODIFY] [TimelineEditor.tsx](file:///d:/Github/Recordly/src/components/video-editor/timeline/TimelineEditor.tsx)
- **UI Toggles**: Add toggle buttons for 'Move' (`MousePointer2` icon) and 'Select' (`BoxSelect` icon) in the header.
- **Selection Overlay**: Render a transparent blue `div` representing the current `timeSelection` span across the timeline height.
- **Drag Logic**: Update `handleMouseDown` and `handleTimelineClick` on the timeline body:
  - If `timelineMode === 'select'`, dragging creates and updates the `timeSelection`. Shift+Click extends the selection from the current anchor.
  - If `timelineMode === 'move'`, dragging does not select time.

### 4. Item Dragging Guard
#### [MODIFY] [Item.tsx](file:///d:/Github/Recordly/src/components/video-editor/timeline/Item.tsx)
- Add `timelineMode` to props.
- Disable `dnd-timeline` item dragging if `timelineMode === 'select'`.

### 5. Playback Bounds Awareness
#### [MODIFY] [VideoPlayback.tsx](file:///d:/Github/Recordly/src/components/video-editor/VideoPlayback.tsx)
- Receive `timeSelection` via props.
- Add `timeSelectionRef` and keep it updated via `useEffect`.
- Pass `timeSelectionRef` into `createVideoEventHandlers`.

#### [MODIFY] [videoEventHandlers.ts](file:///d:/Github/Recordly/src/components/video-editor/videoPlayback/videoEventHandlers.ts)
- In `updateTime`, check if `timeSelectionRef.current` exists and the playback is active.
- If `currentTimeMs >= selection.endMs`, automatically pause playback and loop the seek-head back to `selection.startMs`.

## Open Questions

- Should we implement the 'V' and 'E' shortcuts as part of a global shortcuts context, or just localized listeners in the `VideoEditor`? (Assumed: localized to match the reference).

## Verification Plan

### Manual Verification
1. **Mode Toggling**: Click 'Move' and 'Select' toggles, verifying the UI active states.
2. **Timeline Selection**:
   - In **Select mode**, dragging on the timeline track should highlight a blue duration.
   - Using **Shift+Click**, the selection should adapt relative to the anchor point.
3. **Item Dragging**:
   - In **Move mode**, items (zoom, trim, etc.) should be draggable.
   - In **Select mode**, dragging items should instead draw a selection box and not move the item.
4. **Playback Loop**:
   - Draw a selection and press play before the selection ends.
   - Playhead should stop/pause and return to the start of the selection once the boundary is reached.
