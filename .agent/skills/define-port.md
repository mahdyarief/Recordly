---
name: define-port
description: >
  Define a Port (abstract interface) following Hexagonal Architecture principles.
  Use this skill whenever you need to introduce a new external dependency
  (storage, IPC, API, notification, encoder, etc.) in the codebase.
---

# Define Port Skill

## When to Use This Skill

Use when:
- Adding a new external dependency (file system, Electron IPC, HTTP, Web Audio API)
- A service needs to interact with something outside the domain
- You want to make a dependency swappable (e.g., switch from IPC to REST)
- Writing a new test that requires mocking an external system

---

## The Port/Adapter Contract

```
Domain / Services
      │
      │  depends on (import)
      ▼
   << Port >>         ← interface in domain/ports/
      ▲
      │  implements
      │
   Adapter            ← concrete class in adapters/
      │
      │  uses
      ▼
External System (Electron IPC, DB, API, etc.)
```

The domain sees **only the Port**. The concrete technology is hidden behind the Adapter.

---

## Step 1 — Name the Port Correctly

Port names describe **what role they fulfill**, not the technology:

| ❌ Bad (technology-specific) | ✅ Good (role-based) |
|---|---|
| `ElectronIpcVideoLoader` | `VideoRepository` |
| `PostgresUserStore` | `UserRepository` |
| `AxiosHttpClient` | `HttpClient` |
| `NodeFileSystemReader` | `FileReader` |

---

## Step 2 — Define the Port Interface

Create `src/features/<feature>/domain/ports/<PortName>.ts`:

```ts
import type { <EntityName> } from '../entities/<EntityName>';

/**
 * <PortName> — [one sentence describing what this port provides].
 *
 * Implementations:
 * - {@link Electron<PortName>} — Electron IPC implementation
 * - {@link Mock<PortName>} — in-memory mock for testing
 */
export interface <PortName> {
  /**
   * [Describe what this method does in domain terms.]
   * @param id - [param description]
   * @returns [return description]
   */
  findById(id: string): Promise<<EntityName> | null>;

  /**
   * [Describe what this method does.]
   */
  findAll(): Promise<<EntityName>[]>;

  /**
   * [Describe what this method does.]
   */
  save(entity: <EntityName>): Promise<void>;

  /**
   * [Describe what this method does.]
   */
  delete(id: string): Promise<void>;
}
```

Rules:
- Method names use **domain vocabulary**, not technical terms (`findById` not `queryByPk`).
- All parameters and return types use **domain types**, not infrastructure types.
- Every method has a **JSDoc comment**.
- No `class`, no `implements`, no `extends` — ports are pure `interface` declarations.

---

## Step 3 — Create a Mock Adapter for Tests

Create `src/features/<feature>/adapters/Mock<PortName>.ts`:

```ts
import type { <PortName> } from '../domain/ports/<PortName>';
import type { <EntityName> } from '../domain/entities/<EntityName>';

/**
 * Mock<PortName> — in-memory implementation for unit testing.
 * Pre-seed with data in test setup.
 */
export class Mock<PortName> implements <PortName> {
  private store: Map<string, <EntityName>> = new Map();

  seed(entities: <EntityName>[]): void {
    entities.forEach(e => this.store.set(e.id, e));
  }

  async findById(id: string): Promise<<EntityName> | null> {
    return this.store.get(id) ?? null;
  }

  async findAll(): Promise<<EntityName>[]> {
    return [...this.store.values()];
  }

  async save(entity: <EntityName>): Promise<void> {
    this.store.set(entity.id, entity);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}
```

---

## Step 4 — Create the Real Adapter

Create `src/features/<feature>/adapters/Electron<PortName>.ts` (or `Http<PortName>`, etc.):

```ts
import type { <PortName> } from '../domain/ports/<PortName>';
import type { <EntityName> } from '../domain/entities/<EntityName>';
import { <FeatureName>DomainError } from '../domain/errors/<FeatureName>DomainError';

/**
 * Electron<PortName> — implements {@link <PortName>} using Electron IPC.
 * All IPC channel names are internal to this file.
 */
export class Electron<PortName> implements <PortName> {
  async findById(id: string): Promise<<EntityName> | null> {
    try {
      const raw = await window.electronAPI.<channel>(id);
      return raw ? mapToDomain(raw) : null;
    } catch (err) {
      throw new <FeatureName>DomainError(`Failed to find by id: ${id}`, err);
    }
  }

  // ... implement remaining methods
}

// Private mapper — infrastructure → domain
function mapToDomain(raw: RawType): <EntityName> {
  return {
    id: raw.id,
    // ...map fields
  };
}
```

Rules:
- IPC channel names, SQL queries, API endpoints — ALL internal to the adapter.
- Catch ALL infrastructure errors; re-throw as typed domain errors.
- Include a **private mapper function** to convert infra data → domain entities.
- Mappers are ≤ 5 lines; if longer, extract to a `mappers/<EntityName>Mapper.ts` file.

---

## Step 5 — Register in Composition Root

Wire the port to the adapter in the feature's `index.ts`:

```ts
import { Electron<PortName> } from './adapters/Electron<PortName>';
import { <ServiceName>Service } from './services/<ServiceName>Service';

const port = new Electron<PortName>();
export const <serviceName>Service = new <ServiceName>Service(port);
```

---

## Checklist

- [ ] Port is a `interface` — no implementation code
- [ ] Port methods use domain vocabulary and domain types only
- [ ] Mock adapter created for unit testing
- [ ] Real adapter maps infrastructure ↔ domain types
- [ ] Real adapter catches and re-throws infrastructure errors as domain errors
- [ ] Port and adapter are wired in `index.ts` composition root
- [ ] All port methods have JSDoc comments
