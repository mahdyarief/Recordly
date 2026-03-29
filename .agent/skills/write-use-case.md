---
name: write-use-case
description: >
  Implement an Application Service (Use Case) in the Onion/Hexagonal architecture.
  Use this skill whenever you need to add new business functionality that orchestrates
  domain entities and port interactions. Application services are the "verbs" of your
  system — they encode what the application can *do*.
---

# Write Use Case (Application Service) Skill

## When to Use This Skill

Use when:
- Adding a new user-facing action (e.g., "Trim a clip", "Export video", "Add audio track")
- Orchestrating multiple domain operations in a specific sequence
- A React hook is growing business logic that should live in a service instead

Do NOT put here:
- Business rules / domain invariants (→ domain entities)
- Infrastructure concerns like IPC calls (→ adapters)
- UI state management (→ hooks/store)

---

## The Application Service's Job

```
HTTP / IPC / UI Event
         │
         ▼
  Application Service   ← THIS LAYER
  1. Validate input (structural, not business)
  2. Load entities via Port
  3. Call domain logic / domain services
  4. Persist changes via Port
  5. Return result or throw typed error
         │
         ▼
  Domain (entities, rules)
         │
         ▼
  Ports (abstract) → Adapters (concrete)
```

**Key rule:** An application service orchestrates; it does NOT decide.  
Business decisions live in domain entities and domain services.

---

## Step 1 — Name the Use Case

Use case names follow the pattern: **`<Verb><Noun>UseCase`** or **`<Verb><Noun>Service`**

| Action | Good Name |
|---|---|
| Adding a clip to timeline | `AddClipToTimelineUseCase` |
| Exporting the project | `ExportProjectService` |
| Trimming an audio track | `TrimAudioTrackUseCase` |
| Loading the project | `LoadProjectUseCase` |

---

## Step 2 — Define the Input/Output Types

In `src/features/<feature>/services/<UseCaseName>UseCase.ts`, define DTOs at the top:

```ts
/**
 * Input for the {@link <UseCaseName>UseCase}.
 * Represents data crossing from infrastructure into the application layer.
 */
export interface <UseCaseName>Input {
  // Structural fields — validated here for presence, not business rules
  readonly [field]: FieldType;
}

/**
 * Output of the {@link <UseCaseName>UseCase}.
 */
export interface <UseCaseName>Output {
  readonly [field]: FieldType;
}
```

Rules:
- Input/Output types are **DTOs** — plain data, no methods.
- They live in the **same file** as the use case for small use cases.
- For large features, move them to `types.ts`.

---

## Step 3 — Implement the Use Case Class

```ts
import type { <PortA> } from '../domain/ports/<PortA>';
import type { <PortB> } from '../domain/ports/<PortB>';
import { create<Entity> } from '../domain/entities/<Entity>';
import { <doSomething> } from '../domain/entities/<Entity>';
import { <FeatureName>DomainError } from '../domain/errors/<FeatureName>DomainError';

/**
 * <UseCaseName>UseCase — orchestrates [one-line description of what this use case does].
 *
 * Steps:
 * 1. [step description]
 * 2. [step description]
 * 3. [step description]
 */
export class <UseCaseName>UseCase {
  constructor(
    private readonly <portA>: <PortA>,
    private readonly <portB>: <PortB>,
  ) {}

  async execute(input: <UseCaseName>Input): Promise<<UseCaseName>Output> {
    const entity = await this.load(input);
    const updated = this.applyDomainLogic(entity, input);
    await this.persist(updated);
    return this.toOutput(updated);
  }

  private async load(input: <UseCaseName>Input): Promise<<Entity>> {
    const entity = await this.<portA>.findById(input.id);
    if (!entity) throw new <FeatureName>DomainError(`<Entity> not found: ${input.id}`);
    return entity;
  }

  private applyDomainLogic(entity: <Entity>, input: <UseCaseName>Input): <Entity> {
    return <doSomething>(entity, input.value); // pure domain function
  }

  private async persist(entity: <Entity>): Promise<void> {
    await this.<portA>.save(entity);
  }

  private toOutput(entity: <Entity>): <UseCaseName>Output {
    return { id: entity.id /* ...map to output */ };
  }
}
```

Rules:
- The `execute` method is ≤ 5 lines — it delegates to named private methods.
- Each private method is ≤ 5 lines.
- The class is ≤ 100 lines — if larger, split into sub-use-cases.
- `execute` is the **only public method** on a use case.
- No direct adapter imports — only ports injected via constructor.

---

## Step 4 — Wire in the Composition Root

In `src/features/<feature>/index.ts`:

```ts
import { Electron<PortA> } from './adapters/Electron<PortA>';
import { Electron<PortB> } from './adapters/Electron<PortB>';
import { <UseCaseName>UseCase } from './services/<UseCaseName>UseCase';

// Compose: inject adapters into use case
export const <useCaseName>UseCase = new <UseCaseName>UseCase(
  new Electron<PortA>(),
  new Electron<PortB>(),
);
```

---

## Step 5 — Call from a React Hook

In `src/features/<feature>/hooks/use<FeatureName>.ts`:

```ts
import { <useCaseName>UseCase } from '../index';

export function use<FeatureName>() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = async (input: <UseCaseName>Input) => {
    setIsPending(true);
    setError(null);
    try {
      const result = await <useCaseName>UseCase.execute(input);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsPending(false);
    }
  };

  return { execute, isPending, error };
}
```

---

## Checklist

- [ ] Use case name describes a single business action (verb + noun)
- [ ] `execute` is the only public method
- [ ] `execute` body is ≤ 5 lines, delegates to private methods
- [ ] Class imports only ports, not adapters
- [ ] Input/Output types are defined as plain DTOs
- [ ] Each step (load, domain logic, persist, map) is its own named method
- [ ] Use case is wired via composition root in `index.ts`
- [ ] React hook handles async state (pending, error) and delegates to use case
- [ ] Unit tests exist with mocked ports
