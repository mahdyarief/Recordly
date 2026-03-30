export type {
	AutoCaptionAnimation,
	AutoCaptionSettings,
} from "@/features/captions/domain/entities/AutoCaptionSettings";
export { DEFAULT_AUTO_CAPTION_SETTINGS } from "@/features/captions/domain/entities/AutoCaptionSettings";
export type { CaptionCue, CaptionCueWord } from "@/features/captions/domain/entities/CaptionCue";
export type { CropRegion } from "@/features/project/domain/constants";
export {
	DEFAULT_ANNOTATION_POSITION,
	DEFAULT_ANNOTATION_SIZE,
	DEFAULT_ANNOTATION_STYLE,
	DEFAULT_BLUR_INTENSITY,
	DEFAULT_CONNECTED_ZOOM_DURATION_MS,
	DEFAULT_CONNECTED_ZOOM_EASING,
	DEFAULT_CONNECTED_ZOOM_GAP_MS,
	DEFAULT_CROP_REGION,
	DEFAULT_CURSOR_CLICK_BOUNCE,
	DEFAULT_CURSOR_CLICK_BOUNCE_DURATION,
	DEFAULT_CURSOR_MOTION_BLUR,
	DEFAULT_CURSOR_SIZE,
	DEFAULT_CURSOR_SMOOTHING,
	DEFAULT_CURSOR_STYLE,
	DEFAULT_CURSOR_SWAY,
	DEFAULT_FIGURE_DATA,
	DEFAULT_PLAYBACK_SPEED,
	DEFAULT_WEBCAM_CORNER_RADIUS,
	DEFAULT_WEBCAM_MARGIN,
	DEFAULT_WEBCAM_OVERLAY,
	DEFAULT_WEBCAM_POSITION_PRESET,
	DEFAULT_WEBCAM_POSITION_X,
	DEFAULT_WEBCAM_POSITION_Y,
	DEFAULT_WEBCAM_REACT_TO_ZOOM,
	DEFAULT_WEBCAM_SHADOW,
	DEFAULT_WEBCAM_SIZE,
	DEFAULT_ZOOM_DEPTH,
	DEFAULT_ZOOM_IN_DURATION_MS,
	DEFAULT_ZOOM_IN_EASING,
	DEFAULT_ZOOM_IN_OVERLAP_MS,
	DEFAULT_ZOOM_MOTION_BLUR,
	DEFAULT_ZOOM_OUT_DURATION_MS,
	DEFAULT_ZOOM_OUT_EASING,
} from "@/features/project/domain/constants";
export type {
	AnnotationRegion,
	AnnotationType,
	ArrowDirection,
	FigureData,
} from "@/features/project/domain/entities/AnnotationRegion";
export type { AudioRegion } from "@/features/project/domain/entities/AudioRegion";
export type { CursorStyle } from "@/features/project/domain/entities/CursorSettings";
export type { EditorProjectData as ProjectData } from "@/features/project/domain/entities/ProjectData";
export type { PlaybackSpeed, SpeedRegion } from "@/features/project/domain/entities/SpeedRegion";
export { SPEED_OPTIONS } from "@/features/project/domain/entities/SpeedRegion";
export type { TrimRegion } from "@/features/project/domain/entities/TrimRegion";
export type {
	WebcamOverlaySettings,
	WebcamPositionPreset,
} from "@/features/project/domain/entities/WebcamOverlay";
export type {
	ZoomDepth,
	ZoomRegion,
	ZoomTransitionEasing,
} from "@/features/project/domain/entities/ZoomRegion";
export {
	clampFocusToDepth,
	ZOOM_DEPTH_SCALES,
} from "@/features/project/domain/entities/ZoomRegion";
export type {
	CursorTelemetryPoint,
	TimelineMode,
	TimeSelection,
	ZoomFocus,
} from "@/features/timeline/domain/entities/TimelineTypes";
export { getDefaultCaptionFontFamily } from "@/shared/lib/font";
