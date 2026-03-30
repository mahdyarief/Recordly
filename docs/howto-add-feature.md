# How to Add a New Feature

> **Status**: Accepted
> **Date**: 2026-03-29
> **Author**: Agent

---

## Context

A reference guide for any developer (or agent) adding a new self-contained feature to Recordly.
Follows the FBA + Onion + Hexagonal architecture defined in `adr-001-fba-onion-hexagonal.md`.

---

## Decision / Plan

### Step 1 — Choose the Feature Name

Pick a single, descriptive noun (kebab-case): `video-preview`, `noise-reducer`, `project-browser`.

Ask yourself:
- Is this a **new bounded context** (its own data, its own domain rules)?
- Or is it a **sub-component of an existing feature**? (If so, add it inside that feature.)

---

### Step 2 — Scaffold the Directory

Use the workflow:

```bash
# Run /scaffold-feature from the agent panel, or manually:
FEATURE=your-feature-name

mkdir -p src/features/$FEATURE/{domain/{entities,value-objects,errors,ports},services,adapters,components,hooks,store}
touch src/features/$FEATURE/{types.ts,index.ts}
```

---

### Step 3 — Define the Domain (Start Here, Always)

**Never write UI or adapters before the domain.**

1. Create `domain/entities/<EntityName>.ts` — pure TypeScript, no framework imports.
2. Add factory functions + invariant validation.
3. Create `domain/errors/<FeatureName>DomainError.ts`.

*Skill to use:* `extract-domain-entity`

---

### Step 4 — Define the Ports

For every external dependency (IPC, localStorage, Web API, file system):

1. Create `domain/ports/<PortName>.ts` — interface only, no implementation.
2. Name the port after its **role**, not the technology (`VideoStorage`, not `ElectronIpc`).

*Skill to use:* `define-port`

---

### Step 5 — Create Use Cases (Services)

For every user-facing action:

1. Create `services/<ActionName>UseCase.ts`.
2. Constructor receives port interfaces only — never adapters.
3. `execute()` is the only public method; it orchestrates but never decides.

*Skill to use:* `write-use-case`

---

### Step 6 — Implement Adapters

1. Create `adapters/<Tech><PortName>.ts` (e.g., `ElectronVideoStorageAdapter.ts`).
2. Implement the port interface.
3. Map infrastructure data ↔ domain entities at the boundary.
4. Catch all infrastructure errors; re-throw as `<FeatureName>DomainError`.

*Skill to use:* `define-port` (Mock Adapter section)

---

### Step 7 — Wire the Composition Root

In `src/features/<feature>/index.ts`:

```ts
// 1. Import adapters
import { Electron<PortName> } from './adapters/Electron<PortName>';
// 2. Import use cases
import { <Action>UseCase } from './services/<Action>UseCase';

// 3. Compose: inject adapters into use cases
export const <action>UseCase = new <Action>UseCase(new Electron<PortName>());

// 4. Re-export only what other features need
export type { <EntityName> } from './domain/entities/<EntityName>';
export { <ComponentName> } from './components/<ComponentName>';
```

---

### Step 8 — Create the React Hook

In `hooks/use<FeatureName>.ts` (~50–80 lines):

```ts
import { useState } from 'react';
import { <action>UseCase } from '../index';

export function use<FeatureName>() {
  const [isPending, setIsPending] = useState(false);

  const doAction = async (input: InputType) => {
    setIsPending(true);
    try {
      return await <action>UseCase.execute(input);
    } finally {
      setIsPending(false);
    }
  };

  return { doAction, isPending };
}
```

---

### Step 9 — Create the UI Components

In `components/<ComponentName>.tsx` (≤ 100 lines each):

- Receive domain entities or primitives as props.
- Call the hook for actions — never call services or adapters directly.
- No business logic in the component body.

If the page needs data from 2+ hooks, create a Facade first.
*Skill to use:* `implement-facade`

---

### Step 10 — Write Tests

| Layer | Test Location | Mock? |
|---|---|---|
| Domain entities | `domain/entities/__tests__/` | Nothing |
| Use cases | `services/__tests__/` | Mock ports only |
| Adapters | `adapters/__tests__/` | Integration tests |
| Hooks | `hooks/__tests__/` | Mock use cases |

*Skill to use:* `architecture-testing`

---

### Step 11 — Readability Check

Before committing, run the Sandi Metz audit:

```bash
# No file should exceed 100 lines
find src/features/<feature> -name "*.ts" -o -name "*.tsx" | xargs wc -l | awk '$1 > 100'

# No IPC calls outside adapters
grep -r "window.electronAPI" src/features/<feature> | grep -v "/adapters/"
```

*Skill to use:* `code-readability`

---

### Step 12 — Update `docs/README.md`

Add a row to the docs index if you created any design doc or ADR for this feature:

```md
| [feature-<name>-design.md](./feature-<name>-design.md) | Design | ... |
```

---

## Quickstart Checklist

```
[ ] Directory scaffolded
[ ] Domain entity defined (no framework imports)
[ ] Domain error class created
[ ] Port interface(s) defined
[ ] Use case(s) created (orchestrate only)
[ ] Adapter(s) implemented (map infra ↔ domain)
[ ] Composition root wired in index.ts
[ ] React hook created (~80 lines max)
[ ] Components created (≤100 lines each)
[ ] Unit tests for domain + services
[ ] Sandi Metz audit passed
[ ] docs/README.md updated (if a design doc was written)
```

## Consequences

Following this guide ensures:
- The feature is testable in isolation with no real infrastructure.
- The feature can be deleted or replaced without touching other features.
- The codebase stays consistent with `.agent/rules.md`.
