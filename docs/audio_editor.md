# Replicate Audio Editor Implementation

Replicate the complete audio editor functionality from the `recordly_dev` reference folder into the current project. This involves implementing custom audio regions with volume control, mute/solo toggles, fade-in/out support, and a "Master Audio" setting for the original video audio.

## Proposed Changes

### [Core Audio Utilities]

#### [NEW] [audioWaveform.ts](file:///d:/Github/Recordly/src/utils/audioWaveform.ts)
- Add utility to extract waveform peaks from audio files using the Web Audio API.

### [Data Structures]

#### [MODIFY] [types.ts](file:///d:/Github/Recordly/src/components/video-editor/types.ts)
- Update `AudioRegion` to include `muted`, `soloed`, `fadeInMs`, and `fadeOutMs`.
- Add `TimeSelection` interface.

### [UI Components]

#### [NEW] [AudioSettingsPanel.tsx](file:///d:/Github/Recordly/src/components/video-editor/AudioSettingsPanel.tsx)
- Replicate the audio settings UI including volume sliders (up to 200%), waveform display, and fade controls.

#### [MODIFY] [SettingsPanel.tsx](file:///d:/Github/Recordly/src/components/video-editor/SettingsPanel.tsx)
- Integrate `AudioSettingsPanel` into the "Audio" section.
- Handle "Master Audio" mocking when the original audio row is selected.

### [Timeline Integration]

#### [MODIFY] [TimelineEditor.tsx](file:///d:/Github/Recordly/src/components/video-editor/timeline/TimelineEditor.tsx)
- Add `ORIGINAL_AUDIO_ROW_ID` and `AUDIO_ROW_ID`.
- Implement selection logic for the "Original Audio" row.
- Add mute/solo/volume indicator controls to the timeline sideboard for audio tracks.

### [State & Audio Engine]

#### [MODIFY] [VideoEditor.tsx](file:///d:/Github/Recordly/src/components/video-editor/VideoEditor.tsx)
- Implement state for `masterAudioVolume`, `masterAudioMuted`, `masterAudioSoloed`.
- Add refs for Web Audio API (`AudioContext`, `GainNode`, etc.).
- Initialize and sync audio nodes with the playback engine.
- Handle state transitions for selecting and modifying audio regions.

## Verification Plan

### Automated Tests
- Use `audio.test.ts` to verify audio logic (if applicable/updated).

### Manual Verification
- Add a custom audio region and verify:
    - Volume slider modifies the gain correctly.
    - Mute and Solo toggles work as expected (mutually exclusive).
    - Fade in/out durations are respected during playback.
    - Waveform UI renders correctly for custom audio files.
- Select the "Original Audio" row in the timeline and verify:
    - The "Original Audio" settings appear in the sidebar.
    - Master volume/mute/solo controls affect the main video audio.
