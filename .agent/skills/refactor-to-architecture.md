---
name: refactor-to-architecture
description: >
  A step-by-step guide to refactoring a legacy "Big File" (oversized component/hook)
  into the FBA + Onion + Hexagonal architecture. Use this skill when you encounter
  a file that violates Sandi Metz rules or layers concerns improperly.
---

# Refactor to Architecture Skill

## The Goal
Transform a single feature file (e.g., `src/components/Timeline.tsx`) into a structured feature directory (`src/features/timeline/`) following the Recordly standards.

---

## Step 1 — The Extraction Sequence

Do NOT try to do everything at once. Follow this specific order to keep the app working:

1.  **Extract Constants & Types**: Move magic numbers and interface definitions to `types.ts` or `constants.ts`.
2.  **Extract Domain Entities**: Identify the "Core Truth" and move it to `domain/entities/`.
    *   *Skill:* `extract-domain-entity`
3.  **Define Ports**: Identify external side-effects (IPC, API, Storage) and wrap them in interfaces.
    *   *Skill:* `define-port`
4.  **Implement Adapters**: Create the concrete implementation for those ports.
5.  **Write Use Cases**: Move orchestration logic (the "steps") out of the UI/Hook and into `services/`.
    *   *Skill:* `write-use-case`
6.  **Create the Feature Hook**: Bridge the services to React state.
7.  **Refactor the Component**: Shrink the component down to purely presentational code.
    *   *Skill:* `code-readability` (Sandi Metz check)

---

## Step 2 — Practical Example: The "Big Component"

### Before Refactoring
`src/components/AudioEditor.tsx` (150 lines)
*   Handles IPC calls to save audio.
*   Calculates waveform peaks (logic).
*   Manages state for selection.
*   Renders complex UI.

### During Refactoring

**1. Create the directory:**
```bash
mkdir -p src/features/audio-editor/{domain/{entities,ports},services,adapters,components,hooks}
```

**2. Extract Logic to Domain:**
Move the waveform peak calculation to `domain/entities/AudioTrack.ts` as a pure function.

**3. Define the Port:**
Create `domain/ports/AudioStorage.ts` to handle the "Save" action.

**4. Create the Service:**
Create `services/SaveAudioUseCase.ts` that takes the `AudioStorage` port and handles the "Save" workflow.

**5. Create the Hook:**
Create `hooks/useAudioEditor.ts` to call the service and manage UI selection state.

---

## Step 3 — Sandi Metz "Shrinkage" Strategy

If a component is > 100 lines after extracting logic:

1.  **Extract Sub-Components**: If the JSX has many branches or distinct sections (Header, List, Footer), move them to `features/audio-editor/components/`.
2.  **Extract UI Logic to Hooks**: If there's complex "if this then that" UI logic, move it to a dedicated hook.
3.  **Use the Facade Pattern**: If the component is injecting 5 different hooks, use a Facade.
    *   *Skill:* `implement-facade`

---

## Step 4 — Verification

Once refactored, the original file path should either be deleted or become a thin wrapper that points to the new feature:

```tsx
// src/components/AudioEditor.tsx (Legacy shim)
import { AudioEditorFeature } from '@/features/audio-editor';

export const AudioEditor = AudioEditorFeature;
```

*Note: Ideally, update all imports to point directly to `@/features/audio-editor`.*

---

## Checklist for Refactoring

- [ ] I didn't break functionality (Run tests frequently).
- [ ] No business logic (math, validation, state rules) is left in the component.
- [ ] Every IPC/API call is now behind a Port/Adapter.
- [ ] The new component is under 100 lines.
- [ ] No function in the new feature is > 5 lines.
- [ ] Types are shared via `@/features/x/index.ts`.
