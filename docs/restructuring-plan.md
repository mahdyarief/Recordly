# Recordly Codebase Restructuring Plan

> **Status**: Proposed
> **Date**: 2026-03-29
> **Author**: Agent

## Context

The current codebase has grown organically into a flat component-dump structure.
Key files violate Sandi Metz rules by large margins (`VideoEditor.tsx` at ~3,800 lines,
`TimelineEditor.tsx` at ~2,400 lines, `useScreenRecorder.ts` at 1,129 lines).
There are no feature boundaries, no port/adapter separation, and infrastructure code
(`window.electronAPI`) is called directly inside hooks and components.

This plan migrates the codebase to **Feature-Based Architecture (FBA)** with
**Onion** and **Hexagonal (Ports & Adapters)** layers, following the rules in
`.agent/rules.md`.

## Decision / Plan

Migration is designed so the app **builds and runs after every phase**.

---

### Current State — Critical Violations

| File | Size | Primary Violation |
|---|---|---|
| `VideoEditor.tsx` | **~3,800 lines** | God component: state, business logic, UI, IPC all mixed |
| `SettingsPanel.tsx` | **~2,200 lines** | 22× over the 100-line limit |
| `TimelineEditor.tsx` | **~2,400 lines** | 24× over the limit |
| `VideoPlayback.tsx` | **~1,700 lines** | Rendering engine mixed with React state |
| `useScreenRecorder.ts` | **1,129 lines** | Hook contains infra adapters, domain logic, and IPC |
| `projectPersistence.ts` | **719 lines** | Domain logic mixed with serialization |
| `electron/ipc/handlers.ts` | **4,500+ lines** | Entire backend in one file |
| `lib/exporter/frameRenderer.ts` | **1,400+ lines** | Rendering engine + domain + infra |

---

### Target Architecture

```
src/
  features/
    recorder/     # Screen recording & webcam
    editor/       # Video editor (timeline, playback, settings)
    exporter/     # Video/GIF rendering pipeline
    captions/     # Auto-caption generation & display
    project/      # Project persistence & preferences
  shared/
    components/ui/
    domain/
    ports/
    adapters/
    lib/
  App.tsx         # Window router (already clean ✅)
```

---

### Phase 0 — Setup (1–2h, no risk)

```bash
mkdir -p src/features/{recorder,editor,exporter,captions,project}/{domain/{entities,value-objects,errors,ports},services,adapters,components,hooks,store}
mkdir -p src/shared/{components/ui,domain,ports,adapters,lib}
touch src/features/{recorder,editor,exporter,captions,project}/{types.ts,index.ts}
```

Create `src/shared/ports/ElectronApiPort.ts` as an empty interface stub.

---

### Phase 1 — Shared Infrastructure (2–4h, low risk)

**Move UI primitives:**
- `src/components/ui/` → `src/shared/components/ui/`

**Move pure utilities:**

| Current | New |
|---|---|
| `src/utils/aspectRatioUtils.ts` | `src/shared/lib/aspectRatio.ts` |
| `src/utils/audioWaveform.ts` | `src/shared/lib/audioWaveform.ts` |
| `src/utils/platformUtils.ts` | `src/shared/lib/platform.ts` |
| `src/lib/mediaTiming.ts` | `src/shared/lib/mediaTiming.ts` |
| `src/lib/geometry/squircle.ts` | `src/shared/lib/squircle.ts` |
| `src/lib/assetPath.ts` | `src/shared/lib/assetPath.ts` |
| `src/lib/shortcuts.ts` | `src/shared/lib/shortcuts.ts` |
| `src/lib/wallpapers.ts` | `src/shared/lib/wallpapers.ts` |
| `src/lib/customFonts.ts` | `src/shared/lib/customFonts.ts` |

**Move contexts:**
- `src/contexts/I18nContext.tsx` → `src/shared/adapters/I18nProvider.tsx`
- `src/contexts/ShortcutsContext.tsx` → `src/shared/adapters/ShortcutsProvider.tsx`

✅ **Build & Test**

---

### Phase 2 — `project` Feature (4–6h, low-medium risk)

**Split `types.ts` (366 lines) into domain entities:**

