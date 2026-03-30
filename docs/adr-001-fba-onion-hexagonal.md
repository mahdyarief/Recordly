# ADR-001: Feature-Based Architecture with Onion and Hexagonal Layers

> **Status**: Accepted
> **Date**: 2026-03-29
> **Author**: Agent

---

## Context

Recordly's codebase grew organically. Key symptoms:

- `VideoEditor.tsx` reached ~3,800 lines — a God component violating every Sandi Metz rule.
- Infrastructure code (`window.electronAPI`) is called directly inside React hooks and components with no abstraction layer.
- There are no feature boundaries — any file can import any other file, creating a tightly-coupled, hard-to-test web of dependencies.
- Swapping a technology (e.g., changing the IPC transport or replacing the audio encoder) would require changes across dozens of files.
- Writing isolated unit tests is nearly impossible because domain logic and infrastructure are interleaved.

We evaluated three architecture patterns to solve these problems:

| Option | Pros | Cons |
|---|---|---|
| **Flat monolith** (current) | Simple to start | Doesn't scale; everything coupled |
| **Layer-based** (traditional MVC) | Familiar | Layers still span features; hard to delete a feature |
| **FBA + Onion + Hexagonal** (chosen) | Feature isolation, testable domain, swappable infra | Steeper learning curve up front |

---

## Decision

Adopt **Feature-Based Architecture (FBA)** combined with **Onion Architecture** and **Hexagonal Architecture (Ports & Adapters)** as the standard for the entire Recordly codebase.

### What Each Framework Contributes

| Framework | Scope | Answers |
|---|---|---|
| **FBA** | Folder organisation | Where does this code live? |
| **Onion** | Layer responsibilities | Which layer does this belong to? |
| **Hexagonal** | Boundary contracts | How does it talk to the outside world? |

### The Five Features

The codebase is divided into five bounded contexts (features):

| Feature | Responsibility |
|---|---|
| `recorder` | Screen capture, webcam, permissions, countdown |
| `editor` | Timeline, video playback, settings panels |
| `exporter` | Video/GIF rendering pipeline |
| `captions` | Whisper-based auto-caption generation |
| `project` | Project state persistence, editor preferences |

### Layer Rules (innermost wins)

1. **Domain** — Pure TypeScript entities, value objects, domain errors. Zero framework imports.
2. **Ports** — TypeScript interfaces defining contracts the domain needs fulfilled. No implementation.
3. **Services (Use Cases)** — Orchestrate domain + ports. No adapters, no React.
4. **Adapters** — Implement ports using real technology (Electron IPC, Web APIs, localStorage).
5. **Hooks / Components** — React-specific bridge. Call services; manage UI state only.

### The Sandi Metz Constraints

All code must satisfy:
- ≤ 100 lines per class/component
- ≤ 5 lines per function
- ≤ 4 parameters per function
- ≤ 1 domain object per container (use Facade for more)

---

## Consequences

### Positive
- Any feature can be understood in isolation by reading its `domain/` and `services/` directories.
- Swapping Electron IPC for a REST API requires only changing `adapters/` — zero domain changes.
- Unit tests for domain and services require **no mocks of infrastructure** — only port interfaces.
- New developers can onboard feature-by-feature rather than learning the entire codebase.
- Violating the architecture is visible — imports crossing feature boundaries will fail lint rules.

### Negative / Trade-offs
- Initial migration cost is high (~40–65 hours, see `restructuring-plan.md`).
- More files and directories for simple features (acceptable — files are cheap, coupling is not).
- Developers must learn the pattern before contributing (mitigated by `.agent/skills/` guides).

### Migration Strategy
Incremental, phase-by-phase. The app must build and run after every phase.
See: [restructuring-plan.md](./restructuring-plan.md)

---

## References

- Sandi Metz, *Rules for OO Design* — see `reference.md`
- Onion Architecture — Jeff Palermo (2008); see `reference.md`
- Hexagonal Architecture (Ports & Adapters) — Alistair Cockburn (2005); see `reference.md`
- `.agent/rules.md` — the enforced coding standards derived from this ADR
- `.agent/skills/architecture-overview.md` — the practical implementation map
