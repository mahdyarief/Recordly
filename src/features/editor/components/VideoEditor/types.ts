import {
	type AutoCaptionAnimation,
	type AutoCaptionSettings,
	DEFAULT_AUTO_CAPTION_SETTINGS,
} from "@/features/captions/domain/entities/AutoCaptionSettings";
import {
	type CaptionCue,
	type CaptionCueWord,
} from "@/features/captions/domain/entities/CaptionCue";
import {
	type CropRegion,
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
import {
	type AnnotationRegion,
	type AnnotationType,
	type ArrowDirection,
	type FigureData,
} from "@/features/project/domain/entities/AnnotationRegion";
import { type AudioRegion } from "@/features/project/domain/entities/AudioRegion";
import { type CursorStyle } from "@/features/project/domain/entities/CursorSettings";
import { type EditorProjectData as ProjectData } from "@/features/project/domain/entities/ProjectData";
import { type ProjectEditorState } from "@/features/project/domain/entities/ProjectState";
import {
	type PlaybackSpeed,
	SPEED_OPTIONS,
	type SpeedRegion,
} from "@/features/project/domain/entities/SpeedRegion";
import { type TrimRegion } from "@/features/project/domain/entities/TrimRegion";
import {
	type WebcamCorner,
	type WebcamOverlaySettings,
	type WebcamPositionPreset,
} from "@/features/project/domain/entities/WebcamOverlay";
import {
	clampFocusToDepth,
	ZOOM_DEPTH_SCALES,
	type ZoomDepth,
	type ZoomRegion,
	type ZoomTransitionEasing,
} from "@/features/project/domain/entities/ZoomRegion";
import {
	type CursorTelemetryPoint,
	type TimelineMode,
	type TimeSelection,
	type ZoomFocus,
} from "@/features/timeline/domain/entities/TimelineTypes";
import { type AspectRatio } from "@/shared/lib/aspectRatio";

export type {
	AutoCaptionAnimation,
	AutoCaptionSettings,
	CaptionCue,
	CaptionCueWord,
	CropRegion,
	AnnotationRegion,
	AnnotationType,
	ArrowDirection,
	FigureData,
	AudioRegion,
	CursorStyle,
	ProjectData,
	ProjectEditorState,
	PlaybackSpeed,
	SpeedRegion,
	TrimRegion,
	WebcamCorner,
	WebcamOverlaySettings,
	WebcamPositionPreset,
	ZoomDepth,
	ZoomRegion,
	ZoomTransitionEasing,
	CursorTelemetryPoint,
	TimelineMode,
	TimeSelection,
	ZoomFocus,
	AspectRatio,
};

export {
	DEFAULT_AUTO_CAPTION_SETTINGS,
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
	SPEED_OPTIONS,
	clampFocusToDepth,
	ZOOM_DEPTH_SCALES,
};

export type TimelineSpan = import("dnd-timeline").Span;

export type ZoomAdded = (span: TimelineSpan) => void;
export type ZoomSuggested = (span: TimelineSpan, focus: ZoomFocus) => void;
export type ZoomSpanChange = (id: string, span: TimelineSpan) => void;
export type ZoomDelete = (id: string) => void;
export type AspectRatioStr = string; // Using a string union elsewhere but this simplifies some prop types
export { getDefaultCaptionFontFamily } from "@/shared/lib/font";

export interface TimelineRenderItem {
	id: string;
	rowId: string;
	span: import("dnd-timeline").Span;
	label: string;
	zoomDepth?: number;
	speedValue?: number;
	audioPath?: string;
	variant: "zoom" | "trim" | "annotation" | "speed" | "audio" | "caption";
	muted?: boolean;
	soloed?: boolean;
	fadeInMs?: number;
	fadeOutMs?: number;
}

export interface VideoPlaybackRef {
	video: HTMLVideoElement | null;
	app: any | null;
	videoSprite: any | null;
	videoContainer: any | null;
	containerRef: React.RefObject<HTMLDivElement | null>;
	play: () => Promise<void>;
	pause: () => void;
	refreshFrame: () => Promise<void>;
	seek: (time: number) => void;
}

export interface OutputDimensions {
	width: number;
	height: number;
}

export type BackgroundTab = "color" | "gradient" | "image";
export type EditorEffectSection =
	| "scene"
	| "zoom"
	| "cursor"
	| "frame"
	| "webcam"
	| "crop"
	| "audio"
	| "caption";

export type {
	ExportFormat,
	ExportQuality,
	GifFrameRate,
	GifSizePreset,
} from "@/features/exporter";

export interface SettingsPanelProps extends Partial<ProjectEditorState> {
	panelMode?: "editor" | "background";
	activeEffectSection?: EditorEffectSection | string;
	selectedZoomId?: string | null;
	selectedTrimId?: string | null;
	selectedSpeedId?: string | null;
	selectedAudioId?: string | null;
	selectedAnnotationId?: string | null;
	selectedCaptionId?: string | null;
	onSeek?: (time: number) => void;
	onAutoSuggestZooms?: () => void;
	onAutoSuggestZoomsConsumed?: () => void;
	onSelectCaption?: (id: string | null) => void;
	onAnnotationContentChange?: (id: string, content: string) => void;
	onAnnotationTypeChange?: (id: string, type: "text" | "image" | "figure" | "blur") => void;
	onAnnotationStyleChange?: (
		id: string,
		style: Partial<
			import("@/features/project/domain/entities/AnnotationRegion").AnnotationTextStyle
		>,
	) => void;
	onAnnotationFigureDataChange?: (id: string, data: any) => void;
	onAnnotationBlurIntensityChange?: (id: string, intensity: number) => void;
	onAnnotationDelete?: (id: string) => void;
	onAutoCaptionSettingsChange?: (v: Partial<ProjectEditorState["autoCaptionSettings"]>) => void;
	onPickWhisperExecutable?: () => void;
	onPickWhisperModel?: () => void;
	onGenerateAutoCaptions?: () => void;
	onClearAutoCaptions?: () => void;
	onDownloadWhisperModel?: () => void;
	onDeleteWhisperModel?: () => void;
	onAudioVolumeChange?: (id: string, volume: number) => void;
	onAudioMutedChange?: (id: string, muted: boolean) => void;
	onAudioSoloedChange?: (id: string, soloed: boolean) => void;
	onAudioFadeInMsChange?: (id: string, ms: number) => void;
	onAudioFadeOutMsChange?: (id: string, ms: number) => void;
	onAudioDelete?: (id: string) => void;
	onMasterAudioVolumeChange?: (v: number) => void;
	onMasterAudioMutedChange?: (v: boolean) => void;
	onMasterAudioSoloedChange?: (v: boolean) => void;
	onSpeedChange?: (id: string, speed: number) => void;
	onSpeedDelete?: (id: string) => void;
	onZoomDepthChange?: (depth: number) => void;
	onZoomDelete?: (id: string) => void;
	onTrimDelete?: (id: string) => void;
	onWallpaperChange?: (w: string) => void;
	onShadowChange?: (v: number) => void;
	onBackgroundBlurChange?: (v: number) => void;
	onZoomMotionBlurChange?: (v: number) => void;
	onConnectZoomsChange?: (v: boolean) => void;
	onZoomInDurationMsChange?: (v: number) => void;
	onZoomInOverlapMsChange?: (v: number) => void;
	onZoomOutDurationMsChange?: (v: number) => void;
	onConnectedZoomGapMsChange?: (v: number) => void;
	onConnectedZoomDurationMsChange?: (v: number) => void;
	onZoomInEasingChange?: (v: string) => void;
	onZoomOutEasingChange?: (v: string) => void;
	onConnectedZoomEasingChange?: (v: string) => void;
	onShowCursorChange?: (v: boolean) => void;
	onLoopCursorChange?: (v: boolean) => void;
	onCursorStyleChange?: (
		v: import("@/features/project/domain/entities/CursorSettings").CursorStyle,
	) => void;
	onCursorSizeChange?: (v: number) => void;
	onCursorSmoothingChange?: (v: number) => void;
	onCursorMotionBlurChange?: (v: number) => void;
	onCursorClickBounceChange?: (v: number) => void;
	onCursorClickBounceDurationChange?: (v: number) => void;
	onCursorSwayChange?: (v: number) => void;
	onBorderRadiusChange?: (v: number) => void;
	onWebcamChange?: (
		v: import("@/features/project/domain/entities/WebcamOverlay").WebcamOverlaySettings,
	) => void;
	onUploadWebcam?: () => void;
	onClearWebcam?: () => void;
	onPaddingChange?: (v: number) => void;
	onCropChange?: (v: import("@/features/project/domain/constants").CropRegion) => void;
	onAspectRatioChange?: (v: import("@/shared/lib/aspectRatio").AspectRatio) => void;
	onAutoCaptionsChange?: (
		v: import("@/features/captions/domain/entities/CaptionCue").CaptionCue[],
	) => void;
	selectedZoomDepth?: number | null;
	selectedSpeedValue?: number | null;
	timeSelection?: TimeSelection | null;
	videoDuration?: number;
	videoPath?: string;
	whisperExecutablePath?: string | null;
	whisperModelPath?: string | null;
	whisperModelDownloadStatus?: "idle" | "downloading" | "ready" | "error";
	whisperModelDownloadProgress?: number;
	isGeneratingCaptions?: boolean;
	autoCaptionProgress?: number;
	// Mystery props from EditorContent
	resetZoomSection?: () => void;
	handleDeleteClick?: (id: string) => void;
	initialEditorPreferences?: any;
	handleRemoveBackgroundToggle?: () => void;
	resetFrameSection?: () => void;
	isCropped?: boolean;
	resetCropSection?: () => void;
	zoomEnabled?: boolean;
	removeBackgroundEnabled?: boolean;
	crop?: import("@/features/project/domain/constants").CropRegion;
	setCropInset?: (inset: any) => void;
	resetCursorSection?: () => void;
	resetWebcamSection?: () => void;
	cursorPreviewUrls?: Partial<Record<"tahoe" | "figma" | "mono", string>>;
	autoSuggestZoomsTrigger?: number;
	isMasterSelected?: boolean;
	masterAudioVolume?: number;
	masterAudioMuted?: boolean;
	masterAudioSoloed?: boolean;
}

export interface VideoPlaybackProps extends Partial<ProjectEditorState> {
	videoPath?: string;
	webcamVideoPath?: string | null;
	volume?: number;
	duration?: number;
	currentTime: number;
	isPlaying: boolean;
	onDurationChange?: (duration: number) => void;
	onTimeUpdate?: (time: number) => void;
	onPlayStateChange?: (playing: boolean) => void;
	onError?: (error: string | null) => void;
	onSelectZoom?: (id: string | null) => void;
	onZoomFocusChange?: (id: string, focus: ZoomFocus) => void;
	onSelectAnnotation?: (id: string | null) => void;
	onAnnotationPositionChange?: (id: string, position: { x: number; y: number }) => void;
	onAnnotationSizeChange?: (id: string, size: { width: number; height: number }) => void;
	cursorTelemetry?: CursorTelemetryPoint[];
	timeSelection?: TimeSelection | null;
}
export interface TimelineActionsCallbacks {
	onZoomAdded: (span: TimelineSpan) => void;
	onZoomSuggested: (span: TimelineSpan, focus: ZoomFocus) => void;
	onZoomSpanChange: (id: string, span: TimelineSpan) => void;
	onZoomDelete: (id: string) => void;
	onSelectZoom: (id: string | null) => void;
	onTrimAdded: (span: TimelineSpan) => void;
	onTrimSpanChange: (id: string, span: TimelineSpan) => void;
	onTrimDelete: (id: string) => void;
	onSelectTrim: (id: string | null) => void;
	onAnnotationAdded: (span: TimelineSpan) => void;
	onAnnotationSpanChange: (id: string, span: TimelineSpan) => void;
	onAnnotationDelete: (id: string) => void;
	onSelectAnnotation: (id: string | null) => void;
	onSpeedAdded: (span: TimelineSpan) => void;
	onSpeedSpanChange: (id: string, span: TimelineSpan) => void;
	onSpeedDelete: (id: string) => void;
	onSelectSpeed: (id: string | null) => void;
	onAudioAdded: (span: TimelineSpan) => void;
	onAudioSpanChange: (id: string, span: TimelineSpan) => void;
	onAudioDelete: (id: string) => void;
	onSelectAudio: (id: string | null) => void;
	onCaptionSpanChange: (id: string, span: TimelineSpan) => void;
	onSelectCaption: (id: string | null) => void;
	onClearAutoCaptions: () => void;
	onTimeSelectionChange: (selection: TimeSelection | null) => void;
	onSelectMaster: (selected: boolean) => void;
}

export interface TimelineEditorProps extends TimelineActionsCallbacks {
	zoomRegions: ZoomRegion[];
	trimRegions: TrimRegion[];
	annotationRegions: AnnotationRegion[];
	speedRegions: SpeedRegion[];
	audioRegions: AudioRegion[];
	autoCaptions: CaptionCue[];
	videoPath?: string;
	masterAudioMuted: boolean;
	cursorTelemetry: CursorTelemetryPoint[];
	disableSuggestedZooms?: boolean;
	timeSelection: TimeSelection | null;
	onTimelineModeChange?: (mode: TimelineMode) => void;
	currentTimeMs: number;
	totalMs: number;
	selectedZoomId?: string | null;
	selectedTrimId?: string | null;
	selectedAnnotationId?: string | null;
	selectedSpeedId?: string | null;
	selectedAudioId?: string | null;
	selectedCaptionId?: string | null;
}
