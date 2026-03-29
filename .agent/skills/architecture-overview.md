---
name: architecture-overview
description: >
  A complete map of the Recordly architecture: how FBA, Onion, and Hexagonal layers
  relate to each other, which skill to use for each task, and how to verify the
  architecture is being followed. Read this first when onboarding or when unsure
  which skill to use.
---

# Architecture Overview — Recordly

## The Three Frameworks, One System

Recordly's architecture combines three complementary frameworks:

| Framework | Answers | Skill to Use |
|---|---|---|
| **FBA** (Feature-Based Architecture) | *Where does this code live?* | `feature-architecture` |
| **Onion Architecture** | *Which layer does this belong to?* | `write-use-case`, `extract-domain-entity` |
| **Hexagonal Architecture** | *How does it talk to the outside world?* | `define-port` |

They are **not competing** — FBA organises *folders*, Onion organises *layers within folders*, Hexagonal organises *how layers communicate*.

---

## Full Architecture Map

```
src/
│
├── features/                         ← FBA: each directory = one bounded context
│   └── <feature>/
│       │
│       ├── domain/                   ← ONION: innermost layer (no deps inward)
│       │   ├── entities/             ← Core business objects (pure TS)
│       │   ├── value-objects/        ← Immutable typed values
│       │   ├── errors/               ← Typed domain errors
│       │   └── ports/                ← HEXAGONAL: abstract contracts (interfaces)
│       │
│       ├── services/                 ← ONION: application layer (orchestration)
│       │   └── *UseCase.ts           ← Use cases — the "verbs" of the system
│       │
│       ├── adapters/                 ← HEXAGONAL: concrete port implementations
│       │   ├── Electron*.ts          ← Infrastructure adapters (IPC, FS, etc.)
│       │   └── Mock*.ts              ← In-memory adapters for testing
│       │
│       ├── hooks/                    ← React bridge (services → React state)
│       ├── components/               ← UI primitives for this feature
│       ├── store/                    ← Local state slice (Zustand/Context)
│       ├── types.ts                  ← Feature-scoped shared types
│       └── index.ts                  ← PUBLIC API + composition root
│
└── shared/                           ← Cross-feature utilities (no business logic)
    ├── components/                   ← Generic UI primitives
    ├── hooks/                        ← Generic hooks
    ├── domain/                       ← Shared value objects, errors
    ├── ports/                        ← Shared abstract interfaces
    ├── adapters/                     ← Shared concrete adapters
    └── lib/                          ← Pure utility functions
```

---

## Dependency Flow (read bottom → top)

```
┌────────────────────────────────────────────────────────────────┐
│                     INFRASTRUCTURE LAYER                       │
│  React Components, Electron IPC, File System, Web APIs        │
│  (components/, adapters/, electron/)                          │
└────────────────────────┬───────────────────────────────────────┘
                         │ depends on
┌────────────────────────▼───────────────────────────────────────┐
│                   APPLICATION LAYER                            │
│  Use Cases / Application Services                             │
│  (services/*UseCase.ts)                                       │
└────────────────────────┬───────────────────────────────────────┘
                         │ depends on
┌────────────────────────▼───────────────────────────────────────┐
│                      DOMAIN LAYER                             │
│  Entities, Value Objects, Domain Services, Ports              │
│  (domain/entities/, domain/ports/, domain/errors/)           │
└────────────────────────────────────────────────────────────────┘
                    ▲ (nothing depends on this from outside)
```

**Golden Rule:** Arrows only point inward. The domain knows nothing of the layers above it.

---

## Hexagonal Ports & Adapters Flow

```
 React Hook
     │ calls
     ▼
 Use Case (service)
     │ calls method on port interface
     ▼
 << Port Interface >>         ← defined in domain/ports/
     ▲ implemented by
     │
 Adapter (Electron/Mock)      ← defined in adapters/
     │ uses
     ▼
 External System (IPC / FS / API)
```

The use case **never imports** the adapter — only the port interface.  
The adapter **implements** the port — it's injected at the composition root (`index.ts`).

---

## Skill Selector — "Which Skill Do I Need?"

```
What are you trying to do?
│
├── Starting a new feature or module?
│     → skill: feature-architecture
│
├── Need data from 2+ services in one component?
│     → skill: implement-facade
│
├── Adding a new external dependency (IPC, API, DB, storage)?
│     → skill: define-port
│
├── Business logic is trapped in a component or hook?
│     → skill: extract-domain-entity
│
├── Adding a new user action / business operation?
│     → skill: write-use-case
│
├── Writing or reviewing tests?
│     → skill: architecture-testing
│
└── Code review / readability / Sandi Metz compliance?
      → skill: code-readability
```

---

## Architecture Violation Checklist

Run these checks on every PR:

### Layer Violations
- [ ] No domain file (`domain/`) imports from `adapters/`, `components/`, `hooks/`, or any framework
- [ ] No service file imports an adapter directly (only ports)
- [ ] No component file instantiates a service (goes through a hook)
- [ ] No adapter contains business logic (only infrastructure + mapping)

### FBA Violations
- [ ] No feature imports from another feature's internal files (only via `index.ts`)
- [ ] No circular imports between features
- [ ] Every feature has an `index.ts` barrel export

### Sandi Metz Violations
- [ ] No file > 100 lines
- [ ] No function > 5 lines
- [ ] No function with > 4 parameters
- [ ] No page/container using more than 1 data-source hook without a Facade

### Naming Violations
- [ ] All port interfaces follow `<Role>Repository` / `<Role>Service` naming
- [ ] All adapters follow `<Tech><PortName>` naming
- [ ] All use cases follow `<Verb><Noun>UseCase` naming
- [ ] All hooks follow `use<FeatureName>` naming

---

## Quick Glossary

| Term | Definition | Location |
|---|---|---|
| **Entity** | A domain concept with a unique `id` | `domain/entities/` |
| **Value Object** | An immutable typed wrapper (e.g., `Duration`) | `domain/value-objects/` |
| **Port** | A TypeScript interface defining a contract | `domain/ports/` |
| **Adapter** | A concrete implementation of a Port | `adapters/` |
| **Use Case** | An application service orchestrating one user action | `services/` |
| **Facade** | An aggregator exposing a unified interface to a page | `services/` |
| **DTO** | Data Transfer Object — plain data crossing layer boundaries | `types.ts` |
| **Composition Root** | Where ports are wired to adapters | `index.ts` |
| **Barrel Export** | `index.ts` listing a feature's public API | `index.ts` |

---

## Example: Feature Interaction Flow

**User clicks "Export Video":**

```
1. ExportButton component (components/)
   └─ calls onExport() from props

2. ExportPanel component (components/)
   └─ dispatches via useExport() hook (hooks/)

3. useExport hook (hooks/)
   └─ calls exportVideoUseCase.execute(input) (index.ts)

4. ExportVideoUseCase (services/)
   ├─ loads VideoClip via VideoRepository port
   ├─ calls domain function: validateExportSettings(clip, settings)
   └─ saves result via ExportResultRepository port

5. ElectronVideoRepository (adapters/)
   └─ calls window.electronAPI.getVideo(id) → maps raw → domain

6. ElectronExportResultRepository (adapters/)
   └─ calls window.electronAPI.saveExport(data) → maps domain → raw
```

Each step is in its own layer. No step skips a layer. No step knows about layers beyond its own boundary.
