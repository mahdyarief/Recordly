import { useCallback, useRef } from "react";
import { toast } from "sonner";
import {
	calculateMp4ExportDimensions,
	type ExportProgress,
	type ExportSettings,
	GifExporter,
	VideoExporter,
} from "@/features/exporter";
import { toFileUrl } from "@/features/project/domain/services/projectPersistence";
import { useEditorContext } from "../context/EditorContext";
import { useMp4Support } from "./useMp4Support";

// Constants (copied from EditorContent until moved to constants)
const MP4_EXPORT_FRAME_RATE = 30;
const DEFAULT_MP4_CODEC = "h264";

export function useExportActions() {
	const {
		state,
		videoPath,
		videoPlaybackRef,
		isPlaying,
		setIsExporting,
		setExportProgress,
		setExportError,
		setShowExportDropdown,
		setExportedFilePath,
	} = useEditorContext();

	const { ensureSupportedMp4SourceDimensions } = useMp4Support();

	const exporterRef = useRef<VideoExporter | null>(null);
	const pendingExportSaveRef = useRef<{ arrayBuffer: ArrayBuffer; fileName: string } | null>(null);

	const clearPendingExportSave = useCallback(() => {
		pendingExportSaveRef.current = null;
	}, []);

	const handleExport = useCallback(
		async (settings: ExportSettings) => {
			if (!videoPath) {
				toast.error("No video loaded");
				return;
			}

			const video = videoPlaybackRef.current?.video;
			if (!video) {
				toast.error("Video not ready");
				return;
			}

			setIsExporting(true);
			setExportProgress(null);
			setExportError(null);
			clearPendingExportSave();

			let keepExportDialogOpen = false;

			try {
				const wasPlaying = isPlaying;
				const restoreTime = video.currentTime;
				if (wasPlaying) {
					videoPlaybackRef.current?.pause();
				}

				// Get preview CONTAINER dimensions for scaling
				const playbackRef = videoPlaybackRef.current;
				const containerElement = playbackRef?.containerRef?.current;
				const previewWidth = containerElement?.clientWidth || 1920;
				const previewHeight = containerElement?.clientHeight || 1080;

				const {
					wallpaper,
					trimRegions,
					speedRegions,
					shadowIntensity,
					backgroundBlur,
					zoomMotionBlur,
					connectZooms,
					zoomInDurationMs,
					zoomInOverlapMs,
					zoomOutDurationMs,
					connectedZoomGapMs,
					connectedZoomDurationMs,
					zoomInEasing,
					zoomOutEasing,
					connectedZoomEasing,
					borderRadius,
					padding,
					cropRegion,
					webcam,
					annotationRegions,
					autoCaptions,
					autoCaptionSettings,
					zoomRegions,
					showCursor,
					cursorStyle,
					cursorSize,
					cursorSmoothing,
					cursorMotionBlur,
					cursorClickBounce,
					cursorClickBounceDuration,
					cursorSway,
					audioRegions,
					masterAudioVolume,
					audioTrackVolume,
					masterAudioMuted,
					masterAudioSoloed,
					exportQuality,
				} = state;

				if (settings.format === "gif" && settings.gifConfig) {
					// GIF Export
					const gifExporter = new GifExporter({
						videoUrl: videoPath,
						width: settings.gifConfig.width,
						height: settings.gifConfig.height,
						frameRate: settings.gifConfig.frameRate,
						loop: settings.gifConfig.loop,
						sizePreset: settings.gifConfig.sizePreset,
						wallpaper,
						trimRegions,
						speedRegions,
						showShadow: shadowIntensity > 0,
						shadowIntensity,
						backgroundBlur,
						zoomMotionBlur,
						connectZooms,
						zoomInDurationMs,
						zoomInOverlapMs,
						zoomOutDurationMs,
						connectedZoomGapMs,
						connectedZoomDurationMs,
						zoomInEasing,
						zoomOutEasing,
						connectedZoomEasing,
						borderRadius,
						padding,
						videoPadding: padding,
						cropRegion,
						webcam,
						webcamUrl: webcam.sourcePath ? toFileUrl(webcam.sourcePath) : null,
						annotationRegions,
						autoCaptions,
						autoCaptionSettings,
						zoomRegions,
						cursorTelemetry: [],
						showCursor,
						cursorStyle,
						cursorSize,
						cursorSmoothing,
						cursorMotionBlur,
						cursorClickBounce,
						cursorClickBounceDuration,
						cursorSway,
						previewWidth,
						previewHeight,
						onProgress: (progress: ExportProgress) => {
							setExportProgress(progress);
						},
					});

					exporterRef.current = gifExporter as unknown as VideoExporter;
					const result = await gifExporter.export();

					if (result.success && result.blob) {
						const arrayBuffer = await result.blob.arrayBuffer();
						const timestamp = Date.now();
						const fileName = `export-${timestamp}.gif`;

						const saveResult = await window.electronAPI.saveExportedVideo(arrayBuffer, fileName);

						if (saveResult.canceled) {
							pendingExportSaveRef.current = { arrayBuffer, fileName };
							setExportError(
								"Save dialog canceled. Click Save Again to save without re-rendering.",
							);
							toast.info("Save canceled. You can save again without re-exporting.");
							keepExportDialogOpen = true;
						} else if (saveResult.success && saveResult.path) {
							toast.success("Successfully exported!");
							setExportedFilePath(saveResult.path);
						} else {
							setExportError(saveResult.message || "Failed to save GIF");
							toast.error(saveResult.message || "Failed to save GIF");
						}
					} else {
						setExportError(result.error || "GIF export failed");
						toast.error(result.error || "GIF export failed");
					}
				} else {
					// MP4 Export
					const quality = settings.quality || exportQuality;
					const supportedSourceDimensions = await ensureSupportedMp4SourceDimensions();
					const { width: exportWidth, height: exportHeight } = calculateMp4ExportDimensions(
						supportedSourceDimensions.width,
						supportedSourceDimensions.height,
						quality,
					);

					let bitrate: number;
					if (quality === "source") {
						const totalPixels = exportWidth * exportHeight;
						bitrate = 30_000_000;
						if (totalPixels > 1920 * 1080 && totalPixels <= 2560 * 1440) {
							bitrate = 50_000_000;
						} else if (totalPixels > 2560 * 1440) {
							bitrate = 80_000_000;
						}
					} else {
						const totalPixels = exportWidth * exportHeight;
						if (totalPixels <= 1280 * 720) {
							bitrate = 10_000_000;
						} else if (totalPixels <= 1920 * 1080) {
							bitrate = 20_000_000;
						} else {
							bitrate = 30_000_000;
						}
					}

					const exporter = new VideoExporter({
						videoUrl: videoPath,
						width: exportWidth,
						height: exportHeight,
						frameRate: MP4_EXPORT_FRAME_RATE,
						bitrate,
						codec: DEFAULT_MP4_CODEC,
						wallpaper,
						trimRegions,
						speedRegions,
						showShadow: shadowIntensity > 0,
						shadowIntensity,
						backgroundBlur,
						zoomMotionBlur,
						connectZooms,
						zoomInDurationMs,
						zoomInOverlapMs,
						zoomOutDurationMs,
						connectedZoomGapMs,
						connectedZoomDurationMs,
						zoomInEasing,
						zoomOutEasing,
						connectedZoomEasing,
						borderRadius,
						padding,
						cropRegion,
						webcam,
						webcamUrl: webcam.sourcePath ? toFileUrl(webcam.sourcePath) : null,
						annotationRegions,
						autoCaptions,
						autoCaptionSettings,
						zoomRegions,
						cursorTelemetry: [],
						showCursor,
						cursorStyle,
						cursorSize,
						cursorSmoothing,
						cursorMotionBlur,
						cursorClickBounce,
						cursorClickBounceDuration,
						cursorSway,
						audioRegions,
						masterAudioVolume: masterAudioVolume ?? 1,
						audioTrackVolume: audioTrackVolume ?? 1,
						masterAudioMuted: masterAudioMuted ?? false,
						masterAudioSoloed: masterAudioSoloed ?? false,
						previewWidth,
						previewHeight,
						onProgress: (progress: ExportProgress) => {
							setExportProgress(progress);
						},
					});

					exporterRef.current = exporter;
					const result = await exporter.export();

					if (result.success && result.blob) {
						const arrayBuffer = await result.blob.arrayBuffer();
						const timestamp = Date.now();
						const fileName = `export-${timestamp}.mp4`;

						const saveResult = await window.electronAPI.saveExportedVideo(arrayBuffer, fileName);

						if (saveResult.canceled) {
							pendingExportSaveRef.current = { arrayBuffer, fileName };
							setExportError(
								"Save dialog canceled. Click Save Again to save without re-rendering.",
							);
							toast.info("Save canceled. You can save again without re-exporting.");
							keepExportDialogOpen = true;
						} else if (saveResult.success && saveResult.path) {
							toast.success("Successfully exported!");
							setExportedFilePath(saveResult.path);
						} else {
							setExportError(saveResult.message || "Failed to save video");
							toast.error(saveResult.message || "Failed to save video");
						}
					} else {
						setExportError(result.error || "Export failed");
						toast.error(result.error || "Export failed");
					}
				}

				if (wasPlaying) {
					videoPlaybackRef.current?.play();
				} else {
					video.currentTime = restoreTime;
				}
			} catch (error) {
				console.error("Export error:", error);
				const errorMessage = error instanceof Error ? error.message : "Unknown error";
				setExportError(errorMessage);
				toast.error(`Export failed: ${errorMessage}`);
			} finally {
				setIsExporting(false);
				exporterRef.current = null;
				setShowExportDropdown(keepExportDialogOpen);
				setExportProgress(null);
			}
		},
		[
			videoPath,
			videoPlaybackRef,
			isPlaying,
			setIsExporting,
			setExportProgress,
			setExportError,
			setShowExportDropdown,
			setExportedFilePath,
			state,
			clearPendingExportSave,
		],
	);

	return {
		handleExport,
		clearPendingExportSave,
		pendingExportSaveRef,
	};
}
