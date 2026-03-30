import { Maximize2, MousePointer2, Scissors, Type, Volume2, Zap } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Toaster } from "sonner";
import ProjectBrowserDialog from "@/features/project/components/ProjectBrowserDialog";
import { fromFileUrl, toFileUrl } from "@/shared/lib/fileUrl";
import { useI18n } from "@/shared/adapters/I18nProvider";
import { useEditorContext } from "../../context/EditorContext";
import { useAudioSync } from "../../hooks/useAudioSync";
import { useCaptionActions } from "../../hooks/useCaptionActions";
import { useExportActions } from "../../hooks/useExportActions";
import { useHistoryActions } from "../../hooks/useHistoryActions";
import { useProjectActions } from "../../hooks/useProjectActions";
import { useTimelineActions } from "../../hooks/useTimelineActions";
import { useWebcamActions } from "../../hooks/useWebcamActions";
import { CropModal } from "./components/CropModal";
import { PlaybackPanel } from "./components/PlaybackPanel";
import { EditorHeader } from "./EditorHeader";
import { useCropWorkflow } from "./hooks/useCropWorkflow";
import { useExportWorkflow } from "./hooks/useExportWorkflow";
import { useLibraryWorkflow } from "./hooks/useLibraryWorkflow";
import { useTimeSelection } from "./hooks/useTimeSelection";
import { SettingsPanel } from "./SettingsPanel";
import TimelineEditor from "./timeline/TimelineEditor";
import { type PlaybackSpeed, type TimelineMode, type ZoomTransitionEasing } from "./types";

const editorSectionButtons = [
	{ id: "scene", icon: Maximize2, label: "Scene" },
	{ id: "cursor", icon: MousePointer2, label: "Cursor" },
	{ id: "captions", icon: Type, label: "Captions" },
	{ id: "audio", icon: Volume2, label: "Audio" },
	{ id: "zooms", icon: Zap, label: "Zooms" },
	{ id: "trims", icon: Scissors, label: "Trims" },
];

