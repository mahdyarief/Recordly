---
name: extract-domain-entity
description: >
  Extract a domain entity from an existing component, hook, or utility file.
  Use this skill when refactoring existing code toward Onion/Hexagonal architecture,
  or when you need to isolate business logic from React/Electron code.
---

# Extract Domain Entity Skill

## When to Use This Skill

Use when:
- You find business logic living inside a React component
- A hook contains raw data manipulation that should be pure domain logic
- A utility function is doing domain-level work mixed with infrastructure concerns
- You need to tease apart "what the app does" from "how it does it"

---

## Mental Model: What is a Domain Entity?

A domain entity:
- Represents a **core business concept** (VideoClip, AudioTrack, Timeline, Segment)
- Has a **unique identity** (`id`)
- Encapsulates **data + domain behaviour** together
- Has **zero knowledge** of React, Electron, file system, databases, or UI

```
✅ Domain Entity concerns:        ❌ NOT domain concerns:
- Business validation              - useState / useEffect
- Computed domain properties       - IPC calls / fetch
- Domain state transitions         - file paths / OS APIs
- Business rules & invariants      - React component rendering
```

---

## Step 1 — Identify What to Extract

Look for these patterns in existing code:

```ts
// ❌ business logic trapped in a component
function TimelineEditor() {
  const [clips, setClips] = useState([]);
  
  // This validation belongs in the domain
  const addClip = (clip) => {
    if (clip.duration <= 0) throw new Error('Invalid duration');
    if (clips.some(c => c.id === clip.id)) throw new Error('Duplicate clip');
    setClips(prev => [...prev, clip]);
  };
}
```

The validation (`duration <= 0`, `duplicate id`) is domain logic — extract it.

---

## Step 2 — Define the Entity Interface

In `src/features/<feature>/domain/entities/<EntityName>.ts`:

```ts
/**
 * <EntityName> — [domain description of this concept].
 * 
 * Invariants:
 * - [invariant 1, e.g., "duration must be > 0"]
 * - [invariant 2]
 */
export interface <EntityName> {
  readonly id: string;
  readonly [domainProperty]: DomainType;
  // ... other domain attributes
}
```

---

## Step 3 — Define a Factory Function (if complex construction needed)

In the same file, below the interface:

```ts
import { <FeatureName>DomainError } from '../errors/<FeatureName>DomainError';

/**
 * Creates a valid {@link <EntityName>} or throws a {@link <FeatureName>DomainError}.
 */
export function create<EntityName>(params: Create<EntityName>Params): <EntityName> {
  validate<EntityName>(params);
  return { id: params.id, ...params };
}

function validate<EntityName>(params: Create<EntityName>Params): void {
  if (!params.id) throw new <FeatureName>DomainError('<EntityName> must have an id');
  // Add other invariant checks
}

export interface Create<EntityName>Params {
  id: string;
  // ...
}
```

---

## Step 4 — Define Domain Behaviours (if entity has state transitions)

For entities with meaningful state changes, add pure functions:

```ts
/**
 * Returns a new <EntityName> with [what changed].
 * Pure function — does not mutate the original entity.
 */
export function <doSomething>(<entityName>: <EntityName>, ...params): <EntityName> {
  if (/* invariant check */) {
    throw new <FeatureName>DomainError('[reason]');
  }
  return { ...<entityName>, [changedProp]: newValue };
}
```

Rules:
- Domain functions are **pure**: given the same input, always return the same output.
- Domain functions **never mutate** — always return a new object.
- Each function handles **one small behaviour** (≤ 5 lines).

---

## Step 5 — Define Typed Domain Errors

In `src/features/<feature>/domain/errors/<FeatureName>DomainError.ts`:

```ts
/**
 * <FeatureName>DomainError — thrown when a domain invariant is violated.
 * Catch this at the adapter/service boundary to handle gracefully.
 */
export class <FeatureName>DomainError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = '<FeatureName>DomainError';
  }
}
```

---

## Step 6 — Replace Original Code

Update the original component/hook:

```ts
// ✅ After extraction — component is clean
function TimelineEditor() {
  const { clips, addClip } = useTimeline(); // hook handles domain + state
  // ...
}

// ✅ Hook calls domain functions
function useTimeline() {
  const [clips, setClips] = useState<VideoClip[]>([]);

  const addClip = (params: CreateVideoClipParams) => {
    const clip = createVideoClip(params); // domain factory validates
    setClips(prev => [...prev, clip]);
  };

  return { clips, addClip };
}
```

---

## Checklist

- [ ] Entity file has zero imports from React, Electron, Node, or browser APIs
- [ ] Factory function validates all invariants and throws domain errors
- [ ] All domain functions are pure (no mutation, no side effects)
- [ ] Domain error class exists for this feature
- [ ] Original component/hook delegates to domain functions
- [ ] Unit tests cover all validation rules and state transitions
- [ ] All exported types have JSDoc comments
