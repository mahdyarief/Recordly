import type { AutoCaptionSettings } from "@/features/captions/domain/entities/AutoCaptionSettings";
import type { CaptionCue } from "@/features/captions/domain/entities/CaptionCue";
import {
	ZOOM_SCALE_DEADZONE,
	ZOOM_TRANSLATION_DEADZONE_PX,
} from "@/features/editor/components/VideoEditor/videoPlayback/constants";
import { findDominantRegion } from "@/features/editor/components/VideoEditor/videoPlayback/zoomRegionUtils";
import {
	computeFocusFromTransform,
	computeZoomTransform,
} from "@/features/editor/components/VideoEditor/videoPlayback/zoomTransform";
import type {
	AnnotationRegion,
	CropRegion,
	CursorStyle,
	SpeedRegion,
	WebcamOverlaySettings,
	ZoomDepth,
	ZoomFocus,
	ZoomRegion,
	ZoomTransitionEasing,
} from "@/features/project";
import { DEFAULT_FOCUS, ZOOM_DEPTH_SCALES } from "@/features/project";
import type { CursorTelemetryPoint } from "@/features/timeline/domain/entities/TimelineTypes";

export interface FrameRenderConfig {
	width: number;
	height: number;
	wallpaper: string;
	zoomRegions: ZoomRegion[];
	showShadow: boolean;
	shadowIntensity: number;
	backgroundBlur: number;
	zoomMotionBlur?: number;
	connectZooms?: boolean;
	zoomInDurationMs?: number;
	zoomInOverlapMs?: number;
	zoomOutDurationMs?: number;
	connectedZoomGapMs?: number;
	connectedZoomDurationMs?: number;
	zoomInEasing?: ZoomTransitionEasing;
	zoomOutEasing?: ZoomTransitionEasing;
	connectedZoomEasing?: ZoomTransitionEasing;
	borderRadius?: number;
	padding?: number;
	cropRegion: CropRegion;
	webcam?: WebcamOverlaySettings;
	webcamUrl?: string | null;
	videoWidth: number;
	videoHeight: number;
	annotationRegions?: AnnotationRegion[];
	autoCaptions?: CaptionCue[];
	autoCaptionSettings?: AutoCaptionSettings;
	speedRegions?: SpeedRegion[];
	previewWidth?: number;
	previewHeight?: number;
	cursorTelemetry?: CursorTelemetryPoint[];
	showCursor?: boolean;
	cursorStyle?: CursorStyle;
	cursorSize?: number;
	cursorSmoothing?: number;
	cursorMotionBlur?: number;
	cursorClickBounce?: number;
	cursorClickBounceDuration?: number;
	cursorSway?: number;
}

export interface AnimationState {
	scale: number;
	appliedScale: number;
	focusX: number;
	focusY: number;
	progress: number;
	x: number;
	y: number;
}

export function createAnimationState(): AnimationState {
	return {
		scale: 1,
		appliedScale: 1,
		focusX: DEFAULT_FOCUS.cx,
		focusY: DEFAULT_FOCUS.cy,
		progress: 0,
		x: 0,
		y: 0,
	};
}

export interface LayoutResult {
	stageSize: { width: number; height: number };
	videoSize: { width: number; height: number };
	baseScale: number;
	baseOffset: { x: number; y: number };
	maskRect: {
		x: number;
		y: number;
		width: number;
		height: number;
		sourceCrop: CropRegion;
	};
	scaledBorderRadius: number;
}

export function calculateLayout(config: FrameRenderConfig): LayoutResult {
	const {
		width,
		height,
		cropRegion,
		borderRadius = 0,
		padding = 0,
		videoWidth,
		videoHeight,
		previewWidth = 1920,
		previewHeight = 1080,
	} = config;

	// Calculate cropped video dimensions
	const cropStartX = cropRegion.x;
	const cropStartY = cropRegion.y;
	const cropEndX = cropRegion.x + cropRegion.width;
	const cropEndY = cropRegion.y + cropRegion.height;

	const croppedVideoWidth = videoWidth * (cropEndX - cropStartX);
	const croppedVideoHeight = videoHeight * (cropEndY - cropStartY);

	const paddingScale = 1.0 - (padding / 100) * 0.4;
	const viewportWidth = width * paddingScale;
	const viewportHeight = height * paddingScale;
	const scale = Math.min(viewportWidth / croppedVideoWidth, viewportHeight / croppedVideoHeight);

	const fullVideoDisplayWidth = videoWidth * scale;
	const fullVideoDisplayHeight = videoHeight * scale;
	const croppedDisplayWidth = croppedVideoWidth * scale;
	const croppedDisplayHeight = croppedVideoHeight * scale;
	const centerOffsetX = (width - croppedDisplayWidth) / 2;
	const centerOffsetY = (height - croppedDisplayHeight) / 2;

	const spriteX = centerOffsetX - cropRegion.x * fullVideoDisplayWidth;
	const spriteY = centerOffsetY - cropRegion.y * fullVideoDisplayHeight;

	const canvasScaleFactor = Math.min(width / previewWidth, height / previewHeight);
	const scaledBorderRadius = borderRadius * canvasScaleFactor;

	return {
		stageSize: { width, height },
		videoSize: { width: croppedVideoWidth, height: croppedVideoHeight },
		baseScale: scale,
		baseOffset: { x: spriteX, y: spriteY },
		maskRect: {
			x: centerOffsetX,
			y: centerOffsetY,
			width: croppedDisplayWidth,
			height: croppedDisplayHeight,
			sourceCrop: cropRegion,
		},
		scaledBorderRadius,
	};
}

