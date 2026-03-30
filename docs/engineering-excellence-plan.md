# Engineering Excellence & Premium DX Plan

> **Status**: Proposed
> **Date**: 2026-03-30
> **Author**: Antigravity

This plan outlines the steps to transform Recordly from a functional prototype to a professional, high-performance, and developer-friendly codebase, strictly adhering to the established **Feature-Based Architecture (FBA)**, **Sandi Metz Rules**, and **Hexagonal Architecture**.

---

## 1. Project Infrastructure (The "Speed" Layer)

### 1.1 Package Manager Migration (`npm` -> `pnpm`)
Current `npm` is slow and lacks efficient workspace management.
- **Action**: Migrate to **pnpm** for strict dependency management, faster installs, and better disk space usage via the content-addressable store.
- **Action**: Implement **pnpm-workspace.yaml** if we decide to split native helpers into local packages.

### 1.2 Tooling Optimization
- **Action**: Enhance **Biome** configuration to be stricter on architectural violations (e.g., custom regex checks for imports).
- **Action**: Set up **Husky** and **lint-staged** to ensure no code violates Sandi Metz rules before hitting the repo.

## 2. Architectural Integrity (The "Professional" Foundation)

### 1.1 Decomposition of Monoliths
Current components like `LaunchWindow.tsx` (>1100 lines) and `CaptionSettingsPanel.tsx` (>400 lines) violate Rule 1.1 (<100 lines).
- **Action**: Break `LaunchWindow` into focused sub-components:
    - `HudBar`: The main draggable container.
    - `RecordingControls`: Start/Stop/Pause logic.
    - `SourceSelectorButton`: The trigger and source indicator.
    - `UpdateBadge`: Versioning and update logic.
- **Action**: Move orchestration logic into `useLaunchWindow` or feature services.

### 1.2 Strict Enforcement of Ports & Adapters
Dependencies often leak between layers.
- **Action**: Audit `src/features/*/adapters` to ensure they only depend on `ports` and `domain`.
- **Action**: Ensure `App.tsx` or a dedicated `CompositionRoot.tsx` handles all DI (Dependency Injection), removing adapter instantiations from components.

---

## 2. Elevating DX (The "Excellent" Experience)

### 2.1 Strict Typing & Elimination of `any`
- **Action**: Replace `any` in `CursorSettingsPanel` and `CaptionSettingsPanel` with proper interfaces.
- **Action**: Implement **Zod** or similar for runtime validation of IPC messages and storage data.

### 2.2 Standardized Feature Scaffolding
- **Action**: Refine the `/scaffold-feature` workflow to ensure every new feature includes:
    - `domain/entities`
    - `domain/ports`
    - `adapters/`
    - `services/` (Use Cases)
    - `index.ts` (Explicit Barrel Export)

---

## 3. Premium Aesthetics (The "WOW" Factor)

### 3.1 Unified Design System
The app uses a mix of Tailwind and CSS modules.
- **Action**: Consolidate into a `shared/components/ui` library based on **Radix UI** and **Tailwind**.
- **Action**: Define a core set of "Premium" animations/transitions in `shared/lib/motion.ts` (e.g., standard spring configurations, fade-in-scale enter/exit).

### 3.2 Micro-interactions
- **Action**: Add hover-sensitive glassmorphism effects to all HUD elements.
- **Action**: Implement "Active State" visual feedback for recording (vibrant pulsing, subtle glow).

---

## 4. Implementation phases

| Phase | Focus | Key Deliverables |
|---|---|---|
| **Phase 0** | **Infrastructure** | Migrate to `pnpm`, Setup Husky/lint-staged, Refine Build Scripts. |
| **Phase 1** | **Code Hygiene** | Break down `LaunchWindow`, Fix `any` types, Enforce 100-line rule. |
| **Phase 2** | **Infrastructure** | Standardize DI in `App.tsx`, Refine Feature Entry Points. |
| **Phase 3** | **Premium UX** | Unify styling, Polish animations, Standardize `shared/ui`. |

---

## 5. Immediate Next Steps

1. **Refactor `LaunchWindow.tsx`**: This is the highest impact change for DX and maintainability.
2. **Audit `shared/components`**: Clean up unused or inconsistent components.
3. **Update `rules.md`**: Add automated checking where possible (e.g., Biome rules for line count).

---

> [!IMPORTANT]
> To achieve "Premium" status, every pixel must feel intentional. This requires removing "magic strings" for colors and using the centralized theme tokens exclusively.
