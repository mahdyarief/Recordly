# Recordly Agent Rules

> These rules govern how ALL code is written, reviewed, and structured in the Recordly codebase.
> They combine **Sandi Metz's Object-Oriented Rules**, **Feature-Based Architecture (FBA)**,
> **Onion Architecture**, and **Hexagonal Architecture (Ports & Adapters)** principles.

---

## 0. Rule Zero (Immutable)

You may only break a rule if:
- You have a **compelling, documented reason**, AND
- The **reviewer / pair explicitly approves** the exception.

---

## 1. Sandi Metz Code Rules

### 1.1 Class Size
- Classes / React components **MUST NOT exceed 100 lines** of code (excluding blank lines and comments).
- If a component grows beyond this limit, extract sub-components or custom hooks.

### 1.2 Method / Function Size
- Functions and methods **MUST NOT exceed 5 lines** of code.
- `if`, `else`, and closing braces each count as a line.
- In an `if/else` block, **each branch may be only 1 line** — extract multi-line branches into named helpers.

### 1.3 Function Arguments
- Functions **MUST accept no more than 4 parameters**.
- If more data is needed, group related params into a typed object (`interface` / `type`).

### 1.4 Single Object Instantiation in Controllers / Entry Points
- A controller, page component, or route handler **MUST create only one primary domain object**.
- For pages needing multiple data sources, use the **Facade Pattern** (see skill: `implement-facade`).
- Views / render functions should receive one object and call methods on it. Chaining beyond one level (e.g., `obj.a.b.value`) is not allowed.

---

## 2. Feature-Based Architecture (FBA)

### 2.1 Directory Structure
All source code lives under `src/features/<feature-name>/`. Each feature is self-contained:

```
src/
  features/
    <feature>/
      components/     # UI components specific to this feature
      hooks/          # Custom hooks for feature-level state/logic
      services/       # Use-case / application-service layer
      domain/         # Entities, value objects, domain rules
      ports/          # Abstract interfaces (TypeScript interfaces/types)
      adapters/       # Concrete implementations of ports
      store/          # Local state slices (Zustand / Context) if needed
      types.ts        # Shared types for this feature
      index.ts        # Public API barrel export — ONLY export what other features need
  shared/
    components/       # Cross-feature reusable UI primitives
    hooks/            # Cross-feature reusable hooks
    domain/           # Shared domain value objects / utilities
    ports/            # Shared abstract interfaces
    adapters/         # Shared concrete adapter implementations
    lib/              # Pure utility functions, no React
    types.ts          # Global type definitions
```

### 2.2 Feature Isolation
- A feature **MUST NOT import directly from another feature's internal files**.
- Cross-feature communication happens **only via `index.ts` barrel exports** or a shared event bus.
- Circular dependencies between features are **strictly forbidden**.

### 2.3 Barrel Exports
- Every feature **MUST have an `index.ts`** that explicitly lists its public API.
- Internal files that are not listed in `index.ts` are considered private to the feature.

---

## 3. Onion Architecture

### 3.1 Layer Hierarchy (inner → outer)

```
Domain Model / Entities
  ↑
Domain Services
  ↑
Application Services (Use Cases)
  ↑
Infrastructure / Adapters (UI, IPC, File System, External APIs)
```

### 3.2 Dependency Rule
- **Dependencies flow inward only.** Outer layers depend on inner layers; inner layers are completely unaware of outer layers.
- `domain/` imports **nothing** from `services/`, `adapters/`, or framework code.
- `services/` imports from `domain/` and `ports/`, but **never from `adapters/`** directly.
- `adapters/` import from `ports/` (implement them) and may use framework-specific APIs.

### 3.3 Data Formats Across Layers
- Domain entities are **never** passed raw to/from infrastructure (UI, IPC, API).
- Use **DTOs (Data Transfer Objects)** or **mapper functions** when data crosses layer boundaries.
- Example: an IPC response is mapped to a domain entity before reaching the service layer.

### 3.4 Testing Strategy Per Layer
| Layer | Test Type |
|---|---|
| Domain Model | Unit tests — pure functions, no mocks |
| Domain Services | Unit tests — mock ports |
| Application Services | Unit / integration — mock adapters |
| Infrastructure / Adapters | Integration / E2E |

---

## 4. Hexagonal Architecture (Ports & Adapters)

### 4.1 Ports
- A **Port** is a TypeScript `interface` or `type` that describes a contract the core needs fulfilled.
- Ports live in `domain/ports/` or `shared/ports/`.
- Ports **MUST NOT contain any implementation details** — only method signatures.

