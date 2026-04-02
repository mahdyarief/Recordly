# Implementation Plan: Select Area/Region Recording (✅ Implemented)

This document outlines the implementation of the "Select Area/Region Recording" feature in Recordly. It allows users to record a specific portion of their screen with precise coordinate selection and native-level performance.

## 1. Core Architecture Changes (Finalized)

The feature uses a multi-monitor transparent overlay for selection and communicates the region to both the browser-based recorder (fallback) and the native capture engine (primary).

### IPC Interface
- `open-area-selector`: (Implemented) Opens a transparent, full-screen `BrowserWindow` spanning all monitors for region selection.
- `get-selected-area`: (Implemented) Retrieves the currently active bounds in global DIP coordinates.
- `set-selected-area`: (Implemented) Persists selection and updates the HUD state.
- `cancel-area-selector`: (Implemented) Closes the selector and reverts the source.

## 2. Implementation Details

### Phase 1: Area Selection UI (✅ Complete)
- **`AreaSelector` Component**: Located in `src/components/launch/AreaSelector.tsx`.
  - Implements a canvas-based rectangular selection tool.
  - Supports click-and-drag creation and moving of existing selections.
  - Provides real-time dimension labels and a "Record Area" action button.
- **Window Management**: `electron/windows.ts` contains `createAreaSelectorWindow`. 
  - The window is configured to be transparent, frameless, and always-on-top.
  - It uses `totalBounds` to span all connected displays simultaneously.

### Phase 2: Source Selection Integration (✅ Complete)
- **`SourceSelector.tsx`**: Updated with an "Area" mode toggle and a "Select Area" trigger.
- **`LaunchWindow.tsx`**: 
  - Reflects `"area:custom"` in the recording HUD.
  - Added a "Quick Switcher" in the recording dropdown to toggle between "Full" and "Area" modes.

### Phase 3: Recording Logic (✅ Complete)
- **Native Recording (Windows - `wgc-capture`)**:
  - `main.cpp` was updated to accept `cropX`, `cropY`, `cropW`, and `cropH` parameters via JSON config.
  - **DPI-Aware Scaling**: The `handlers.ts` IPC layer scales the DIP (Display Independent Pixel) selection to raw monitor pixels using the target display's `scaleFactor`.
  - **H.264 Alignment**: The native engine automatically aligns crop dimensions to even numbers to satisfy encoder requirements.
- **Browser-based Fallback**:
  - `useScreenRecorder.ts` implements a hidden `<canvas>` crop fallback.
  - It also includes DPI-aware coordinate translation for accurate cropping during browser capture.

## 3. User Experience & Multi-Monitor support

### Interactive Highlighting
- **`AreaHighlight.tsx`**: A subtle, pulsed blue frame appears during the countdown to confirm the recording region.
- **Coordinate Translation**: Implemented a `winX/winY` offset system in the highlight window to ensure the overlay correctly positions itself on secondary monitors with negative coordinate spaces.

### Persistence
- The last selected area is stored in `recordings-settings.json` and restored when the user re-enters area selection mode.

## 4. Technical Achievements
- **Pixel-Perfect Multi-Monitor Selection**: Solved the DIP vs. Pixel mismatch by performing scaling at the IPC bridge before spawning native processes.
- **Performance**: Leveraged `ID3D11DeviceContext::CopySubresourceRegion` for near-zero CPU overhead during native cropping on Windows.
- **Synchronized HUD**: The HUD source state is fully synchronized with the area selection, allowing seamless transitions between full-screen and regional recording.

---
*Last updated: 2026-04-02*
