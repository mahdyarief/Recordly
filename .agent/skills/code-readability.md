---
name: code-readability
description: >
  Apply Sandi Metz rules and clean code standards to improve the readability
  of any file or module. Use this skill during code review, refactoring sessions,
  or when a file is getting too large or complex.
---

# Code Readability Skill

## Readability Checklist (Run on Any File)

Before marking a PR ready for review, verify every item:

### Size Limits
- [ ] File is ≤ 100 lines (excluding blanks and comments)
- [ ] All functions/methods are ≤ 5 lines
- [ ] No function has more than 4 parameters
- [ ] No component renders more than one "domain object" without a facade hook

### Naming
- [ ] Every function name reads like a **verb phrase** (`calculateDuration`, `findClipById`)
- [ ] Every variable name is a **descriptive noun** (no `data`, `item`, `temp`, `x`)
- [ ] No abbreviations except universally accepted ones (`id`, `url`, `dto`)
- [ ] Boolean variables start with `is`, `has`, `can`, `should` (`isVisible`, `hasError`)

### Function Design
- [ ] Functions do **one thing** — the name fully describes everything they do
- [ ] Private helpers have names that make them self-documenting comments
- [ ] No `else` after an early `return` (use early returns / guard clauses)
- [ ] No nested ternaries

### Comments
- [ ] No comments explaining **what** code does (code should be self-explanatory)
- [ ] Comments explain **why** a decision was made (non-obvious business rules)
- [ ] All exported types, interfaces, and public functions have JSDoc
- [ ] No commented-out dead code

### TypeScript
- [ ] No `any` types (justify with `// eslint-disable` + comment if unavoidable)
- [ ] All function parameters explicitly typed
- [ ] All function return types explicitly typed
- [ ] No `as` type assertions without a comment explaining why it's safe

---

## Common Refactoring Patterns

### Pattern 1: Long Function → Named Private Helpers

```ts
// ❌ Before (12 lines, does too much)
function processClip(clip: VideoClip): ProcessedClip {
  if (!clip.id) throw new Error('No ID');
  if (clip.duration <= 0) throw new Error('Invalid duration');
  const normalized = { ...clip, duration: Math.round(clip.duration) };
  const withMetadata = { ...normalized, processedAt: Date.now() };
  return withMetadata;
}

// ✅ After (each function ≤ 5 lines, names document intent)
function processClip(clip: VideoClip): ProcessedClip {
  validateClip(clip);
  return addProcessingMetadata(normalizeClip(clip));
}

function validateClip(clip: VideoClip): void {
  if (!clip.id) throw new VideoClipDomainError('Clip must have an id');
  if (clip.duration <= 0) throw new VideoClipDomainError('Duration must be positive');
}

function normalizeClip(clip: VideoClip): VideoClip {
  return { ...clip, duration: Math.round(clip.duration) };
}

function addProcessingMetadata(clip: VideoClip): ProcessedClip {
  return { ...clip, processedAt: Date.now() };
}
```

### Pattern 2: Too Many Parameters → Typed Options Object

```ts
// ❌ Before (6 params)
function exportVideo(path: string, format: string, quality: number, fps: number, width: number, height: number) {}

// ✅ After (1 typed object param)
interface ExportOptions {
  path: string;
  format: 'mp4' | 'webm';
  quality: number;
  fps: number;
  resolution: { width: number; height: number };
}
function exportVideo(options: ExportOptions): void {}
```

### Pattern 3: Complex If/Else → Guard Clauses

```ts
// ❌ Before (nested, hard to read)
function getClipLabel(clip: VideoClip): string {
  if (clip.label) {
    if (clip.label.length > 20) {
      return clip.label.slice(0, 20) + '...';
    } else {
      return clip.label;
    }
  } else {
    return `Clip ${clip.id}`;
  }
}

// ✅ After (guard clauses, reads top to bottom)
function getClipLabel(clip: VideoClip): string {
  if (!clip.label) return `Clip ${clip.id}`;
  if (clip.label.length <= 20) return clip.label;
  return `${clip.label.slice(0, 20)}...`;
}
```

### Pattern 4: Implicit Magic Values → Named Constants

```ts
// ❌ Before
if (duration > 3600) { /* ... */ }
const MAX_CLIPS = 50;

// ✅ After
const ONE_HOUR_IN_SECONDS = 3600;
const MAX_CLIPS_PER_TIMELINE = 50;
if (duration > ONE_HOUR_IN_SECONDS) { /* ... */ }
```

### Pattern 5: Oversized Component → Sub-Components + Focused Hook

```tsx
// ❌ Before (300-line component doing everything)
function TimelineEditor() {
  // 50 lines of state
  // 100 lines of handlers
  // 150 lines of JSX
}

// ✅ After
function TimelineEditor() {
  const timeline = useTimelineEditor(); // delegates logic to hook
  return (
    <TimelineContainer>
      <TimelineToolbar actions={timeline.actions} />
      <TimelineTrackList tracks={timeline.tracks} onTrackAction={timeline.handleTrackAction} />
      <TimelinePlayhead position={timeline.playheadPosition} />
    </TimelineContainer>
  );
}
```

---

## Reading a File for Review

When reviewing a file, walk through in this order:

1. **Scan line count** — if > 100, immediately look for extraction candidates
2. **Read function signatures** — names should tell you what the function does without reading the body
3. **Check function bodies** — if you're confused what a line does, it needs a better name or extraction
4. **Check imports** — are any cross-layer imports violating the dependency rule?
5. **Check types** — no `any`, all params/returns typed?
6. **Run the readability checklist** above

---

## Quick Reference: Sandi Metz Numbers

| Rule | Limit |
|---|---|
| Lines per class/component | 100 |
| Lines per function/method | 5 |
| Parameters per function | 4 |
| Domain objects per container | 1 (use Facade for more) |
