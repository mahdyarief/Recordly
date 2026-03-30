# Codebase Restructuring Plan Status

> **Status**: In Progress (Phases 0-4 Complete, Phase 5-6 Partial)
> **Last Status Check**: 2026-03-30

## Phase Overview

| Phase | Description | Status | Note |
|---|---|---|---|
| **Phase 0** | Setup Directory Structure | ✅ Done | Directory foundations created for all features. |
| **Phase 1** | Shared Infrastructure | ✅ Done | UI primitives and pure libraries successfully moved. |
| **Phase 2** | `project` Feature | ✅ Done | Project domain entities and re-exporters established. IPC adapters created. |
| **Phase 3** | `captions` Feature | ✅ Done | Extracted `CaptionSettingsPanel`, moved domain logic, and integrated into `SettingsPanel.tsx`. |
| **Phase 4** | `exporter` Feature | ✅ Done | Refactored `FrameRenderer` into `FrameLayout` domain entity and `CanvasFrameRendererAdapter`. Moved all logic to feature-based architecture. |
| **Phase 5** | `recording` Feature | ✅ Done | Modularized `useRecorder` hook, integrated countdown ticks, and supported native pause/resume. |
| **Phase 6** | `editor` Feature | ✅ Done | **Phase 6.8 Complete: Finalized refactoring, integrated hooks, and verified orchestrations.** |
| Phase 7: Cleanup & Final Audit | 100% | Done: Removed all legacy components, fixed imports. |

---

## Technical Audit (God File Progress)

Monitoring the reduction of monolithic components:

| File | Baseline Count | Current Count | Note |
|---|---|---|---|
| `VideoEditor.tsx` | **~3,800** | **~10** | **Successfully extracted shell to FBA.** |
| `EditorContent.tsx` | **~3,658** | **~1,302** | **Successfully extracted useProjectActions and cleaned up redundant logic.** |
| `TimelineEditor.tsx` | **~2,400** | **~2,304** | Successfully relocated to FBA. |
| `SettingsPanel.tsx` | **~1,940** | **~842** | **Full modularization: extracted cursor logic to hooks/lib.** |
| `VideoPlayback.tsx` | **~1,700** | **~1,450** | **Successfully relocated to FBA.** |
| `useScreenRecorder.ts` | **~1,129** | **~1,129** | Extraction of state machine pending. |

---

## Infrastructure Extraction Status (IPC Migration)

Objective: Move all `window.electronAPI` calls to adapters.

- **Current Count in `src/`**: 175
- **New Adapters Implemented**:
  - `src/features/project/adapters/ElectronProjectStorageAdapter.ts`
  - `src/features/project/adapters/LocalStorageEditorPreferencesAdapter.ts`
  - `src/features/recording/adapters/ElectronRecordingAdapter.ts`
  - `src/features/captions/adapters/WhisperCaptionGeneratorAdapter.ts`

---

## Recent Stability Fixes (Mar 29-30)
- **Editor State Centralization**: Migrated export state to `EditorContext.tsx` to decentralize `EditorContent.tsx`.
- **Type Safety Development**: Updated `EditorContextType` to support functional state updates and nullable preference types.
- **Path Normalization**: Stabilized imports in `VideoPlayback.tsx` and `EditorContent.tsx` using absolute `@/` aliases.
- **Circular Dependencies**: Fixed in `src/features/project/domain/constants.ts`.
- **Type Ambiguity**: Resolved `CaptionWordState` export collision in `captions/index.ts`.
- **Legacy Compatibility**: Updated `src/components/video-editor/types.ts` to re-export moved entities, preventing breaks in unmigrated code.

## Observed Anomalies
- Top-level `src/features/timeline` exists as a separate feature, differing slightly from the original "Editor subset" plan. This effectively accelerates Phase 6.2.
- `src/features/recorder` is redundant; all active development should focus on `src/features/recording`.
