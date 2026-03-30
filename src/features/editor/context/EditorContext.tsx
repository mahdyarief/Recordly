import React, { createContext, type ReactNode, useContext, useRef, useState } from "react";
import { type ProjectEditorState } from "../../project/domain/entities/ProjectState";
import {
	type CursorTelemetryPoint,
	type VideoPlaybackRef,
	type ZoomRegion,
} from "../components/VideoEditor/types";
import { useVideoEditorState } from "../hooks/useVideoEditorState";

interface EditorContextType {
	state: ProjectEditorState;
	updateState: (
		update:
			| Partial<ProjectEditorState>
			| ((prev: ProjectEditorState) => Partial<ProjectEditorState>),
	) => void;
	updateZoomRegions: (zoomRegions: ProjectEditorState["zoomRegions"]) => void;
	updateTrimRegions: (trimRegions: ProjectEditorState["trimRegions"]) => void;
	updateAnnotationRegions: (annotationRegions: ProjectEditorState["annotationRegions"]) => void;
	updateAudioRegions: (audioRegions: ProjectEditorState["audioRegions"]) => void;
	updateAutoCaptions: (autoCaptions: ProjectEditorState["autoCaptions"]) => void;

	// Refs and transient state
	videoPlaybackRef: React.RefObject<VideoPlaybackRef>;
	audioContextRef: React.RefObject<AudioContext | null>;
	masterGainRef: React.RefObject<GainNode | null>;
	currentTime: number;
	setCurrentTime: (time: number | ((prev: number) => number)) => void;
	duration: number;
	setDuration: (duration: number | ((prev: number) => number)) => void;
	isPlaying: boolean;
	setIsPlaying: (playing: boolean | ((prev: boolean) => boolean)) => void;

	handleSeek: (time: number) => void;
	togglePlayPause: () => void;
	initAudioContext: () => void;

	// App-level persisted state
	whisperExecutablePath: string | null;
	setWhisperExecutablePath: (
		path: string | null | ((prev: string | null) => string | null),
	) => void;
	whisperModelPath: string | null;
	setWhisperModelPath: (path: string | null | ((prev: string | null) => string | null)) => void;
	isExporting: boolean;
	setIsExporting: (exporting: boolean | ((prev: boolean) => boolean)) => void;
	exportProgress: {
		percentage: number;
		phase?: "rendering" | "finalizing" | "saving" | "extracting";
		renderProgress?: number;
	} | null;
	setExportProgress: (
		progress: {
			percentage: number;
			phase?: "rendering" | "finalizing" | "saving" | "extracting";
			renderProgress?: number;
		} | null,
	) => void;
	exportError: string | null;
	setExportError: (error: string | null | ((prev: string | null) => string | null)) => void;
	showExportDropdown: boolean;
	setShowExportDropdown: (show: boolean | ((prev: boolean) => boolean)) => void;
	exportedFilePath: string | undefined;
	setExportedFilePath: (
		path: string | undefined | ((prev: string | undefined) => string | undefined),
	) => void;
	hasUnsavedChanges: boolean;
	setHasUnsavedChanges: (unsaved: boolean | ((prev: boolean) => boolean)) => void;
	projectDisplayName: string;
	setProjectDisplayName: (name: string | ((prev: string) => string)) => void;
	currentProjectPath: string | null;
	setCurrentProjectPath: (path: string | null | ((prev: string | null) => string | null)) => void;

	// Ephemeral selection state
	selectedZoomId: string | null;
	setSelectedZoomId: (id: string | null) => void;
	selectedTrimId: string | null;
	setSelectedTrimId: (id: string | null) => void;
	selectedSpeedId: string | null;
	setSelectedSpeedId: (id: string | null) => void;
	selectedAudioId: string | null;
	setSelectedAudioId: (id: string | null) => void;
	selectedAnnotationId: string | null;
	setSelectedAnnotationId: (id: string | null) => void;
	selectedCaptionId: string | null;
	setSelectedCaptionId: (id: string | null) => void;

	// Panel selection state
	activeEffectSection: string;
	setActiveEffectSection: (section: string) => void;
	previewVolume: number;
	setPreviewVolume: (volume: number) => void;

	// Trigger states
	autoSuggestZoomsTrigger: number;
	setAutoSuggestZoomsTrigger: (trigger: number | ((prev: number) => number)) => void;

