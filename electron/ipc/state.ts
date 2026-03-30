import type { ChildProcessWithoutNullStreams } from "node:child_process";
import { BrowserWindow } from "electron";

export type SelectedSource = {
	id?: string;
	name: string;
	display_id?: string;
	sourceType?: "screen" | "window";
	appName?: string;
	windowTitle?: string;
	[key: string]: unknown;
};

export type WindowBounds = {
	x: number;
	y: number;
	width: number;
	height: number;
};

export type NativeCaptureDiagnostics = {
	backend: "windows-wgc" | "mac-screencapturekit" | "browser-store" | "ffmpeg";
	phase: "availability" | "start" | "stop" | "mux";
	timestamp: string;
	sourceId?: string | null;
	sourceType?: SelectedSource["sourceType"] | "unknown";
	displayId?: number | null;
	displayBounds?: WindowBounds | null;
	windowHandle?: number | null;
	helperPath?: string | null;
	outputPath?: string | null;
	systemAudioPath?: string | null;
	microphonePath?: string | null;
	osRelease?: string;
	supported?: boolean;
	helperExists?: boolean;
	fileSizeBytes?: number | null;
	processOutput?: string;
	error?: string;
};

export type RecordingSessionData = {
	videoPath: string;
	webcamPath?: string | null;
	timeOffsetMs?: number;
};

export type SystemCursorAsset = {
	dataUrl: string;
	hotspotX: number;
	hotspotY: number;
	width: number;
	height: number;
};

export type CursorVisualType =
	| "arrow"
	| "text"
	| "pointer"
	| "crosshair"
	| "open-hand"
	| "closed-hand"
	| "resize-ew"
	| "resize-ns"
	| "not-allowed";

export type CursorTelemetryPoint = {
	timeMs: number;
	cx: number;
	cy: number;
	interactionType?: "click" | "double-click" | "right-click" | "middle-click" | "move" | "mouseup";
	cursorType?: CursorVisualType;
};

export type ProjectLibraryEntry = {
	path: string;
	name: string;
	updatedAt: number;
	thumbnailPath: string | null;
	isCurrent: boolean;
	isInProjectsDirectory: boolean;
};

class State {
	public selectedSource: SelectedSource | null = null;
	public currentProjectPath: string | null = null;
	public nativeScreenRecordingActive = false;
	public currentVideoPath: string | null = null;
	public currentRecordingSession: RecordingSessionData | null = null;
	public nativeCaptureProcess: ChildProcessWithoutNullStreams | null = null;
	public nativeCaptureOutputBuffer = "";
	public nativeCaptureTargetPath: string | null = null;
	public nativeCaptureStopRequested = false;
	public nativeCaptureSystemAudioPath: string | null = null;
	public nativeCaptureMicrophonePath: string | null = null;
	public nativeCapturePaused = false;

	public nativeCursorMonitorProcess: ChildProcessWithoutNullStreams | null = null;
	public nativeCursorMonitorOutputBuffer = "";
	public windowsCaptureProcess: ChildProcessWithoutNullStreams | null = null;
	public windowsCaptureOutputBuffer = "";
	public windowsCaptureTargetPath: string | null = null;
	public windowsNativeCaptureActive = false;
	public windowsCaptureStopRequested = false;
	public windowsCapturePaused = false;
	public windowsSystemAudioPath: string | null = null;
	public windowsMicAudioPath: string | null = null;
	public windowsPendingVideoPath: string | null = null;
	public lastNativeCaptureDiagnostics: NativeCaptureDiagnostics | null = null;
	public ffmpegScreenRecordingActive = false;
	public ffmpegCaptureProcess: ChildProcessWithoutNullStreams | null = null;
	public ffmpegCaptureOutputBuffer = "";
	public ffmpegCaptureTargetPath: string | null = null;
	public customRecordingsDir: string | null = null;
	public recordingsDirLoaded = false;
	public cachedSystemCursorAssets: Record<string, SystemCursorAsset> | null = null;
	public cachedSystemCursorAssetsSourceMtimeMs: number | null = null;
	public countdownTimer: ReturnType<typeof setInterval> | null = null;
	public countdownCancelled = false;
	public countdownInProgress = false;
	public countdownRemaining: number | null = null;
	public currentCursorVisualType: CursorVisualType | undefined = undefined;

	// Added state for recording lifecycle and telemetry
	public windowBoundsCaptureInterval: ReturnType<typeof setInterval> | null = null;
	public selectedWindowBounds: WindowBounds | null = null;
	public isCursorCaptureActive = false;
	public activeCursorSamples: CursorTelemetryPoint[] = [];
	public pendingCursorSamples: CursorTelemetryPoint[] = [];
	public cursorCaptureStartTimeMs = 0;
	public cursorCaptureInterval: ReturnType<typeof setInterval> | null = null;
	public lastLeftClick: { x: number; y: number; timeMs: number } | null = null;
	public linuxCursorScreenPoint: { x: number; y: number } | null = null;

	public broadcastSelectedSourceChange() {
		for (const window of BrowserWindow.getAllWindows()) {
			if (!window.isDestroyed()) {
				window.webContents.send("selected-source-changed", this.selectedSource);
			}
		}
	}
}

export const state = new State();