export function EditorContent() {
	const { t } = useI18n();
	const {
		state,
		updateState,
		videoPath: videoSourcePath,
		videoPlaybackRef,
		currentTime,
		setCurrentTime,
		duration,
		setDuration,
		loading,
		setLoading,
		error,
		setError,
		handleSeek,
		togglePlayPause,
		setExportProgress,
		setExportError,
		exportedFilePath,
		setExportedFilePath,
		setShowExportDropdown,
		activeEffectSection,
		setActiveEffectSection,
		selectedZoomId,
		selectedTrimId,
		selectedSpeedId,
		selectedAudioId,
		selectedAnnotationId,
		selectedCaptionId,
		previewVolume,
		setPreviewVolume,
		autoSuggestZoomsTrigger,
		effectiveZoomRegions,
		effectiveCursorTelemetry,
		masterGainRef,
		whisperExecutablePath,
		whisperModelPath,
		isGeneratingCaptions,
		autoCaptionProgress,
		whisperModelDownloadProgress,
		whisperModelDownloadStatus,
		setVideoPath,
		setVideoSourcePath,
		setCurrentProjectPath,
		setHasUnsavedChanges,
	} = useEditorContext();

	const {
		wallpaper,
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
		showCursor,
		loopCursor,
		cursorStyle,
		cursorSize,
		cursorSmoothing,
		cursorMotionBlur,
		cursorClickBounce,
		cursorClickBounceDuration,
		cursorSway,
		borderRadius,
		padding,
		cropRegion,
		zoomRegions,
		trimRegions,
		speedRegions,
		annotationRegions,
		audioRegions,
		autoCaptions,
		autoCaptionSettings,
		webcam,
		aspectRatio,
		exportQuality,
		exportFormat,
		gifFrameRate,
		gifLoop,
		gifSizePreset,
		masterAudioMuted,
		masterAudioSoloed,
		masterAudioVolume,
		audioTrackVolume,
		isMasterSelected,
	} = state;

	const { saveProject, handleOpenProjectFromLibrary, applyLoadedProject } = useProjectActions();
	const { canUndo, canRedo, undo, redo } = useHistoryActions();
	const { handleExport, clearPendingExportSave, pendingExportSaveRef } = useExportActions();

	const audioContextRef = useRef<AudioContext | null>(null);
	useAudioSync({
		audioRegions,
		previewVolume,
		masterAudioVolume,
		audioTrackVolume,
		masterAudioSoloed,
		isPlaying: state.isMasterSelected,
		currentTime,
		isAudioEngineReady: true,
		audioContextRef: audioContextRef,
		masterGainRef: masterGainRef,
	});

	useEffect(() => {
		async function loadInitialData() {
			setLoading(true);
			try {
				const currentProjectResult = await window.electronAPI.loadCurrentProjectFile();
				if (currentProjectResult.success && currentProjectResult.project) {
					const restored = await applyLoadedProject(
						currentProjectResult.project,
						currentProjectResult.path ?? null,
					);
					if (restored) {
						return;
					}
				}

				const sessionResult = await window.electronAPI.getCurrentRecordingSession?.();
				if (sessionResult?.success && sessionResult.session?.videoPath) {
					const sourcePath = fromFileUrl(sessionResult.session.videoPath);
					setVideoSourcePath(sourcePath);
					setVideoPath(toFileUrl(sourcePath));
					setCurrentProjectPath(null);
					setHasUnsavedChanges(false);
					return;
				}

				const result = await window.electronAPI.getCurrentVideoPath();
				if (result.success && result.path) {
					const sourcePath = fromFileUrl(result.path);
					setVideoSourcePath(sourcePath);
					setVideoPath(toFileUrl(sourcePath));
					setCurrentProjectPath(null);
					setHasUnsavedChanges(false);
				} else {
					setError(t("editor.errorNoVideo", "No video to load. Please record or select a video."));
				}
			} catch (err) {
				console.error("Error loading video:", err);
				setError(t("editor.errorLoadingVideo", "Error loading video: ") + String(err));
			} finally {
				setLoading(false);
			}
		}

		loadInitialData();
	}, [
		applyLoadedProject,
		setLoading,
		setVideoPath,
		setVideoSourcePath,
		setError,
		setCurrentProjectPath,
		setHasUnsavedChanges,
		t,
	]);

	const {
		handleSelectZoom,
		handleZoomAdded,
		handleZoomSpanChange,
		handleZoomDelete,
		handleZoomDepthChange,
		handleZoomFocusChange,
		handleZoomSuggested,
		handleSelectTrim,
		handleTrimAdded,
		handleTrimSpanChange,
		handleTrimDelete,
		handleSelectSpeed,
		handleSpeedAdded,
		handleSpeedSpanChange,
		handleSpeedDelete,
		handleSpeedChange,
		handleSelectAudio,
		handleAudioAdded,
		handleAudioSpanChange,
		handleAudioDelete,
		handleAudioVolumeChange,
		handleAudioMutedChange,
		handleAudioSoloedChange,
		handleAudioFadeInMsChange,
		handleAudioFadeOutMsChange,
		handleSelectAnnotation,
		handleAnnotationAdded,
		handleAnnotationSpanChange,
		handleAnnotationDelete,
		handleAnnotationPositionChange,
		handleAnnotationSizeChange,
		handleAnnotationContentChange,
		handleAnnotationTypeChange,
		handleAnnotationStyleChange,
		handleAnnotationFigureDataChange,
		handleAnnotationBlurIntensityChange,
		handleSelectCaption,
		handleCaptionSpanChange,
		handleClearAutoCaptions,
		handleSelectMaster,
		handleAutoSuggestZooms,
		handleAutoSuggestZoomsConsumed,
	} = useTimelineActions();

	const {
		handlePickWhisperExecutable,
		handlePickWhisperModel,
		handleGenerateAutoCaptions,
		handleDownloadWhisperModel,
		handleDeleteWhisperModel,
	} = useCaptionActions();
	const { handleUploadWebcam, handleClearWebcam } = useWebcamActions();

	const [previewVersion] = useState(0);

	const {
		projectBrowserOpen,
		setProjectBrowserOpen,
		projectLibraryEntries,
		projectBrowserTriggerRef,
		projectBrowserFallbackTriggerRef,
		handleOpenProjectBrowser,
		onOpenProject,
	} = useLibraryWorkflow({ t, onOpenProject: handleOpenProjectFromLibrary });

	const { showCropModal, handleOpenCropEditor, handleCancelCropEditor, isCropped } =
		useCropWorkflow(cropRegion as any, updateState);

	const {
		handleOpenExportDropdown,
		handleStartExportFromDropdown,
		handleCancelExport,
		handleExportDropdownClose,
		handleRetrySaveExport,
		revealExportedFile,
		openRecordingsFolder,
	} = useExportWorkflow({
		videoSourcePath: videoSourcePath || null,
		videoPlaybackRef,
		gifSizePreset,
		exportFormat,
		exportQuality,
		gifFrameRate,
		gifLoop,
		exportedFilePath: exportedFilePath || undefined,
		setShowExportDropdown,
		setExportProgress,
		setExportError,
		setExportedFilePath,
		handleExport,
		clearPendingExportSave,
		pendingExportSaveRef,
	});

	const timeSelection = useTimeSelection({
		selectedZoomId,
		selectedTrimId,
		selectedSpeedId,
		selectedAudioId,
		selectedAnnotationId,
		selectedCaptionId,
		zoomRegions,
		trimRegions,
		speedRegions,
		audioRegions,
		annotationRegions,
		autoCaptions,
	});

	const [timelineToolMode, setTimelineToolMode] = useState<TimelineMode>("select");

	const handleSaveProject = useCallback(async () => {
		await saveProject(false);
	}, [saveProject]);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	}, []);

	const handleDrop = useCallback(
		async (e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();

			const file = e.dataTransfer.files[0];
			if (!file) return;

			const ext = file.name.split(".").pop()?.toLowerCase();
			if (ext === "mp4" || ext === "webm" || ext === "mov" || ext === "avi" || ext === "mkv") {
				setLoading(true);
				try {
					const result = await window.electronAPI.setCurrentVideoPath((file as any).path);
					if (result.success) {
						await window.electronAPI.switchToEditor();
					}
				} catch (err) {
					console.error("Failed to open dropped video:", err);
				} finally {
					setLoading(false);
				}
			} else if (ext === "recordly" || ext === "json") {
				void onOpenProject((file as any).path);
			}
		},
		[onOpenProject, setLoading],
	);

	const handleMasterAudioSoloedChange = (soloed: boolean) =>
		updateState({ masterAudioSoloed: soloed });

	const projectBrowser = (
		<ProjectBrowserDialog
			open={projectBrowserOpen}
			onOpenChange={setProjectBrowserOpen}
			entries={projectLibraryEntries}
			anchorRef={error ? projectBrowserFallbackTriggerRef : projectBrowserTriggerRef}
			onOpenProject={(path: string) => void onOpenProject(path)}
		/>
	);

	if (loading)
		return (
			<div className="flex h-screen items-center justify-center bg-background text-foreground">
				Loading...{projectBrowser}
				<Toaster theme="dark" />
			</div>
		);

	if (error)
		return (
			<div className="flex h-screen flex-col items-center justify-center bg-background text-destructive gap-4">
				{error}
				<button
					onClick={handleOpenProjectBrowser}
					ref={projectBrowserFallbackTriggerRef}
					className="px-4 py-2 bg-primary text-primary-foreground rounded"
				>
					Open Library
				</button>
				{projectBrowser}
				<Toaster theme="dark" />
			</div>
		);

	return (
		<div
			onDragOver={handleDragOver}
			onDrop={handleDrop}
			className="flex flex-col h-screen bg-[#111113] text-slate-200 overflow-hidden selection:bg-[#2563EB]/30"
		>
			<EditorHeader
				canUndo={canUndo}
				canRedo={canRedo}
				handleUndo={undo}
				handleRedo={redo}
				handleOpenProjectBrowser={handleOpenProjectBrowser}
				handleSaveProject={handleSaveProject}
				handleOpenExportDropdown={handleOpenExportDropdown}
				handleCancelExport={handleCancelExport}
				handleRetrySaveExport={handleRetrySaveExport}
				handleExportDropdownClose={handleExportDropdownClose}
				handleStartExportFromDropdown={handleStartExportFromDropdown}
				revealExportedFile={revealExportedFile}
				openRecordingsFolder={openRecordingsFolder}
				projectBrowserTriggerRef={projectBrowserTriggerRef}
				mp4OutputDimensions={{
					medium: { width: 1280, height: 720 },
					good: { width: 1920, height: 1080 },
					high: { width: 2560, height: 1440 },
					source: { width: 3840, height: 2160 },
				}}
				gifOutputDimensions={{ width: 480, height: 270 }}
			/>

			<div className="relative flex min-h-0 flex-1 gap-3 p-4">
				<div className="order-1 flex">
					<SettingsPanel
						panelMode="editor"
						activeEffectSection={activeEffectSection}
						onAutoSuggestZooms={handleAutoSuggestZooms}
						wallpaper={wallpaper}
						onWallpaperChange={(w: string) => updateState({ wallpaper: w })}
						selectedZoomDepth={
							selectedZoomId
								? (zoomRegions.find((z) => z.id === selectedZoomId)?.depth ?? null)
								: null
						}
						onZoomDepthChange={(d: number) => selectedZoomId && handleZoomDepthChange(d)}
						selectedZoomId={selectedZoomId}
						onZoomDelete={handleZoomDelete}
						selectedTrimId={selectedTrimId}
						onTrimDelete={handleTrimDelete}
						shadowIntensity={shadowIntensity}
						onShadowChange={(v: number) => updateState({ shadowIntensity: v })}
						backgroundBlur={backgroundBlur}
						onBackgroundBlurChange={(v: number) => updateState({ backgroundBlur: v })}
						zoomMotionBlur={zoomMotionBlur}
						onZoomMotionBlurChange={(v: number) => updateState({ zoomMotionBlur: v })}
						connectZooms={connectZooms}
						onConnectZoomsChange={(v: boolean) => updateState({ connectZooms: v })}
						zoomInDurationMs={zoomInDurationMs}
						onZoomInDurationMsChange={(v: number) => updateState({ zoomInDurationMs: v })}
						zoomInOverlapMs={zoomInOverlapMs}
						onZoomInOverlapMsChange={(v: number) => updateState({ zoomInOverlapMs: v })}
						zoomOutDurationMs={zoomOutDurationMs}
						onZoomOutDurationMsChange={(v: number) => updateState({ zoomOutDurationMs: v })}
						connectedZoomGapMs={connectedZoomGapMs}
						onConnectedZoomGapMsChange={(v: number) => updateState({ connectedZoomGapMs: v })}
						connectedZoomDurationMs={connectedZoomDurationMs}
						onConnectedZoomDurationMsChange={(v: number) =>
							updateState({ connectedZoomDurationMs: v })
						}
						zoomInEasing={zoomInEasing}
						onZoomInEasingChange={(v: string) => updateState({ zoomInEasing: v as ZoomTransitionEasing })}
						zoomOutEasing={zoomOutEasing}
						onZoomOutEasingChange={(v: string) => updateState({ zoomOutEasing: v as ZoomTransitionEasing })}
						connectedZoomEasing={connectedZoomEasing}
						onConnectedZoomEasingChange={(v: string) =>
							updateState({ connectedZoomEasing: v as ZoomTransitionEasing })
						}
						showCursor={showCursor}
						onShowCursorChange={(v: boolean) => updateState({ showCursor: v })}
						loopCursor={loopCursor}
						onLoopCursorChange={(v: boolean) => updateState({ loopCursor: v })}
						cursorStyle={cursorStyle}
						onCursorStyleChange={(v: any) => updateState({ cursorStyle: v })}
						cursorSize={cursorSize}
						onCursorSizeChange={(v: number) => updateState({ cursorSize: v })}
						cursorSmoothing={cursorSmoothing}
						onCursorSmoothingChange={(v: number) => updateState({ cursorSmoothing: v })}
						cursorMotionBlur={cursorMotionBlur}
						onCursorMotionBlurChange={(v: number) => updateState({ cursorMotionBlur: v })}
						cursorClickBounce={cursorClickBounce}
						onCursorClickBounceChange={(v: number) => updateState({ cursorClickBounce: v })}
						cursorClickBounceDuration={cursorClickBounceDuration}
						onCursorClickBounceDurationChange={(v: number) =>
							updateState({ cursorClickBounceDuration: v })
						}
						cursorSway={cursorSway}
						onCursorSwayChange={(v: number) => updateState({ cursorSway: v })}
						borderRadius={borderRadius}
						onBorderRadiusChange={(v: number) => updateState({ borderRadius: v })}
						webcam={webcam}
						onWebcamChange={(v: any) => updateState({ webcam: v })}
						onUploadWebcam={handleUploadWebcam}
						onClearWebcam={handleClearWebcam}
						padding={padding}
						onPaddingChange={(v: number) => updateState({ padding: v })}
						cropRegion={cropRegion}
						onCropChange={(v: any) => updateState({ cropRegion: v })}
						aspectRatio={aspectRatio}
						onAspectRatioChange={(v: any) => updateState({ aspectRatio: v })}
						selectedAnnotationId={selectedAnnotationId}
						annotationRegions={annotationRegions}
						onSeek={handleSeek}
						autoCaptions={autoCaptions}
						autoSuggestZoomsTrigger={autoSuggestZoomsTrigger}
						onAutoSuggestZoomsConsumed={handleAutoSuggestZoomsConsumed}
						onAutoCaptionsChange={(v: any) => updateState({ autoCaptions: v })}
						autoCaptionSettings={autoCaptionSettings}
						whisperExecutablePath={whisperExecutablePath}
						whisperModelPath={whisperModelPath}
						whisperModelDownloadStatus={whisperModelDownloadStatus as any}
						whisperModelDownloadProgress={whisperModelDownloadProgress || undefined}
						isGeneratingCaptions={isGeneratingCaptions}
						autoCaptionProgress={autoCaptionProgress || undefined}
						onAutoCaptionSettingsChange={(v: any) => updateState({ autoCaptionSettings: v })}
						onPickWhisperExecutable={handlePickWhisperExecutable}
						onPickWhisperModel={handlePickWhisperModel}
						onGenerateAutoCaptions={handleGenerateAutoCaptions}
						onClearAutoCaptions={handleClearAutoCaptions}
						onDownloadWhisperModel={handleDownloadWhisperModel}
						onDeleteWhisperModel={handleDeleteWhisperModel}
						onAnnotationContentChange={handleAnnotationContentChange}
						onAnnotationTypeChange={handleAnnotationTypeChange}
						onAnnotationStyleChange={handleAnnotationStyleChange}
						onAnnotationFigureDataChange={handleAnnotationFigureDataChange}
						onAnnotationBlurIntensityChange={handleAnnotationBlurIntensityChange}
						onAnnotationDelete={handleAnnotationDelete}
						selectedSpeedId={selectedSpeedId}
						selectedSpeedValue={
							selectedSpeedId
								? (speedRegions.find((r) => r.id === selectedSpeedId)?.speed ?? null)
								: null
						}
						onSpeedChange={(id: string, speed: number) => handleSpeedChange(speed as PlaybackSpeed)}
						onSpeedDelete={handleSpeedDelete}
						audioRegions={audioRegions}
						selectedAudioId={selectedAudioId}
						onAudioVolumeChange={handleAudioVolumeChange}
						onAudioMutedChange={handleAudioMutedChange}
						onAudioSoloedChange={handleAudioSoloedChange}
						onAudioFadeInMsChange={handleAudioFadeInMsChange}
						onAudioFadeOutMsChange={handleAudioFadeOutMsChange}
						onAudioDelete={handleAudioDelete}
						selectedCaptionId={selectedCaptionId}
						onSelectCaption={handleSelectCaption}
						timeSelection={timeSelection}
						isMasterSelected={isMasterSelected}
						masterAudioVolume={masterAudioVolume}
						masterAudioMuted={masterAudioMuted}
						masterAudioSoloed={masterAudioSoloed}
						videoDuration={duration}
						videoPath={videoSourcePath || undefined}
						onMasterAudioVolumeChange={(v: number) => updateState({ masterAudioVolume: v })}
						onMasterAudioMutedChange={(v: boolean) => updateState({ masterAudioMuted: v })}
						onMasterAudioSoloedChange={handleMasterAudioSoloedChange}
					/>
				</div>

				<div className="order-2 flex h-full min-w-0 flex-[7] flex-col gap-3">
					<PanelGroup direction="vertical" className="gap-3">
						<PlaybackPanel
							videoSourcePath={videoSourcePath || ""}
							previewVersion={previewVersion}
							previewVolume={previewVolume}
							masterAudioVolume={masterAudioVolume}
							aspectRatio={aspectRatio}
							videoPlaybackRef={videoPlaybackRef}
							onDurationChange={setDuration}
							onTimeUpdate={setCurrentTime}
							currentTime={currentTime}
							duration={duration}
							setIsPlaying={(p: boolean) => updateState({ isMasterSelected: p })}
							setError={setError}
							wallpaper={wallpaper}
							effectiveZoomRegions={effectiveZoomRegions}
							selectedZoomId={selectedZoomId}
							handleSelectZoom={handleSelectZoom}
							handleZoomFocusChange={handleZoomFocusChange}
							isPlaying={state.isMasterSelected}
							shadowIntensity={shadowIntensity}
							backgroundBlur={backgroundBlur}
							zoomMotionBlur={zoomMotionBlur}
							connectZooms={connectZooms}
							zoomInDurationMs={zoomInDurationMs}
							zoomInOverlapMs={zoomInOverlapMs}
							zoomOutDurationMs={zoomOutDurationMs}
							connectedZoomGapMs={connectedZoomGapMs}
							connectedZoomDurationMs={connectedZoomDurationMs}
							zoomInEasing={zoomInEasing}
							zoomOutEasing={zoomOutEasing}
							connectedZoomEasing={connectedZoomEasing}
							annotationRegions={annotationRegions}
							autoCaptions={autoCaptions}
							autoCaptionSettings={autoCaptionSettings}
							selectedAnnotationId={selectedAnnotationId}
							handleSelectAnnotation={handleSelectAnnotation}
							handleAnnotationPositionChange={handleAnnotationPositionChange}
							handleAnnotationSizeChange={handleAnnotationSizeChange}
							effectiveCursorTelemetry={effectiveCursorTelemetry || []}
							showCursor={showCursor}
							cursorStyle={cursorStyle}
							cursorSize={cursorSize}
							cursorSmoothing={cursorSmoothing}
							cursorMotionBlur={cursorMotionBlur}
							cursorClickBounce={cursorClickBounce}
							cursorClickBounceDuration={cursorClickBounceDuration}
							cursorSway={cursorSway}
							timeSelection={timeSelection}
							togglePlayPause={togglePlayPause}
							handleSeek={handleSeek}
							setPreviewVolume={setPreviewVolume}
							activeEffectSection={activeEffectSection as string}
							setActiveEffectSection={setActiveEffectSection}
							editorSectionButtons={editorSectionButtons}
						/>

						<PanelResizeHandle className="h-3 bg-transparent transition-colors mx-4 flex items-center justify-center">
							<div className="w-8 h-1 bg-white/20 rounded-full" />
						</PanelResizeHandle>

						<Panel defaultSize={33} minSize={20}>
							<div className="h-full min-h-0 bg-[#17171a] rounded-2xl border border-white/10 shadow-lg overflow-auto flex flex-col">
								<TimelineEditor
									videoDuration={duration}
									videoPath={videoSourcePath || undefined}
									masterAudioMuted={masterAudioMuted}
									onMasterAudioMutedChange={(v: boolean) => updateState({ masterAudioMuted: v })}
									masterAudioSoloed={masterAudioSoloed}
									onMasterAudioSoloedChange={handleMasterAudioSoloedChange}
									masterAudioVolume={masterAudioVolume}
									onMasterAudioVolumeChange={(v: any) => updateState({ masterAudioVolume: v })}
									audioTrackVolume={audioTrackVolume}
									onAudioTrackVolumeChange={(v: number) => updateState({ audioTrackVolume: v })}
									currentTime={currentTime}
									onSeek={handleSeek}
									timelineMode={timelineToolMode}
									onTimelineModeChange={setTimelineToolMode}
									timeSelection={timeSelection}
									cursorTelemetry={effectiveCursorTelemetry || []}
									autoSuggestZoomsTrigger={autoSuggestZoomsTrigger}
									onAutoSuggestZoomsConsumed={handleAutoSuggestZoomsConsumed}
									zoomRegions={effectiveZoomRegions}
									onZoomAdded={handleZoomAdded}
									onZoomSuggested={handleZoomSuggested}
									onZoomSpanChange={handleZoomSpanChange}
									onZoomDelete={handleZoomDelete}
									selectedZoomId={selectedZoomId}
									onSelectZoom={handleSelectZoom}
									trimRegions={trimRegions}
									onTrimAdded={handleTrimAdded}
									onTrimSpanChange={handleTrimSpanChange}
									onTrimDelete={handleTrimDelete}
									selectedTrimId={selectedTrimId}
									onSelectTrim={handleSelectTrim}
									speedRegions={speedRegions}
									onSpeedAdded={handleSpeedAdded}
									onSpeedSpanChange={handleSpeedSpanChange}
									onSpeedDelete={handleSpeedDelete}
									selectedSpeedId={selectedSpeedId}
									onSelectSpeed={handleSelectSpeed}
									audioRegions={audioRegions}
									onAudioAdded={handleAudioAdded}
									onAudioSpanChange={handleAudioSpanChange}
									onAudioMutedChange={handleAudioMutedChange}
									onAudioSoloedChange={handleAudioSoloedChange}
									onAudioDelete={handleAudioDelete}
									selectedAudioId={selectedAudioId}
									onSelectAudio={handleSelectAudio}
									annotationRegions={annotationRegions}
									onAnnotationAdded={handleAnnotationAdded}
									onAnnotationSpanChange={handleAnnotationSpanChange}
									onAnnotationDelete={handleAnnotationDelete}
									selectedAnnotationId={selectedAnnotationId}
									onSelectAnnotation={handleSelectAnnotation}
									autoCaptions={autoCaptions}
									onCaptionSpanChange={handleCaptionSpanChange}
									selectedCaptionId={selectedCaptionId}
									onSelectCaption={handleSelectCaption}
									onClearAutoCaptions={handleClearAutoCaptions}
									aspectRatio={aspectRatio}
									onAspectRatioChange={(v: any) => updateState({ aspectRatio: v })}
									onOpenCropEditor={handleOpenCropEditor}
									isCropped={isCropped}
									isMasterSelected={isMasterSelected}
									onSelectMaster={handleSelectMaster}
								/>
							</div>
						</Panel>
					</PanelGroup>
				</div>
			</div>

			<CropModal isOpen={showCropModal} t={t} onCancel={handleCancelCropEditor} />
			{projectBrowser}
			<Toaster theme="dark" className="pointer-events-auto" />
		</div>
	);
}