	// Cursor and Zoom effective states (computed in Content but needed for hooks/sub-components)
	normalizedCursorTelemetry: CursorTelemetryPoint[] | null;
	setNormalizedCursorTelemetry: (telemetry: CursorTelemetryPoint[] | null) => void;
	effectiveZoomRegions: ZoomRegion[];
	setEffectiveZoomRegions: (regions: ZoomRegion[]) => void;
	effectiveCursorTelemetry: CursorTelemetryPoint[] | null;
	setEffectiveCursorTelemetry: (telemetry: CursorTelemetryPoint[] | null) => void;

	// Progress state for captions
	isGeneratingCaptions: boolean;
	setIsGeneratingCaptions: (is: boolean) => void;
	autoCaptionProgress: number | null;
	setAutoCaptionProgress: (progress: number | null) => void;
	whisperModelDownloadProgress: number | null;
	setWhisperModelDownloadProgress: (progress: number | null) => void;
	whisperModelDownloadStatus: string;
	setWhisperModelDownloadStatus: (status: string) => void;

	// Ephemeral logic state
	videoPath: string | null;
	setVideoPath: (path: string | null | ((prev: string | null) => string | null)) => void;
	videoSourcePath: string | null;
	setVideoSourcePath: (path: string | null | ((prev: string | null) => string | null)) => void;
	loading: boolean;
	setLoading: (loading: boolean | ((prev: boolean) => boolean)) => void;
	error: string | null;
	setError: (error: string | null | ((prev: string | null) => string | null)) => void;
	isAudioEngineReady: boolean;
	setIsAudioEngineReady: (ready: boolean | ((prev: boolean) => boolean)) => void;
	hasPendingExportSave: boolean;
	setHasPendingExportSave: (hasPending: boolean | ((prev: boolean) => boolean)) => void;

	// MP4 Support state
	supportedMp4SourceDimensions: {
		width: number;
		height: number;
		capped: boolean;
		encoderPath: string | null;
	};
	setSupportedMp4SourceDimensions: (
		dimensions:
			| {
					width: number;
					height: number;
					capped: boolean;
					encoderPath: string | null;
			  }
			| ((prev: { width: number; height: number; capped: boolean; encoderPath: string | null }) => {
					width: number;
					height: number;
					capped: boolean;
					encoderPath: string | null;
			  }),
	) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function EditorProvider({ children }: { children: ReactNode }) {
	const {
		state,
		updateState,
		updateZoomRegions,
		updateTrimRegions,
		updateAnnotationRegions,
		updateAudioRegions,
		updateAutoCaptions,
	} = useVideoEditorState();
	const videoPlaybackRef = useRef<VideoPlaybackRef>(null);
	const audioContextRef = useRef<AudioContext | null>(null);
	const masterGainRef = useRef<GainNode | null>(null);

	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [isPlaying, setIsPlaying] = useState(false);
	const [videoPath, setVideoPath] = useState<string | null>(null);
	const [videoSourcePath, setVideoSourcePath] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [whisperExecutablePath, setWhisperExecutablePath] = useState<string | null>(null);
	const [whisperModelPath, setWhisperModelPath] = useState<string | null>(null);
	const [isExporting, setIsExporting] = useState(false);
	const [exportProgress, setExportProgress] = useState<{
		percentage: number;
		phase?: "rendering" | "finalizing" | "saving" | "extracting";
		renderProgress?: number;
	} | null>(null);
	const [exportError, setExportError] = useState<string | null>(null);
	const [showExportDropdown, setShowExportDropdown] = useState(false);
	const [exportedFilePath, setExportedFilePath] = useState<string | undefined>(undefined);
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [projectDisplayName, setProjectDisplayName] = useState("Untitled");
	const [currentProjectPath, setCurrentProjectPath] = useState<string | null>(null);
	const [supportedMp4SourceDimensions, setSupportedMp4SourceDimensions] = useState({
		width: 1920,
		height: 1080,
		capped: false,
		encoderPath: null as string | null,
	});
	const [isAudioEngineReady, setIsAudioEngineReady] = useState(false);
	const [hasPendingExportSave, setHasPendingExportSave] = useState(false);

	// Selection state
	const [selectedZoomId, setSelectedZoomId] = useState<string | null>(null);
	const [selectedTrimId, setSelectedTrimId] = useState<string | null>(null);
	const [selectedSpeedId, setSelectedSpeedId] = useState<string | null>(null);
	const [selectedAudioId, setSelectedAudioId] = useState<string | null>(null);
	const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
	const [selectedCaptionId, setSelectedCaptionId] = useState<string | null>(null);

	// Panel selection
	const [activeEffectSection, setActiveEffectSection] = useState("overview");
	const [previewVolume, setPreviewVolume] = useState(1);

	// Triggers
	const [autoSuggestZoomsTrigger, setAutoSuggestZoomsTrigger] = useState(0);

	// Computed ephemeral state
	const [normalizedCursorTelemetry, setNormalizedCursorTelemetry] = useState<
		CursorTelemetryPoint[] | null
	>(null);
	const [effectiveZoomRegions, setEffectiveZoomRegions] = useState<any[]>(state.zoomRegions);
	const [effectiveCursorTelemetry, setEffectiveCursorTelemetry] = useState<
		CursorTelemetryPoint[] | null
	>(null);

	// Caption progress state
	const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);
	const [autoCaptionProgress, setAutoCaptionProgress] = useState<number | null>(null);
	const [whisperModelDownloadProgress, setWhisperModelDownloadProgress] = useState<number | null>(
		null,
	);
	const [whisperModelDownloadStatus, setWhisperModelDownloadStatus] = useState<string>("idle");

