import {
	AutoCaptionSettings,
	DEFAULT_AUTO_CAPTION_SETTINGS as CAPTION_DEFAULTS,
} from "@/features/captions/domain/entities/AutoCaptionSettings";
import { ExportFormat, ExportQuality, GifFrameRate, GifSizePreset } from "@/features/exporter";
import { ASPECT_RATIOS, AspectRatio, isCustomAspectRatio } from "@/shared/lib/aspectRatio";
import { clamp, isFiniteNumber } from "@/shared/lib/math";
import { DEFAULT_WALLPAPER_PATH } from "@/shared/lib/wallpapers";
import { CaptionCue, normalizeCaptionCue } from "../../../captions/domain/entities/CaptionCue";
import {
	CropRegion,
	DEFAULT_ANNOTATION_STYLE,
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
	DEFAULT_PLAYBACK_SPEED,
	DEFAULT_WEBCAM_OVERLAY,
	DEFAULT_ZOOM_DEPTH,
	DEFAULT_ZOOM_IN_DURATION_MS,
	DEFAULT_ZOOM_IN_EASING,
	DEFAULT_ZOOM_IN_OVERLAP_MS,
	DEFAULT_ZOOM_MOTION_BLUR,
	DEFAULT_ZOOM_OUT_DURATION_MS,
	DEFAULT_ZOOM_OUT_EASING,
} from "../constants";
import { AnnotationRegion } from "./AnnotationRegion";
import { AudioRegion, normalizeAudioRegion } from "./AudioRegion";
import { CursorStyle, normalizeCursorStyle } from "./CursorSettings";
import { normalizeSpeedRegion, SpeedRegion } from "./SpeedRegion";
import { normalizeTrimRegion, TrimRegion } from "./TrimRegion";
import { normalizeWebcamOverlay, WebcamOverlaySettings } from "./WebcamOverlay";
import {
	normalizeZoomRegion,
	normalizeZoomTransitionEasing,
	ZoomRegion,
	ZoomTransitionEasing,
} from "./ZoomRegion";

export interface ProjectEditorState {
	wallpaper: string;
	shadowIntensity: number;
	backgroundBlur: number;
	zoomMotionBlur: number;
	connectZooms: boolean;
	zoomInDurationMs: number;
	zoomInOverlapMs: number;
	zoomOutDurationMs: number;
	connectedZoomGapMs: number;
	connectedZoomDurationMs: number;
	zoomInEasing: ZoomTransitionEasing;
	zoomOutEasing: ZoomTransitionEasing;
	connectedZoomEasing: ZoomTransitionEasing;
	showCursor: boolean;
	loopCursor: boolean;
	cursorStyle: CursorStyle;
	cursorSize: number;
	cursorSmoothing: number;
	cursorMotionBlur: number;
	cursorClickBounce: number;
	cursorClickBounceDuration: number;
	cursorSway: number;
	borderRadius: number;
	padding: number;
	cropRegion: CropRegion;
	zoomRegions: ZoomRegion[];
	trimRegions: TrimRegion[];
	speedRegions: SpeedRegion[];
	annotationRegions: AnnotationRegion[];
	audioRegions: AudioRegion[];
	autoCaptions: CaptionCue[];
	autoCaptionSettings: AutoCaptionSettings;
	webcam: WebcamOverlaySettings;
	aspectRatio: AspectRatio;
	exportQuality: ExportQuality;
	exportFormat: ExportFormat;
	gifFrameRate: GifFrameRate;
	gifLoop: boolean;
	gifSizePreset: GifSizePreset;
	masterAudioMuted: boolean;
	masterAudioSoloed: boolean;
	masterAudioVolume: number;
	audioTrackVolume: number;
	isMasterSelected: boolean;
}

