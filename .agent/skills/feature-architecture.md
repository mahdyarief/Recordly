---
name: feature-architecture
description: >
  Scaffold a new feature using Feature-Based Architecture (FBA) combined with
  Onion and Hexagonal (Ports & Adapters) principles. Use this skill whenever
  a new feature is being created or an existing module needs to be restructured.
---

# Feature Architecture Skill

## When to Use This Skill
- Creating a brand-new feature (e.g., `video`, `audio`, `export`, `timeline`)
- Restructuring an existing component-dump into a proper layered feature
- Adding a new external integration (IPC, API, storage) to an existing feature

---

## Step 1 — Identify the Feature Boundary

Before writing any code, answer these questions:

1. **What is the feature's single responsibility?** (one noun, e.g., "Video Management")
2. **What domain entities does it own?** (e.g., `VideoClip`, `Segment`)
3. **What external systems does it touch?** (Electron IPC, file system, Web APIs, etc.)
4. **What does it expose to other features?** (its public API via `index.ts`)

Document answers as a comment block at the top of the feature's `index.ts`.

---

## Step 2 — Create the Directory Skeleton

Create the following directory structure under `src/features/<feature-name>/`:

```
src/features/<feature-name>/
  domain/
    entities/          # Pure domain entities (no framework deps)
    value-objects/     # Immutable value types
    errors/            # Typed domain errors
    ports/             # Abstract interface contracts
  services/            # Application-layer use cases / orchestrators
  adapters/            # Concrete implementations of domain ports
  components/          # React UI components (presentation only)
  hooks/               # React hooks (bridge between UI and services)
  store/               # Zustand slice or Context (if needed)
  types.ts             # All shared TypeScript types for this feature
  index.ts             # Barrel export — the feature's public API
```

**Commands to scaffold (run from repo root):**
```bash
# Replace <feature> with actual name, e.g., video
mkdir -p src/features/<feature>/{domain/{entities,value-objects,errors,ports},services,adapters,components,hooks,store}
touch src/features/<feature>/{types.ts,index.ts}
```

---

## Step 3 — Define Domain Entities

In `domain/entities/<EntityName>.ts`:

```ts
/**
 * <EntityName> — brief description of what this entity represents in the domain.
 */
export interface <EntityName> {
  readonly id: string;
  // ...domain attributes (no framework-specific types)
}
```

Rules:
- Entities are **plain TypeScript objects or classes** — no React, no Electron, no I/O.
- All properties on entities used as records should be `readonly`.
- Include only **domain-meaningful** attributes (not UI state like `isSelected`).

---

## Step 4 — Define Ports (Abstract Interfaces)

In `domain/ports/<PortName>.ts`:

```ts
/**
 * <PortName> — defines the contract for [what this port does].
 * Implementations (adapters) are injected at the composition root.
 */
export interface <PortName> {
  methodName(param: ParamType): Promise<ReturnType>;
}
```

Rules:
- Method signatures only — **no implementation**.
- Use domain types in signatures, **never** framework types (e.g., no `IpcRenderer`).
- One file per port. Keep ports small and focused.

---

## Step 5 — Implement Services (Use Cases)

In `services/<UseCaseName>Service.ts`:

```ts
import type { <PortName> } from '../domain/ports/<PortName>';
import type { <EntityName> } from '../domain/entities/<EntityName>';

/**
 * <UseCaseName>Service — orchestrates [describe use case].
 */
export class <UseCaseName>Service {
  constructor(private readonly repo: <PortName>) {}

  async execute(input: InputType): Promise<OutputType> {
    // Orchestration only — NO business logic here
    // Delegate to domain methods / domain services
  }
}
```

Rules:
- Services **orchestrate** — they call domain methods and ports, in order.
- Services must **NOT** contain business logic (that belongs in domain entities/domain services).
- Services must **NOT** import adapters directly — only ports.
- Keep services ≤ 100 lines. If longer, extract sub-services.

---

## Step 6 — Implement Adapters

In `adapters/<Tech><PortName>.ts`:

```ts
import type { <PortName> } from '../domain/ports/<PortName>';

/**
 * <Tech><PortName> — concrete implementation using [technology].
 * Swap this adapter to change the underlying technology without touching domain code.
 */
export class <Tech><PortName> implements <PortName> {
  async methodName(param: ParamType): Promise<ReturnType> {
    // Use Electron IPC / fetch / localStorage / etc.
    // Map infrastructure data → domain types before returning
  }
}
```

Rules:
- Adapters **MUST map** infrastructure data structures to/from domain types.
- Adapters **MUST catch** infrastructure errors and re-throw as typed domain errors.
- Adapters are the **only** files allowed to import Electron, Node.js, or browser-specific APIs.

---

## Step 7 — Build the Composition Root

In `index.ts` (the feature's public API):

```ts
// Composition: wire ports → adapters
import { <Tech><PortName> } from './adapters/<Tech><PortName>';
import { <UseCaseName>Service } from './services/<UseCaseName>Service';

// Create singleton service instances with injected adapters
export const <useCaseName>Service = new <UseCaseName>Service(
  new <Tech><PortName>()
);

// Re-export public types, components, and hooks
export type { <EntityName> } from './domain/entities/<EntityName>';
export type { <PortName> } from './domain/ports/<PortName>';
export { <ComponentName> } from './components/<ComponentName>';
export { use<FeatureName> } from './hooks/use<FeatureName>';
```

Rules:
- Only export what **other features genuinely need**.
- Internal implementation files (adapters, services internals) should NOT be re-exported unless necessary.
- This file is the **only entry point** for cross-feature imports.

---

## Step 8 — Create React Hooks (Bridge Layer)

In `hooks/use<FeatureName>.ts`:

```ts
import { useState, useEffect } from 'react';
import { <useCaseName>Service } from '../index';

/**
 * use<FeatureName> — provides [feature] state and actions to React components.
 */
export function use<FeatureName>() {
  const [data, setData] = useState<DataType | null>(null);

  const loadData = async () => {
    const result = await <useCaseName>Service.execute(...);
    setData(result);
  };

  useEffect(() => { loadData(); }, []);

  return { data, loadData };
}
```

Rules:
- Hooks **bridge** services to React — they call services and manage local UI state.
- Hooks **MUST NOT** contain business logic or direct infrastructure calls.
- Keep hooks ≤ 100 lines. Extract sub-hooks for each concern.

---

## Step 9 — Create Presentational Components

In `components/<ComponentName>.tsx`:

```tsx
import type { <EntityName> } from '../domain/entities/<EntityName>';

interface <ComponentName>Props {
  data: <EntityName>;
  onAction: (id: string) => void;
}

/**
 * <ComponentName> — renders [what it shows].
 * Pure presentational component — no business logic, no service calls.
 */
export function <ComponentName>({ data, onAction }: <ComponentName>Props) {
  return (
    // JSX only
  );
}
```

Rules:
- Components receive **domain entities or simple primitives** as props.
- Components **MUST NOT** call services or adapters directly.
- All event handlers are lifted up to the hook or parent component.

---

## Checklist Before Committing a Feature

- [ ] `domain/entities/` contains plain TS types — no framework imports
- [ ] `domain/ports/` contains only interfaces — no implementation
- [ ] `services/` orchestrates via ports only — no adapter imports
- [ ] `adapters/` implements ports and maps data types at the boundary
- [ ] `index.ts` exports only the public API
- [ ] No file exceeds 100 lines
- [ ] No function exceeds 5 lines
- [ ] All ports and public exports have JSDoc comments
- [ ] No circular imports between features
- [ ] Unit tests exist for domain entities and services (with mocked ports)
