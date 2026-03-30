// Public entities

export type { CaptionCue, CaptionCueWord } from "@/features/captions/domain/entities/CaptionCue";
export { DEFAULT_FOCUS } from "@/features/editor/components/VideoEditor/videoPlayback/constants";
// Constants
export * from "./domain/constants";
export type {
	AnnotationPosition,
	AnnotationRegion,
	AnnotationSize,
	AnnotationTextStyle,
	AnnotationType,
	ArrowDirection,
	FigureData,
} from "./domain/entities/AnnotationRegion";
export type { AudioRegion } from "./domain/entities/AudioRegion";
export type {
	CursorStyle,
	CursorTelemetryPoint,
	CursorVisualSettings,
} from "./domain/entities/CursorSettings";
export type { EditorProjectData } from "./domain/entities/ProjectData";
// Public state/data
export type { ProjectEditorState } from "./domain/entities/ProjectState";
export type { PlaybackSpeed, SpeedRegion } from "./domain/entities/SpeedRegion";
export { SPEED_OPTIONS } from "./domain/entities/SpeedRegion";
export type { TrimRegion } from "./domain/entities/TrimRegion";
export type {
	WebcamCorner,
	WebcamOverlaySettings,
	WebcamPositionPreset,
} from "./domain/entities/WebcamOverlay";
export type {
	ZoomDepth,
	ZoomFocus,
	ZoomRegion,
	ZoomTransitionEasing,
} from "./domain/entities/ZoomRegion";
export { clampFocusToDepth, ZOOM_DEPTH_SCALES } from "./domain/entities/ZoomRegion";