export function normalizeProjectEditor(editor: Partial<ProjectEditorState>): ProjectEditorState {
	const validAspectRatios = new Set<AspectRatio>(ASPECT_RATIOS);

	// Legacy support
	const legacyMotionBlurEnabled = (editor as any).motionBlurEnabled;
	const legacyShowBlur = (editor as any).showBlur;

	const normalizedZoomMotionBlur = isFiniteNumber(editor.zoomMotionBlur)
		? clamp(editor.zoomMotionBlur, 0, 2)
		: legacyMotionBlurEnabled
			? 0.35
			: DEFAULT_ZOOM_MOTION_BLUR;

	const normalizedBackgroundBlur = isFiniteNumber(editor.backgroundBlur)
		? clamp(editor.backgroundBlur, 0, 8)
		: legacyShowBlur
			? 2
			: 0;

	const normalizedZoomInDurationMs = isFiniteNumber(editor.zoomInDurationMs)
		? clamp(editor.zoomInDurationMs, 60, 4000)
		: DEFAULT_ZOOM_IN_DURATION_MS;

	const normalizedZoomInOverlapMs = isFiniteNumber(editor.zoomInOverlapMs)
		? clamp(editor.zoomInOverlapMs, 0, normalizedZoomInDurationMs)
		: DEFAULT_ZOOM_IN_OVERLAP_MS;

	const normalizedZoomOutDurationMs = isFiniteNumber(editor.zoomOutDurationMs)
		? clamp(editor.zoomOutDurationMs, 60, 4000)
		: DEFAULT_ZOOM_OUT_DURATION_MS;

	const normalizedConnectedZoomGapMs = isFiniteNumber(editor.connectedZoomGapMs)
		? clamp(editor.connectedZoomGapMs, 0, 5000)
		: DEFAULT_CONNECTED_ZOOM_GAP_MS;

	const normalizedConnectedZoomDurationMs = isFiniteNumber(editor.connectedZoomDurationMs)
		? clamp(editor.connectedZoomDurationMs, 60, 4000)
		: DEFAULT_CONNECTED_ZOOM_DURATION_MS;

	const normalizedZoomRegions = (
		Array.isArray(editor.zoomRegions)
			? editor.zoomRegions
					.map((r: any) => normalizeZoomRegion(r, DEFAULT_ZOOM_DEPTH))
					.filter((r: ZoomRegion | null): r is ZoomRegion => r !== null)
			: []
	) as ZoomRegion[];

	const normalizedTrimRegions = (
		Array.isArray(editor.trimRegions)
			? editor.trimRegions
					.map((r: any) => normalizeTrimRegion(r))
					.filter((r: TrimRegion | null): r is TrimRegion => r !== null)
			: []
	) as TrimRegion[];

	const normalizedSpeedRegions = (
		Array.isArray(editor.speedRegions)
			? editor.speedRegions
					.map((r: any) => normalizeSpeedRegion(r, DEFAULT_PLAYBACK_SPEED))
					.filter((r: SpeedRegion | null): r is SpeedRegion => r !== null)
			: []
	) as SpeedRegion[];

	const normalizedAudioRegions = (
		Array.isArray(editor.audioRegions)
			? editor.audioRegions
					.map((r: any) => normalizeAudioRegion(r))
					.filter((r: AudioRegion | null): r is AudioRegion => r !== null)
			: []
	) as AudioRegion[];

	const normalizedAutoCaptions = (
		Array.isArray(editor.autoCaptions)
			? editor.autoCaptions
					.map((r: any) => normalizeCaptionCue(r))
					.filter((r: CaptionCue | null): r is CaptionCue => r !== null && r.text.length > 0)
			: []
	) as CaptionCue[];

	// TODO: Move Annotation normalization logic to its own entity when ready
	const normalizedAnnotationRegions: AnnotationRegion[] = Array.isArray(editor.annotationRegions)
		? editor.annotationRegions
				.filter((region: any): region is AnnotationRegion =>
					Boolean(region && typeof region.id === "string"),
				)
				.map((region: any, index: number) => {
					const rawStart = isFiniteNumber(region.startMs) ? Math.round(region.startMs) : 0;
					const rawEnd = isFiniteNumber(region.endMs) ? Math.round(region.endMs) : rawStart + 1000;
					const startMs = Math.max(0, Math.min(rawStart, rawEnd));
					const endMs = Math.max(startMs + 1, rawEnd);

					return {
						id: region.id,
						startMs,
						endMs,
						type:
							region.type === "image" || region.type === "figure" || region.type === "blur"
								? region.type
								: "text",
						content: typeof region.content === "string" ? region.content : "",
						textContent: typeof region.textContent === "string" ? region.textContent : undefined,
						imageContent: typeof region.imageContent === "string" ? region.imageContent : undefined,
						position: {
							x: clamp(isFiniteNumber(region.position?.x) ? region.position.x : 50, 0, 100),
							y: clamp(isFiniteNumber(region.position?.y) ? region.position.y : 50, 0, 100),
						},
						size: {
							width: clamp(isFiniteNumber(region.size?.width) ? region.size.width : 30, 1, 200),
							height: clamp(isFiniteNumber(region.size?.height) ? region.size.height : 20, 1, 200),
						},
						style: {
							...DEFAULT_ANNOTATION_STYLE,
							...(region.style && typeof region.style === "object" ? region.style : {}),
						},
						zIndex: isFiniteNumber(region.zIndex) ? region.zIndex : index + 1,
						figureData: region.figureData
							? {
									...{ arrowDirection: "right", color: "#2563EB", strokeWidth: 4 },
									...region.figureData,
								}
							: undefined,
						blurIntensity: isFiniteNumber(region.blurIntensity) ? region.blurIntensity : undefined,
					};
				})
		: [];

	const rawAutoCaptionSettings: Partial<AutoCaptionSettings> =
		editor.autoCaptionSettings && typeof editor.autoCaptionSettings === "object"
			? (editor.autoCaptionSettings as Partial<AutoCaptionSettings>)
			: {};

	const normalizedAutoCaptionSettings: AutoCaptionSettings = {
		enabled:
			typeof rawAutoCaptionSettings.enabled === "boolean"
				? rawAutoCaptionSettings.enabled
				: CAPTION_DEFAULTS.enabled,
		language:
			typeof rawAutoCaptionSettings.language === "string" && rawAutoCaptionSettings.language.trim()
				? rawAutoCaptionSettings.language.trim()
				: CAPTION_DEFAULTS.language,
		fontFamily: rawAutoCaptionSettings.fontFamily || (CAPTION_DEFAULTS.fontFamily ?? "Inter"),
		fontSize: isFiniteNumber(rawAutoCaptionSettings.fontSize)
			? clamp(rawAutoCaptionSettings.fontSize, 16, 72)
			: CAPTION_DEFAULTS.fontSize,
		bottomOffset: isFiniteNumber(rawAutoCaptionSettings.bottomOffset)
			? clamp(rawAutoCaptionSettings.bottomOffset, 0, 30)
			: CAPTION_DEFAULTS.bottomOffset,
		maxWidth: isFiniteNumber(rawAutoCaptionSettings.maxWidth)
			? clamp(rawAutoCaptionSettings.maxWidth, 40, 95)
			: CAPTION_DEFAULTS.maxWidth,
		maxRows: isFiniteNumber(rawAutoCaptionSettings.maxRows)
			? clamp(Math.round(rawAutoCaptionSettings.maxRows), 1, 4)
			: CAPTION_DEFAULTS.maxRows,
		animationStyle: rawAutoCaptionSettings.animationStyle || CAPTION_DEFAULTS.animationStyle,
		selectedModel: rawAutoCaptionSettings.selectedModel || CAPTION_DEFAULTS.selectedModel,
		boxRadius: isFiniteNumber(rawAutoCaptionSettings.boxRadius)
			? clamp(rawAutoCaptionSettings.boxRadius, 0, 40)
			: CAPTION_DEFAULTS.boxRadius,
		textColor: rawAutoCaptionSettings.textColor || CAPTION_DEFAULTS.textColor,
		inactiveTextColor:
			rawAutoCaptionSettings.inactiveTextColor || CAPTION_DEFAULTS.inactiveTextColor,
		backgroundOpacity: isFiniteNumber(rawAutoCaptionSettings.backgroundOpacity)
			? clamp(rawAutoCaptionSettings.backgroundOpacity, 0, 1)
			: CAPTION_DEFAULTS.backgroundOpacity,
		generationRange: rawAutoCaptionSettings.generationRange || "full",
	};

	const rawCropX = isFiniteNumber(editor.cropRegion?.x)
		? editor.cropRegion!.x
		: DEFAULT_CROP_REGION.x;
	const rawCropY = isFiniteNumber(editor.cropRegion?.y)
		? editor.cropRegion!.y
		: DEFAULT_CROP_REGION.y;
	const rawCropWidth = isFiniteNumber(editor.cropRegion?.width)
		? editor.cropRegion!.width
		: DEFAULT_CROP_REGION.width;
	const rawCropHeight = isFiniteNumber(editor.cropRegion?.height)
		? editor.cropRegion!.height
		: DEFAULT_CROP_REGION.height;

	const cropX = clamp(rawCropX, 0, 1);
	const cropY = clamp(rawCropY, 0, 1);
	const cropWidth = clamp(rawCropWidth, 0.01, 1 - cropX);
	const cropHeight = clamp(rawCropHeight, 0.01, 1 - cropY);

	const webcam: WebcamOverlaySettings = normalizeWebcamOverlay(
		editor.webcam,
		DEFAULT_WEBCAM_OVERLAY,
	);

	return {
		wallpaper: typeof editor.wallpaper === "string" ? editor.wallpaper : DEFAULT_WALLPAPER_PATH,
		shadowIntensity: typeof editor.shadowIntensity === "number" ? editor.shadowIntensity : 0.67,
		backgroundBlur: normalizedBackgroundBlur,
		zoomMotionBlur: normalizedZoomMotionBlur,
		connectZooms: typeof editor.connectZooms === "boolean" ? editor.connectZooms : true,
		zoomInDurationMs: normalizedZoomInDurationMs,
		zoomInOverlapMs: normalizedZoomInOverlapMs,
		zoomOutDurationMs: normalizedZoomOutDurationMs,
		connectedZoomGapMs: normalizedConnectedZoomGapMs,
		connectedZoomDurationMs: normalizedConnectedZoomDurationMs,
		zoomInEasing: normalizeZoomTransitionEasing(editor.zoomInEasing, DEFAULT_ZOOM_IN_EASING),
		zoomOutEasing: normalizeZoomTransitionEasing(editor.zoomOutEasing, DEFAULT_ZOOM_OUT_EASING),
		connectedZoomEasing: normalizeZoomTransitionEasing(
			editor.connectedZoomEasing,
			DEFAULT_CONNECTED_ZOOM_EASING,
		),
		showCursor: typeof editor.showCursor === "boolean" ? editor.showCursor : true,
		loopCursor: typeof editor.loopCursor === "boolean" ? editor.loopCursor : false,
		cursorStyle: normalizeCursorStyle(editor.cursorStyle, DEFAULT_CURSOR_STYLE),
		cursorSize: isFiniteNumber(editor.cursorSize)
			? clamp(editor.cursorSize, 0.5, 10)
			: DEFAULT_CURSOR_SIZE,
		cursorSmoothing: isFiniteNumber(editor.cursorSmoothing)
			? clamp(editor.cursorSmoothing, 0, 2)
			: DEFAULT_CURSOR_SMOOTHING,
		cursorMotionBlur: isFiniteNumber(editor.cursorMotionBlur)
			? clamp(editor.cursorMotionBlur as number, 0, 2)
			: DEFAULT_CURSOR_MOTION_BLUR,
		cursorClickBounce: isFiniteNumber(editor.cursorClickBounce)
			? clamp(editor.cursorClickBounce as number, 0, 5)
			: DEFAULT_CURSOR_CLICK_BOUNCE,
		cursorClickBounceDuration: isFiniteNumber(editor.cursorClickBounceDuration)
			? clamp(editor.cursorClickBounceDuration as number, 60, 500)
			: DEFAULT_CURSOR_CLICK_BOUNCE_DURATION,
		cursorSway: isFiniteNumber(editor.cursorSway)
			? clamp(editor.cursorSway as number, 0, 2)
			: DEFAULT_CURSOR_SWAY,
		borderRadius: typeof editor.borderRadius === "number" ? editor.borderRadius : 12.5,
		padding: isFiniteNumber(editor.padding) ? clamp(editor.padding, 0, 100) : 20,
		cropRegion: {
			x: cropX,
			y: cropY,
			width: cropWidth,
			height: cropHeight,
		},
		zoomRegions: normalizedZoomRegions,
		trimRegions: normalizedTrimRegions,
		speedRegions: normalizedSpeedRegions,
		annotationRegions: normalizedAnnotationRegions,
		audioRegions: normalizedAudioRegions,
		autoCaptions: normalizedAutoCaptions,
		autoCaptionSettings: normalizedAutoCaptionSettings,
		webcam,
		aspectRatio:
			typeof editor.aspectRatio === "string" &&
			(validAspectRatios.has(editor.aspectRatio as AspectRatio) ||
				isCustomAspectRatio(editor.aspectRatio))
				? (editor.aspectRatio as AspectRatio)
				: "16:9",
		exportQuality:
			editor.exportQuality === "medium" ||
			editor.exportQuality === "good" ||
			editor.exportQuality === "high" ||
			editor.exportQuality === "source"
				? editor.exportQuality
				: "good",
		exportFormat: editor.exportFormat === "gif" ? "gif" : "mp4",
		gifFrameRate:
			editor.gifFrameRate === 15 ||
			editor.gifFrameRate === 20 ||
			editor.gifFrameRate === 25 ||
			editor.gifFrameRate === 30
				? editor.gifFrameRate
				: 15,
		gifLoop: typeof editor.gifLoop === "boolean" ? editor.gifLoop : true,
		gifSizePreset:
			editor.gifSizePreset === "medium" ||
			editor.gifSizePreset === "large" ||
			editor.gifSizePreset === "original"
				? editor.gifSizePreset
				: "medium",
		masterAudioMuted:
			typeof editor.masterAudioMuted === "boolean" ? editor.masterAudioMuted : false,
		masterAudioSoloed:
			typeof editor.masterAudioSoloed === "boolean" ? editor.masterAudioSoloed : false,
		masterAudioVolume: isFiniteNumber(editor.masterAudioVolume)
			? clamp(editor.masterAudioVolume, 0, 2)
			: 1,
		audioTrackVolume: isFiniteNumber(editor.audioTrackVolume)
			? clamp(editor.audioTrackVolume, 0, 2)
			: 1,
		isMasterSelected: Boolean(editor.isMasterSelected),
	};
}