| Type | New File |
|---|---|
| `ZoomRegion`, `ZoomDepth`, `ZoomFocus` | `domain/entities/ZoomRegion.ts` |
| `TrimRegion` | `domain/entities/TrimRegion.ts` |
| `SpeedRegion` | `domain/entities/SpeedRegion.ts` |
| `AudioRegion` | `domain/entities/AudioRegion.ts` |
| `AnnotationRegion` + sub-types | `domain/entities/AnnotationRegion.ts` |
| `CaptionCue`, `CaptionCueWord` | `domain/entities/CaptionCue.ts` |
| `WebcamOverlaySettings` | `domain/entities/WebcamOverlay.ts` |
| `CursorVisualSettings`, `CursorStyle` | `domain/entities/CursorSettings.ts` |
| All `DEFAULT_*` constants | `domain/constants.ts` |

**Split `projectPersistence.ts` (719 lines):**

| What | Where |
|---|---|
| `ProjectEditorState` | `domain/entities/ProjectState.ts` |
| `normalizeProjectEditor()` | `domain/entities/ProjectState.ts` (pure) |
| `validateProjectData()` | `domain/entities/ProjectData.ts` (pure) |
| `toFileUrl()`, `fromFileUrl()` | `src/shared/lib/fileUrl.ts` |
| `deriveNextId()` | `src/shared/lib/idUtils.ts` |
| `createProjectData()` | `services/CreateProjectService.ts` |

**Add Port + Adapter:**
```
domain/ports/ProjectStoragePort.ts
adapters/ElectronProjectStorageAdapter.ts
```

**Split `editorPreferences.ts` (278 lines):**
- `domain/entities/EditorPreferences.ts` — types + normalizer (pure)
- `adapters/LocalStoragePreferencesAdapter.ts` — load/save
- `services/EditorPreferencesService.ts` — orchestration

✅ **Build & Test**

---

### Phase 3 — `captions` Feature (3–5h, low-medium risk)

Move domain files:
- `autoCaptionSource.ts` → `domain/entities/CaptionSource.ts`
- `captionStyle.ts` → `domain/entities/CaptionStyle.ts`
- `captionLayout.ts` → `domain/entities/CaptionLayout.ts`

Create:
- `domain/ports/WhisperPort.ts` — transcribe interface
- `adapters/ElectronWhisperAdapter.ts`
- `services/GenerateCaptionsUseCase.ts`
- `components/CaptionSettingsPanel.tsx` (split from `SettingsPanel.tsx`)

✅ **Build & Test**

---

### Phase 4 — `exporter` Feature (6–8h, medium risk)

Move `src/lib/exporter/` → `src/features/exporter/`:

| File | New Location |
|---|---|
| `types.ts` | `domain/entities/ExportSettings.ts` |
| `frameRenderer.ts` (math) | `domain/entities/FrameLayout.ts` |
| `frameRenderer.ts` (canvas) | `adapters/CanvasFrameRendererAdapter.ts` |
| `audioEncoder.ts` | `adapters/WebAudioEncoderAdapter.ts` |
| `videoExporter.ts` | `services/ExportVideoUseCase.ts` |
| `gifExporter.ts` | `services/ExportGifUseCase.ts` |
| `muxer.ts` | `adapters/VideoMuxerAdapter.ts` |
| `streamingDecoder.ts` | `adapters/StreamingDecoderAdapter.ts` |
| `annotationRenderer.ts` | `adapters/AnnotationRendererAdapter.ts` |
| `captionRenderer.ts` | `adapters/CaptionRendererAdapter.ts` |

Move export UI: `ExportDialog.tsx`, `FormatSelector.tsx`, `GifOptionsPanel.tsx` → `components/`

✅ **Build & Test**

---

### Phase 5 — `recorder` Feature (6–10h, medium risk)

**Extract domain from `useScreenRecorder.ts` (1,129 lines):**

| Domain Concept | New File |
|---|---|
| Recording state machine | `domain/entities/RecordingSession.ts` |
| Recording clock | `domain/entities/RecordingClock.ts` |
| Bitrate calculation | `domain/entities/RecordingQuality.ts` |
| MIME type selection | `domain/entities/RecordingFormat.ts` |

**Create ports:**
- `ScreenCapturePort.ts`, `WebcamCapturePort.ts`, `RecordingStoragePort.ts`
- `PermissionsPort.ts`, `CountdownPort.ts`

**Create use cases:**
- `StartRecordingUseCase.ts`, `StopRecordingUseCase.ts`
- `PauseRecordingUseCase.ts`, `PreparePermissionsUseCase.ts`

**Create adapters:**
- `ElectronNativeScreenCaptureAdapter.ts`, `BrowserScreenCaptureAdapter.ts`
- `ElectronRecordingStorageAdapter.ts`, `WebcamRecorderAdapter.ts`

**New hook:** `hooks/useRecorder.ts` (~80 lines — React state only, delegates to use cases)

