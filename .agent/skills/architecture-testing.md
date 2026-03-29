---
name: architecture-testing
description: >
  Write tests aligned with the Onion/Hexagonal architecture's testing strategy.
  Each layer has the right test type: unit tests for domain & services,
  integration tests for adapters. Use this skill when writing any test file in Recordly.
---

# Architecture Testing Skill

## Testing Pyramid for This Architecture

```
          ┌───────────────┐
          │   E2E Tests   │  ← Full user flows (Playwright / manual)
          └───────┬───────┘
        ┌─────────┴─────────┐
        │ Integration Tests │  ← Adapters with real IPC / file system
        └─────────┬─────────┘
      ┌───────────┴───────────┐
      │      Unit Tests       │  ← Domain entities, services (mocked ports)
      └───────────────────────┘
```

| Layer | Test Type | Mocking |
|---|---|---|
| Domain entities / value objects | Unit | None — pure functions |
| Application services (use cases) | Unit | Mock all ports |
| Adapters | Integration | Use real IPC/FS if possible, or thin wrappers |
| React hooks | Unit | Mock use cases |
| React components | Unit | Mock hooks / props |
| Full user flows | E2E | None |

---

## Step 1 — Unit Testing a Domain Entity

Domain entities are pure functions — tests need zero mocking:

```ts
// src/features/video/domain/entities/__tests__/VideoClip.test.ts
import { describe, it, expect } from 'vitest';
import { createVideoClip, trimClip } from '../VideoClip';
import { VideoClipDomainError } from '../../errors/VideoClipDomainError';

describe('createVideoClip', () => {
  it('creates a valid clip with positive duration', () => {
    const clip = createVideoClip({ id: '1', duration: 10, startAt: 0 });
    expect(clip.id).toBe('1');
    expect(clip.duration).toBe(10);
  });

  it('throws when duration is zero or negative', () => {
    expect(() => createVideoClip({ id: '1', duration: 0, startAt: 0 }))
      .toThrow(VideoClipDomainError);
  });

  it('throws when id is empty', () => {
    expect(() => createVideoClip({ id: '', duration: 5, startAt: 0 }))
      .toThrow(VideoClipDomainError);
  });
});

describe('trimClip', () => {
  it('returns a new clip with updated duration', () => {
    const clip = createVideoClip({ id: '1', duration: 10, startAt: 0 });
    const trimmed = trimClip(clip, 5);
    expect(trimmed.duration).toBe(5);
    expect(clip.duration).toBe(10); // original is immutable
  });
});
```

Rules:
- One `describe` per function/behaviour.
- Test names read as sentences: `it('throws when ...')`.
- Test the **happy path** AND all **edge cases / invariants**.
- Never mock anything in domain entity tests.

---

## Step 2 — Unit Testing an Application Service (Use Case)

Use cases are tested with **mock ports**. Use the `Mock<PortName>` adapter from `define-port` skill:

```ts
// src/features/video/services/__tests__/AddClipToTimelineUseCase.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { AddClipToTimelineUseCase } from '../AddClipToTimelineUseCase';
import { MockVideoRepository } from '../../adapters/MockVideoRepository';
import { MockTimelineRepository } from '../../adapters/MockTimelineRepository';
import { createVideoClip } from '../../domain/entities/VideoClip';

describe('AddClipToTimelineUseCase', () => {
  let videoRepo: MockVideoRepository;
  let timelineRepo: MockTimelineRepository;
  let useCase: AddClipToTimelineUseCase;

  beforeEach(() => {
    videoRepo = new MockVideoRepository();
    timelineRepo = new MockTimelineRepository();
    useCase = new AddClipToTimelineUseCase(videoRepo, timelineRepo);
  });

  it('adds an existing clip to the timeline', async () => {
    const clip = createVideoClip({ id: 'clip-1', duration: 5, startAt: 0 });
    videoRepo.seed([clip]);

    await useCase.execute({ clipId: 'clip-1', timelineId: 'tl-1', position: 0 });

    const saved = await timelineRepo.findById('tl-1');
    expect(saved?.clips).toHaveLength(1);
  });

  it('throws when clip does not exist', async () => {
    await expect(
      useCase.execute({ clipId: 'missing', timelineId: 'tl-1', position: 0 })
    ).rejects.toThrow('not found');
  });
});
```

Rules:
- Create fresh mock instances in `beforeEach` — no shared state between tests.
- Test both **success paths** and **error paths**.
- Assert on domain behaviour, not on mock call counts (avoid over-specification).

---

## Step 3 — Unit Testing a React Hook

Use `@testing-library/react` with `renderHook`:

```ts
// src/features/video/hooks/__tests__/useVideoClips.test.ts
import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { useVideoClips } from '../useVideoClips';

// Mock the use case at module level
vi.mock('../../index', () => ({
  addClipUseCase: {
    execute: vi.fn().mockResolvedValue({ clipId: 'clip-1' }),
  },
}));

describe('useVideoClips', () => {
  it('starts with empty clips and not pending', () => {
    const { result } = renderHook(() => useVideoClips());
    expect(result.current.clips).toEqual([]);
    expect(result.current.isPending).toBe(false);
  });

  it('sets isPending while adding a clip', async () => {
    const { result } = renderHook(() => useVideoClips());
    act(() => {
      result.current.addClip({ id: 'c1', duration: 5, startAt: 0 });
    });
    expect(result.current.isPending).toBe(true);
  });
});
```

---

## Step 4 — Integration Testing an Adapter

Test adapters against the real external system (where feasible), or against a lightweight in-process mock:

```ts
// src/features/video/adapters/__tests__/ElectronVideoRepository.integration.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { ElectronVideoRepository } from '../ElectronVideoRepository';

// Integration test: runs against a real (or test-double) Electron IPC bridge
describe('ElectronVideoRepository (integration)', () => {
  let repo: ElectronVideoRepository;

  beforeEach(() => {
    repo = new ElectronVideoRepository();
    // Ensure clean state — reset or seed test data
  });

  it('saves and retrieves a video', async () => {
    const video = { id: 'v1', path: '/test/video.mp4', duration: 30 };
    await repo.save(video);
    const found = await repo.findById('v1');
    expect(found).toMatchObject(video);
  });
});
```

---

## File Naming Convention

| Test Type | File Location | File Name Pattern |
|---|---|---|
| Domain entity | `domain/entities/__tests__/` | `<EntityName>.test.ts` |
| Use case | `services/__tests__/` | `<UseCaseName>.test.ts` |
| Adapter (integration) | `adapters/__tests__/` | `<AdapterName>.integration.test.ts` |
| React hook | `hooks/__tests__/` | `use<Name>.test.ts` |
| React component | `components/__tests__/` | `<ComponentName>.test.tsx` |

---

## Test Quality Rules

- [ ] Every test name is a full sentence describing expected behaviour
- [ ] Each test covers **one scenario** — no multiple `expect` chains on unrelated behaviour
- [ ] `beforeEach` resets all state — tests are independent and order-agnostic
- [ ] Happy path AND all documented error paths are covered
- [ ] Mock only what crosses a layer boundary (port implementations)
- [ ] No `setTimeout` in tests — use `vi.useFakeTimers()` or async/await properly
- [ ] Domain entity tests have **zero mocks**
- [ ] Use case tests mock **only ports**, not domain functions