	const handleSeek = (time: number) => {
		videoPlaybackRef.current?.seek(time);
	};

	const initAudioContext = React.useCallback(() => {
		if (audioContextRef.current) {
			if (audioContextRef.current.state === "suspended") {
				audioContextRef.current.resume();
			}
			return;
		}

		try {
			const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
			const masterGain = ctx.createGain();
			masterGain.connect(ctx.destination);
			audioContextRef.current = ctx;
			masterGainRef.current = masterGain;
			console.log("[EditorContext] Web Audio API context initialized");
		} catch (e) {
			console.error("[EditorContext] Failed to initialize AudioContext", e);
		}
	}, []);

	const togglePlayPause = () => {
		const playback = videoPlaybackRef.current;
		const video = playback?.video;
		if (!playback || !video) return;

		initAudioContext();

		if (!video.paused && !video.ended) {
			playback.pause();
		} else {
			playback.play().catch((err: any) => console.error("Video play failed:", err));
		}
	};

	const value: EditorContextType = {
		state,
		updateState,
		updateZoomRegions,
		updateTrimRegions,
		updateAnnotationRegions,
		updateAudioRegions,
		updateAutoCaptions,
		isPlaying,
		setIsPlaying,
		currentTime,
		setCurrentTime,
		duration,
		setDuration,
		videoPlaybackRef,
		audioContextRef,
		masterGainRef,
		initAudioContext,
		handleSeek,
		togglePlayPause,
		videoPath,
		setVideoPath,
		videoSourcePath,
		setVideoSourcePath,
		loading,
		setLoading,
		error,
		setError,
		whisperExecutablePath,
		setWhisperExecutablePath,
		whisperModelPath,
		setWhisperModelPath,
		isExporting,
		setIsExporting,
		exportProgress,
		setExportProgress,
		exportError,
		setExportError,
		showExportDropdown,
		setShowExportDropdown,
		exportedFilePath,
		setExportedFilePath,
		hasUnsavedChanges,
		setHasUnsavedChanges,
		projectDisplayName,
		setProjectDisplayName,
		currentProjectPath,
		setCurrentProjectPath,
		supportedMp4SourceDimensions,
		setSupportedMp4SourceDimensions,
		isAudioEngineReady,
		setIsAudioEngineReady,
		hasPendingExportSave,
		setHasPendingExportSave,

		selectedZoomId,
		setSelectedZoomId,
		selectedTrimId,
		setSelectedTrimId,
		selectedSpeedId,
		setSelectedSpeedId,
		selectedAudioId,
		setSelectedAudioId,
		selectedAnnotationId,
		setSelectedAnnotationId,
		selectedCaptionId,
		setSelectedCaptionId,

		activeEffectSection,
		setActiveEffectSection,
		previewVolume,
		setPreviewVolume,
		autoSuggestZoomsTrigger,
		setAutoSuggestZoomsTrigger,
		normalizedCursorTelemetry,
		setNormalizedCursorTelemetry,
		effectiveZoomRegions,
		setEffectiveZoomRegions,
		effectiveCursorTelemetry,
		setEffectiveCursorTelemetry,

		isGeneratingCaptions,
		setIsGeneratingCaptions,
		autoCaptionProgress,
		setAutoCaptionProgress,
		whisperModelDownloadProgress,
		setWhisperModelDownloadProgress,
		whisperModelDownloadStatus,
		setWhisperModelDownloadStatus,
	};

	return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export function useEditorContext() {
	const context = useContext(EditorContext);
	if (context === undefined) {
		throw new Error("useEditorContext must be used within an EditorProvider");
	}
	return context;
}