**Move UI:** `LaunchWindow`, `SourceSelector`, `UpdateToastWindow`, `CountdownOverlay` → `components/`

✅ **Build & Test**

---

### Phase 6 — `editor` Feature (15–25h, high risk)

**Strategy: extract one sub-panel / sub-component at a time. Never rewrite everything at once.**

**6.1 — Extract panels from `SettingsPanel.tsx` (2,200 lines) — do first:**
```
components/panels/
  ZoomSettingsPanel.tsx, CursorSettingsPanel.tsx, BackgroundSettingsPanel.tsx
  WebcamSettingsPanel.tsx, TrimSettingsPanel.tsx, SpeedSettingsPanel.tsx
  AnnotationSettingsPanel.tsx, AudioSettingsPanel.tsx
```
Each panel ≤ 100 lines, all delegate to `useEditorSettings` hook.

**6.2 — Extract `TimelineEditor.tsx` (2,400 lines):**
- Domain types → `domain/entities/TimelineState.ts`, `TimelineItem.ts`
- Zoom suggestions → `domain/entities/ZoomSuggestion.ts`
- Pure render → `components/timeline/TimelineEditor.tsx` (≤100 lines)
- State + actions → `hooks/useTimeline.ts` (~80 lines)

**6.3 — Extract `VideoPlayback.tsx` (1,700 lines):**
- Cursor math → `domain/entities/CursorTransform.ts`
- Zoom transform → `domain/entities/ZoomTransform.ts` (already exists ✅ — just move)
- Decoder/GPU → `adapters/VideoDecoderAdapter.ts`
- Pure render → `components/playback/VideoPlayback.tsx` (≤100 lines)

**6.4 — Extract editor use cases:**
```
services/
  LoadProjectUseCase.ts, SaveProjectUseCase.ts
  AddZoomRegionUseCase.ts, TrimVideoUseCase.ts
  ApplySpeedRegionUseCase.ts, AddAudioRegionUseCase.ts, UndoRedoService.ts
```

**6.5 — Create Editor Facade (final `VideoEditor.tsx` ~50 lines):**
```tsx
export default function VideoEditor() {
  const editor = useEditorFacade();
  return (
    <EditorLayout>
      <VideoPlayback playback={editor.playback} />
      <TimelineEditor timeline={editor.timeline} />
      <EditorSidebar settings={editor.settings} />
    </EditorLayout>
  );
}
```

✅ **Build & Test after each sub-step**

---

### Phase 7 — Final Cleanup (2–3h, low risk)

Delete migrated source directories:
- `src/components/`, `src/hooks/`, `src/contexts/`, `src/lib/`, `src/utils/`

**Audit script:**
```bash
# Files over 100 lines (should return nothing)
find src -name "*.ts" -o -name "*.tsx" | xargs wc -l | awk '$1 > 100' | sort -rn

# IPC calls outside adapters (should return nothing)
grep -r "window.electronAPI" src/features --include="*.ts" --include="*.tsx" | grep -v "/adapters/"
```

✅ **Final build + all tests**

---

### Execution Order

```
Phase 0  Setup                  1–2h,   no risk
Phase 1  Shared infra           2–4h,   low
Phase 2  project feature        4–6h,   low-medium
Phase 3  captions feature       3–5h,   low-medium
Phase 4  exporter feature       6–8h,   medium
Phase 5  recorder feature       6–10h,  medium
Phase 6  editor feature         15–25h, high (sub-steps only)
Phase 7  cleanup                2–3h,   low
────────────────────────────────────────────────
Total estimate:                 39–63 hours
```

---

### Files Already Clean (Do NOT rewrite)

| File | Lines | Note |
|---|---|---|
| `src/App.tsx` | 91 | ✅ Keep as window router |
| `src/components/ui/*` | ≤100 each | ✅ Just move to `shared/` |
| `videoPlayback/zoomTransform.ts` | ~200 | ✅ Pure math — just move |
| `videoPlayback/cursorSway.ts` | 43 | ✅ Already clean |
| `timeline/Row.tsx` | ~50 | ✅ Focused component |
| `contexts/ShortcutsContext.tsx` | 70 | ✅ Just move |
| `lib/exporter/types.ts` | ~70 | ✅ Just move |

## Consequences

- All files will be ≤ 100 lines.
- All functions will be ≤ 5 lines.
- `window.electronAPI` will only appear inside `*/adapters/` directories.
- No feature will import from another feature's internal files.
- All existing tests will continue to pass.
- `pnpm build:win` will continue to succeed at every phase boundary.
