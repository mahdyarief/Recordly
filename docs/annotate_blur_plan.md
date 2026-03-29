# Implementation Plan - Blur Annotation Feature

This plan outlines the steps to add a "Blur" annotation type, allowing users to obscure sensitive information in their recordings.

## User Review Required

> [!IMPORTANT]
> **Performance Impact**: Localized blurring in the preview (PixiJS) requires a second render pass of the video content. I will optimize this by only enabling the blur container when at least one blur annotation is active.
> 
> **Export Consistency**: The export engine (Canvas2D) will use `ctx.filter` for blurring. We must ensure the blur radius appears consistent between the high-resolution export and the responsive preview.

---

## Proposed Changes

### 1. Data Models & Types
#### [MODIFY] [types.ts](file:///d:/Github/Recordly/src/components/video-editor/types.ts)
- Add `'blur'` to `AnnotationType`.
- Add `blurIntensity?: number` to `AnnotationRegion` (range: 0-100, default: 20).

### 2. Editor UI (React)
#### [MODIFY] [AnnotationOverlay.tsx](file:///d:/Github/Recordly/src/components/video-editor/AnnotationOverlay.tsx)
- Add a visual representation for the blur region in the interactive layer.
- Render a semi-transparent slate box with a dashed border and a "Blur" label to indicate the obscured area to the user while editing.

#### [MODIFY] [AnnotationSettingsPanel.tsx](file:///d:/Github/Recordly/src/components/video-editor/AnnotationSettingsPanel.tsx)
- Add a "Blur" tab to the annotation type selector.
- When `type === 'blur'`, show a `Slider` to control `blurIntensity`.
- Ensure text/image/figure controls are hidden for blur annotations.

### 3. Preview Rendering (PixiJS)
#### [MODIFY] [VideoPlayback.tsx](file:///d:/Github/Recordly/src/components/video-editor/VideoPlayback.tsx)
- Initialize a `blurContainer` and a `blurMask` (Graphics).
- Apply a `BlurFilter` to the `blurContainer`.
- In the `ticker` (render loop):
    - Identify active blur annotations for the current timestamp.
    - If active:
        - Draw their rectangles into `blurMask`.
        - Ensure `blurContainer` contains a sprite/texture of the *current video frame*.
        - Enable the container.
    - If none active: Disable `blurContainer` to save performance.

### 4. Export Rendering (Canvas2D)
#### [MODIFY] [annotationRenderer.ts](file:///d:/Github/Recordly/src/lib/exporter/annotationRenderer.ts)
- Update `renderAnnotations` to handle the `blur` type.
- Since this renderer uses a 2D Canvas context, implement the blur by:
    1. Saving the context state.
    2. Clipping to the annotation rectangle.
    3. Applying `ctx.filter = 'blur(...)'`.
    4. Redrawing the source video frame into the clipped region.
    5. Restoring the context.

---

## Open Questions
- **Blur Shape**: Should we support rounded corners for the blur (matches the UI style) or strictly rectangular? (Plan: Default to rectangular for performance, but can add `borderRadius` support if requested).
- **Default Intensity**: Is `20px` a good default, or should it be higher for "censorship" purposes?

---

## Verification Plan

### Automated Tests
- Run `npm test` to ensure existing annotation logic (text/arrows) isn't regressed.
- Add a test case in `annotationRenderer.test.ts` (if it exists) to verify the blur case doesn't crash the export pipeline.

### Manual Verification
1. Add a blur annotation in the editor.
2. Verify it obscures the video content in the preview.
3. Resize/move the blur region and verify it stays synced.
4. Change blur intensity and observe real-time updates.
5. Export a short clip and verify the blur is correctly "baked" into the final MP4/GIF.