```ts
// src/features/video/ports/VideoRepository.ts
export interface VideoRepository {
  getAll(): Promise<Video[]>;
  getById(id: string): Promise<Video | null>;
  save(video: Video): Promise<void>;
  delete(id: string): Promise<void>;
}
```

### 4.2 Adapters
- An **Adapter** is a concrete class/module that **implements a Port**.
- Adapters live in `adapters/` within the feature or `shared/adapters/`.
- Adapters may use Electron IPC, file system APIs, localStorage, fetch, etc.
- Swapping technology = swapping adapters, **zero changes to domain or services**.

```ts
// src/features/video/adapters/ElectronVideoRepository.ts
import type { VideoRepository } from '../ports/VideoRepository';

export class ElectronVideoRepository implements VideoRepository {
  async getAll(): Promise<Video[]> { /* IPC call */ }
  // ...
}
```

### 4.3 Dependency Injection
- Services receive port implementations **via constructor injection** or a DI factory.
- **Never** instantiate adapters inside domain or service files.
- Use a top-level composition root (e.g., `src/features/<feature>/index.ts` or `App.tsx`) to wire ports → adapters.

---

## 5. Naming Conventions

| Concept | Naming Pattern | Example |
|---|---|---|
| Domain Entity | `PascalCase` noun | `VideoClip`, `AudioTrack` |
| Value Object | `PascalCase` noun | `Timestamp`, `Duration` |
| Port (interface) | `PascalCase` + noun role | `VideoRepository`, `AudioEncoder` |
| Adapter (impl) | `[Tech][Port]` | `ElectronVideoRepository`, `WebAudioEncoder` |
| Use Case / Service | `PascalCase` + `Service` or `UseCase` | `ExportVideoService`, `TrimClipUseCase` |
| React Component | `PascalCase` | `TimelineEditor`, `WaveformDisplay` |
| Custom Hook | `use` + `PascalCase` | `useVideoPlayback`, `useTimelineZoom` |
| DTO | `PascalCase` + `Dto` | `ExportSettingsDto`, `VideoMetadataDto` |
| Barrel/Index | `index.ts` | — |

---

## 6. General Code Quality Rules

### 6.1 Single Responsibility
- Every file, class, hook, and function has **exactly one reason to change**.

### 6.2 No Magic Numbers/Strings
- Extract constants to a `constants.ts` file at the feature or shared level.

### 6.3 Immutability
- Prefer immutable data patterns. Domain entities **MUST NOT mutate shared state** directly.

### 6.4 Explicit over Implicit
- No `any` types in TypeScript unless absolutely unavoidable (must be accompanied by a `// eslint-disable` comment with justification).
- All function parameters and return types **MUST be explicitly typed**.

### 6.5 Error Handling
- Domain and service layers use **typed Result/Either patterns** or throw typed custom errors.
- Adapters are responsible for catching infrastructure errors and re-throwing as domain errors.

### 6.6 DRY & Abstraction
- Follow **Don't Repeat Yourself**: if logic appears in 2+ places, extract it.
- But don't abstract prematurely — wait until the third use.

---

## 7. React-Specific Rules

### 7.1 Component Rules
- Components are **purely presentational** (UI) or **container-like** (connect hooks/services).
- Do **not** put business logic inside components — delegate to hooks or services.
- Props interfaces MUST be defined above the component with descriptive naming (`ComponentNameProps`).

### 7.2 Hook Rules
- Custom hooks **MUST start with `use`** and encapsulate a single concern.
- Hooks that touch infrastructure (IPC, file I/O) belong in `adapters/` or `hooks/` within the feature, not in domain.

### 7.3 State Management
- Local UI state: `useState` / `useReducer`.
- Feature-level shared state: Zustand slice or React Context scoped to the feature.
- Global cross-feature state: only via a shared store or event bus in `shared/`.

---

## 8. File & Import Rules

- **Absolute imports** use the `@/` alias mapped to `src/`.
- **Relative imports** only within the same directory or one level up.
- Import order: external libs → internal shared → internal feature → local file.
- No default exports for services, ports, or adapters — use **named exports only**.
- Default exports are acceptable for React components (for lazy loading compatibility).

---

## 9. Documentation Rules

- Every Port interface **MUST have a JSDoc comment** describing its purpose.
- Every public function exported from a feature's `index.ts` **MUST have a JSDoc comment**.
- Complex domain logic **MUST have inline comments** explaining the "why", not the "what".

---

## 10. When in Doubt

1. Ask: *Does this belong in the domain, service, or adapter layer?*
2. Ask: *Would swapping the database/IPC/API break this file?* → If yes, it's an adapter.
3. Ask: *Does this file know about React/Electron/the file system?* → If yes, it's not domain.
4. Consult the relevant skill file under `.agent/skills/`.