export interface AnimationUpdate {
	state: AnimationState;
	motionIntensity: number;
	motionVector: { x: number; y: number };
}

export function calculateAnimationState(
	config: FrameRenderConfig,
	state: AnimationState,
	layoutCache: LayoutResult,
	timeMs: number,
): AnimationUpdate {
	const { region, strength, blendedScale, transition } = findDominantRegion(
		config.zoomRegions,
		timeMs,
		{
			connectZooms: config.connectZooms,
		},
	);

	const defaultFocus = DEFAULT_FOCUS;
	let targetScaleFactor = 1;
	let targetFocus = { ...defaultFocus };
	let targetProgress = 0;

	if (region && strength > 0) {
		const zoomScale = blendedScale ?? ZOOM_DEPTH_SCALES[region.depth as ZoomDepth];
		const regionFocus = region.focus;

		targetScaleFactor = zoomScale;
		targetFocus = regionFocus as ZoomFocus;
		targetProgress = strength;

		if (transition) {
			const startTransform = computeZoomTransform({
				stageSize: layoutCache.stageSize,
				baseMask: layoutCache.maskRect,
				zoomScale: transition.startScale,
				zoomProgress: 1,
				focusX: transition.startFocus.cx,
				focusY: transition.startFocus.cy,
			});
			const endTransform = computeZoomTransform({
				stageSize: layoutCache.stageSize,
				baseMask: layoutCache.maskRect,
				zoomScale: transition.endScale,
				zoomProgress: 1,
				focusX: transition.endFocus.cx,
				focusY: transition.endFocus.cy,
			});

			const interpolatedTransform = {
				scale:
					startTransform.scale + (endTransform.scale - startTransform.scale) * transition.progress,
				x: startTransform.x + (endTransform.x - startTransform.x) * transition.progress,
				y: startTransform.y + (endTransform.y - startTransform.y) * transition.progress,
			};

			targetScaleFactor = interpolatedTransform.scale;
			targetFocus = computeFocusFromTransform({
				stageSize: layoutCache.stageSize,
				baseMask: layoutCache.maskRect,
				zoomScale: interpolatedTransform.scale,
				x: interpolatedTransform.x,
				y: interpolatedTransform.y,
			}) as ZoomFocus;
			targetProgress = 1;
		}
	}

	const newState = { ...state };

	const prevScale = state.appliedScale;
	const prevX = state.x;
	const prevY = state.y;

	newState.scale = targetScaleFactor;
	newState.focusX = targetFocus.cx;
	newState.focusY = targetFocus.cy;
	newState.progress = targetProgress;

	const projectedTransform = computeZoomTransform({
		stageSize: layoutCache.stageSize,
		baseMask: layoutCache.maskRect,
		zoomScale: newState.scale,
		zoomProgress: newState.progress,
		focusX: newState.focusX,
		focusY: newState.focusY,
	});

	newState.appliedScale =
		Math.abs(projectedTransform.scale - prevScale) < ZOOM_SCALE_DEADZONE
			? projectedTransform.scale
			: projectedTransform.scale;
	newState.x =
		Math.abs(projectedTransform.x - prevX) < ZOOM_TRANSLATION_DEADZONE_PX
			? projectedTransform.x
			: projectedTransform.x;
	newState.y =
		Math.abs(projectedTransform.y - prevY) < ZOOM_TRANSLATION_DEADZONE_PX
			? projectedTransform.y
			: projectedTransform.y;

	const motionVector = {
		x: newState.x - prevX,
		y: newState.y - prevY,
	};

	const motionIntensity = Math.max(
		Math.abs(newState.appliedScale - prevScale),
		Math.abs(newState.x - prevX) / Math.max(1, layoutCache.stageSize.width),
		Math.abs(newState.y - prevY) / Math.max(1, layoutCache.stageSize.height),
	);

	return {
		state: newState,
		motionIntensity,
		motionVector,
	};
}
