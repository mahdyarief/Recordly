---
name: implement-facade
description: >
  Implement the Facade pattern when a page/container component needs multiple data
  sources. This satisfies the Sandi Metz rule: "controllers/containers instantiate
  only one object". Use this skill when a component needs data from more than one
  service or feature.
---

# Implement Facade Skill

## When to Use This Skill

Use when:
- A page/container component needs data from **2+ services or features**
- A hook is growing too large because it aggregates many concerns
- You need to expose a unified, simplified interface over a complex subsystem

Do NOT use when:
- The component only needs a single service (use the service directly)
- You are tempted to use it to paper over poor architecture — fix the architecture first

---

## What is a Facade?

A Facade is an object that provides a **single, unified interface** to a set of collaborating objects.
It hides complexity and satisfies the "one object in a controller" rule by aggregating other services.

```
Page Component
     │  (one dependency)
     ▼
  Facade
  ├── ServiceA
  ├── ServiceB
  └── ServiceC
```

---

## Step 1 — Identify Collaborators

List all the services / hooks the component is currently (or would be) calling:
- `videoService.getAll()`
- `audioService.getTrack(id)`
- `exportService.getSettings()`

These become the collaborators of your Facade.

---

## Step 2 — Create the Facade Service

In the relevant feature (or `shared/services/`) create `<PageName>Facade.ts`:

```ts
import type { Video } from '@/features/video';
import type { AudioTrack } from '@/features/audio';
import type { ExportSettings } from '@/features/export';
import { videoService } from '@/features/video';
import { audioService } from '@/features/audio';
import { exportService } from '@/features/export';

/**
 * <PageName>Facade — unified interface for the <PageName> page.
 * Aggregates multiple services to satisfy the single-object-per-container rule.
 */
export class <PageName>Facade {
  async getVideos(): Promise<Video[]> {
    return videoService.getAll();
  }

  async getAudioTrack(id: string): Promise<AudioTrack | null> {
    return audioService.getTrack(id);
  }

  async getExportSettings(): Promise<ExportSettings> {
    return exportService.getSettings();
  }
}

// Singleton instance
export const <pageName>Facade = new <PageName>Facade();
```

Rules:
- Facade methods are **thin delegators** — they call one service and return the result.
- Facade methods must **not contain business logic**.
- Facade is an **application-layer** construct — it lives in `services/` or at page level.
- Facade **MUST NOT** import adapters or infrastructure directly.

---

## Step 3 — Create a Single Hook for the Facade

In `hooks/use<PageName>.ts`:

```ts
import { useState, useEffect } from 'react';
import { <pageName>Facade } from '../services/<PageName>Facade';

/**
 * use<PageName> — single hook providing all data for the <PageName> page.
 */
export function use<PageName>() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [audioTrack, setAudioTrack] = useState<AudioTrack | null>(null);
  const [exportSettings, setExportSettings] = useState<ExportSettings | null>(null);

  useEffect(() => {
    const load = async () => {
      const [vids, audio, settings] = await Promise.all([
        <pageName>Facade.getVideos(),
        <pageName>Facade.getAudioTrack('default'),
        <pageName>Facade.getExportSettings(),
      ]);
      setVideos(vids);
      setAudioTrack(audio);
      setExportSettings(settings);
    };
    load();
  }, []);

  return { videos, audioTrack, exportSettings };
}
```

---

## Step 4 — Use in the Page Component

```tsx
import { use<PageName> } from './hooks/use<PageName>';

/**
 * <PageName> — page container. Receives all data via a single facade hook.
 */
export function <PageName>Page() {
  const facade = use<PageName>();  // One "object" from the component's perspective

  return (
    <>
      <VideoList videos={facade.videos} />
      <AudioPanel track={facade.audioTrack} />
      <ExportPanel settings={facade.exportSettings} />
    </>
  );
}
```

---

## Checklist

- [ ] Page component uses exactly ONE hook as its data source
- [ ] Facade class methods each delegate to exactly ONE service call
- [ ] No business logic inside the Facade
- [ ] Facade is tested by mocking the underlying services
- [ ] Facade file is ≤ 100 lines
