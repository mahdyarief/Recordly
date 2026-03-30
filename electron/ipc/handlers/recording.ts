import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { constants as fsConstants } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { resolveWindowsCaptureDisplay } from "../windowsCaptureSelection";
import {
	BrowserWindow,
	desktopCapturer,
	ipcMain,
	systemPreferences,
} from "electron";
import {
	ensureSwiftHelperBinary,
	getCursorMonitorExePath,
	getNativeCaptureHelperBinaryPath,
	getNativeCaptureHelperSourcePath,
	getNativeCursorMonitorBinaryPath,
	getNativeCursorMonitorSourcePath,
	getWindowsCaptureExePath,
	parseWindowId,
	recordNativeCaptureDiagnostics,
	resolveLinuxWindowBounds,
	resolveMacWindowBounds,
} from "../helpers";
import {
	CursorVisualType,
	SelectedSource,
	state,
	WindowBounds,
} from "../state";
import {
	getFfmpegBinaryPath,
	getFileSizeIfPresent,
	getMacPrivacySettingsUrl,
	getRecordingsDir,
	getScreen,
	getTelemetryPathForVideo,
	isAutoRecordingPath,
	loadUiohookModule,
	moveFileWithOverwrite,
	normalizeVideoSourcePath,
	pruneAutoRecordings,
	validateRecordedVideo,
} from "../utils";

// --- Configuration Constants ---
const CURSOR_TELEMETRY_VERSION = 2;
const CURSOR_SAMPLE_INTERVAL_MS = 33;
const MAX_CURSOR_SAMPLES = 60 * 60 * 30; // 1 hour @ 30Hz

type CursorInteractionType =
	| "move"
	| "click"
	| "double-click"
	| "right-click"
	| "middle-click"
	| "mouseup";

// --- Internal Helper Functions ---

function clamp(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value));
}

export function stopWindowBoundsCapture() {
	if (state.windowBoundsCaptureInterval) {
		clearInterval(state.windowBoundsCaptureInterval);
		state.windowBoundsCaptureInterval = null;
	}
	state.selectedWindowBounds = null;
}

async function refreshSelectedWindowBounds() {
	if (!state.selectedSource?.id?.startsWith("window:")) {
		state.selectedWindowBounds = null;
		return;
	}

	let bounds: WindowBounds | null = null;
	if (process.platform === "darwin") {
		bounds = await resolveMacWindowBounds(state.selectedSource);
	} else if (process.platform === "linux") {
		bounds = await resolveLinuxWindowBounds(state.selectedSource);
	}

	state.selectedWindowBounds = bounds;
}

export function startWindowBoundsCapture() {
	stopWindowBoundsCapture();

	if (
		!["darwin", "linux"].includes(process.platform) ||
		!state.selectedSource?.id?.startsWith("window:")
	) {
		return;
	}

	void refreshSelectedWindowBounds();
	state.windowBoundsCaptureInterval = setInterval(() => {
		void refreshSelectedWindowBounds();
	}, 250);
}

function getNormalizedCursorPoint() {
	const fallbackCursor = getScreen().getCursorScreenPoint();
	const linuxCursorCache = process.platform === "linux" ? state.linuxCursorScreenPoint : null;
	const isLinuxCacheFresh =
		!!linuxCursorCache && Date.now() - (linuxCursorCache as any).updatedAt <= 1000;

	const cursor = isLinuxCacheFresh
		? { x: (linuxCursorCache as any).x, y: (linuxCursorCache as any).y }
		: fallbackCursor;

	const windowBounds = state.selectedSource?.id?.startsWith("window:")
		? state.selectedWindowBounds
		: null;
	if (windowBounds) {
		const width = Math.max(1, windowBounds.width);
		const height = Math.max(1, windowBounds.height);

		return {
			cx: clamp((cursor.x - windowBounds.x) / width, 0, 1),
			cy: clamp((cursor.y - windowBounds.y) / height, 0, 1),
		};
	}

	const sourceDisplayId = Number(state.selectedSource?.display_id);
	const sourceDisplay = Number.isFinite(sourceDisplayId)
		? (getScreen()
				.getAllDisplays()
				.find((display) => display.id === sourceDisplayId) ?? null)
		: null;
	const display = sourceDisplay ?? getScreen().getDisplayNearestPoint(cursor);
	const bounds = display.bounds;
	const width = Math.max(1, bounds.width);
	const height = Math.max(1, bounds.height);

	const cx = clamp((cursor.x - bounds.x) / width, 0, 1);
	const cy = clamp((cursor.y - bounds.y) / height, 0, 1);
	return { cx, cy };
}

function pushCursorSample(
	cx: number,
	cy: number,
	timeMs: number,
	interactionType: CursorInteractionType = "move",
	cursorType?: CursorVisualType,
) {
	state.activeCursorSamples.push({
		timeMs: Math.max(0, timeMs),
		cx,
		cy,
		interactionType,
		cursorType: cursorType ?? state.currentCursorVisualType,
	});

	if (state.activeCursorSamples.length > MAX_CURSOR_SAMPLES) {
		state.activeCursorSamples.shift();
	}
}

function sampleCursorPoint() {
	const point = getNormalizedCursorPoint();
	if (!point) return;
	pushCursorSample(point.cx, point.cy, Date.now() - state.cursorCaptureStartTimeMs, "move");
}

function stopCursorCapture() {
	if (state.cursorCaptureInterval) {
		clearInterval(state.cursorCaptureInterval);
		state.cursorCaptureInterval = null;
	}
}

function normalizeHookMouseButton(rawButton: unknown): 1 | 2 | 3 {
	if (typeof rawButton !== "number" || !Number.isFinite(rawButton)) return 1;
	if (rawButton === 2 || rawButton === 39) return 2;
	if (rawButton === 3 || rawButton === 38) return 3;
	return 1;
}

function getHookMouseButton(event: any): 1 | 2 | 3 {
	return normalizeHookMouseButton(
		event?.button ?? event?.mouseButton ?? event?.data?.button ?? event?.data?.mouseButton,
	);
}

function getHookCursorScreenPoint(event: any): { x: number; y: number } | null {
	const rawX = event?.x ?? event?.data?.x ?? event?.screenX ?? event?.data?.screenX;
	const rawY = event?.y ?? event?.data?.y ?? event?.screenY ?? event?.data?.screenY;

	if (
		typeof rawX !== "number" ||
		!Number.isFinite(rawX) ||
		typeof rawY !== "number" ||
		!Number.isFinite(rawY)
	) {
		return null;
	}
	return { x: rawX, y: rawY };
}

function snapshotCursorTelemetryForPersistence() {
	if (state.activeCursorSamples.length === 0) return;

	if (state.pendingCursorSamples.length === 0) {
		state.pendingCursorSamples = [...state.activeCursorSamples];
		return;
	}

	const lastPendingTimeMs =
		state.pendingCursorSamples[state.pendingCursorSamples.length - 1]?.timeMs ?? -1;
	state.pendingCursorSamples = [
		...state.pendingCursorSamples,
		...state.activeCursorSamples.filter((sample) => sample.timeMs > lastPendingTimeMs),
	];
}

async function persistPendingCursorTelemetry(videoPath: string) {
	const telemetryPath = getTelemetryPathForVideo(videoPath);
	if (state.pendingCursorSamples.length > 0) {
		await fs.writeFile(
			telemetryPath,
			JSON.stringify(
				{ version: CURSOR_TELEMETRY_VERSION, samples: state.pendingCursorSamples },
				null,
				2,
			),
			"utf-8",
		);
	}
	state.pendingCursorSamples = [];
}

async function finalizeStoredVideo(videoPath: string) {
	const validation = await validateRecordedVideo(videoPath);

	snapshotCursorTelemetryForPersistence();
	state.currentVideoPath = videoPath;
	state.currentProjectPath = null;
	await persistPendingCursorTelemetry(videoPath);
	if (isAutoRecordingPath(videoPath)) {
		await pruneAutoRecordings([videoPath]);
	}

	if (state.lastNativeCaptureDiagnostics?.backend === "mac-screencapturekit") {
		recordNativeCaptureDiagnostics({
			backend: "mac-screencapturekit",
			phase: "stop",
			sourceId: state.lastNativeCaptureDiagnostics.sourceId ?? null,
			sourceType: state.lastNativeCaptureDiagnostics.sourceType ?? "unknown",
			displayId: state.lastNativeCaptureDiagnostics.displayId ?? null,
			displayBounds: state.lastNativeCaptureDiagnostics.displayBounds ?? null,
			windowHandle: state.lastNativeCaptureDiagnostics.windowHandle ?? null,
			helperPath: state.lastNativeCaptureDiagnostics.helperPath ?? null,
			outputPath: videoPath,
			systemAudioPath: state.lastNativeCaptureDiagnostics.systemAudioPath ?? null,
			microphonePath: state.lastNativeCaptureDiagnostics.microphonePath ?? null,
			osRelease: state.lastNativeCaptureDiagnostics.osRelease,
			supported: state.lastNativeCaptureDiagnostics.supported,
			helperExists: state.lastNativeCaptureDiagnostics.helperExists,
			processOutput: state.lastNativeCaptureDiagnostics.processOutput,
			fileSizeBytes: validation.fileSizeBytes,
		});
	}

	return {
		success: true,
		path: videoPath,
		message:
			validation.durationSeconds !== null
				? `Video stored successfully (${validation.fileSizeBytes} bytes, ${validation.durationSeconds.toFixed(2)}s)`
				: `Video stored successfully (${validation.fileSizeBytes} bytes)`,
	};
}

let interactionCaptureCleanup: (() => void) | null = null;
function stopInteractionCapture() {
	if (interactionCaptureCleanup) {
		interactionCaptureCleanup();
		interactionCaptureCleanup = null;
	}
}

async function startInteractionCapture() {
	if (!state.isCursorCaptureActive) return;
	if (!["darwin", "win32", "linux"].includes(process.platform)) return;

	try {
		const hook = loadUiohookModule();
		if (
			!state.isCursorCaptureActive ||
			!hook ||
			typeof hook.on !== "function" ||
			typeof hook.start !== "function"
		) {
			return;
		}

		const onMouseDown = (event: any) => {
			if (!state.isCursorCaptureActive) return;

			const point = getNormalizedCursorPoint();
			if (!point) return;

			const timeMs = Date.now() - state.cursorCaptureStartTimeMs;
			const button = getHookMouseButton(event);
			let interactionType: CursorInteractionType = "click";

			if (button === 2) {
				interactionType = "right-click";
			} else if (button === 3) {
				interactionType = "middle-click";
			} else {
				const thresholdMs = 350;
				const distance = state.lastLeftClick
					? Math.hypot(point.cx - state.lastLeftClick.x, point.cy - state.lastLeftClick.y)
					: Number.POSITIVE_INFINITY;

				if (
					state.lastLeftClick &&
					timeMs - state.lastLeftClick.timeMs <= thresholdMs &&
					distance <= 0.04
				) {
					interactionType = "double-click";
				}

				state.lastLeftClick = { timeMs, x: point.cx, y: point.cy };
			}

			pushCursorSample(point.cx, point.cy, timeMs, interactionType);
		};

		const onMouseUp = (_event: any) => {
			if (!state.isCursorCaptureActive) return;
			const point = getNormalizedCursorPoint();
			if (!point) return;
			const timeMs = Date.now() - state.cursorCaptureStartTimeMs;
			pushCursorSample(point.cx, point.cy, timeMs, "mouseup");
		};

		const onMouseMove = (event: any) => {
			if (process.platform !== "linux" || !state.isCursorCaptureActive) return;
			const point = getHookCursorScreenPoint(event);
			if (!point) return;
			state.linuxCursorScreenPoint = { x: point.x, y: point.y, updatedAt: Date.now() } as any;
		};

		hook.on("mousedown", onMouseDown);
		hook.on("mouseup", onMouseUp);
		hook.on("mousemove", onMouseMove);
		hook.start();

		interactionCaptureCleanup = () => {
			try {
				hook.off("mousedown", onMouseDown);
				hook.off("mouseup", onMouseUp);
				hook.off("mousemove", onMouseMove);
				hook.stop();
			} catch {
				/* ignore stop errors */
			}
		};
	} catch (error) {
		console.warn("Failed to start interaction capture:", error);
	}
}

function handleCursorMonitorStdout(chunk: Buffer) {
	state.nativeCursorMonitorOutputBuffer += chunk.toString();
	const lines = state.nativeCursorMonitorOutputBuffer.split(/\r?\n/);
	state.nativeCursorMonitorOutputBuffer = lines.pop() ?? "";

	for (const line of lines) {
		const match = line.match(/^STATE:(.+)$/);
		if (!match) continue;
		const next = match[1].trim() as CursorVisualType;
		const validTypes = [
			"arrow",
			"text",
			"pointer",
			"crosshair",
			"open-hand",
			"closed-hand",
			"resize-ew",
			"resize-ns",
			"not-allowed",
		];
		if (validTypes.includes(next)) {
			if (state.currentCursorVisualType !== next) {
				state.currentCursorVisualType = next;
				sampleCursorStateChange(next);
				emitCursorStateChanged(next);
			}
		}
	}
}

function emitCursorStateChanged(cursorType: CursorVisualType) {
	BrowserWindow.getAllWindows().forEach((window) => {
		if (!window.isDestroyed()) {
			window.webContents.send("cursor-state-changed", { cursorType });
		}
	});
}

function sampleCursorStateChange(cursorType: CursorVisualType) {
	if (!state.isCursorCaptureActive) return;
	const point = getNormalizedCursorPoint();
	if (!point) return;
	pushCursorSample(
		point.cx,
		point.cy,
		Date.now() - state.cursorCaptureStartTimeMs,
		"move",
		cursorType,
	);
}

async function ensureNativeCursorMonitorBinary() {
	return ensureSwiftHelperBinary(
		getNativeCursorMonitorSourcePath(),
		getNativeCursorMonitorBinaryPath(),
		"native cursor monitor helper",
		"openscreen-native-cursor-monitor",
	);
}

function stopNativeCursorMonitor() {
	state.currentCursorVisualType = "arrow";
	if (!state.nativeCursorMonitorProcess) return;
	try {
		state.nativeCursorMonitorProcess.stdin?.write("stop\n");
	} catch {
		/* ignore */
	}
	try {
		state.nativeCursorMonitorProcess.kill();
	} catch {
		/* ignore */
	}
	state.nativeCursorMonitorProcess = null;
	state.nativeCursorMonitorOutputBuffer = "";
}

async function startNativeCursorMonitor() {
	stopNativeCursorMonitor();
	if (process.platform !== "darwin" && process.platform !== "win32") {
		state.currentCursorVisualType = "arrow";
		return;
	}

	try {
		let helperPath: string;
		if (process.platform === "win32") {
			helperPath = getCursorMonitorExePath();
			try {
				await fs.access(helperPath, fsConstants.X_OK);
			} catch {
				console.warn("Windows cursor monitor helper missing or not executable:", helperPath);
				state.currentCursorVisualType = "arrow";
				return;
			}
		} else {
			helperPath = await ensureNativeCursorMonitorBinary();
		}

		state.nativeCursorMonitorOutputBuffer = "";
		state.currentCursorVisualType = "arrow";
		state.nativeCursorMonitorProcess = spawn(helperPath, [], { stdio: ["pipe", "pipe", "pipe"] });

		state.nativeCursorMonitorProcess.on("error", (error) => {
			console.warn("Native cursor monitor process error:", error);
			state.nativeCursorMonitorProcess = null;
			state.nativeCursorMonitorOutputBuffer = "";
			state.currentCursorVisualType = "arrow";
		});

		state.nativeCursorMonitorProcess.stdout?.on("data", handleCursorMonitorStdout);

		state.nativeCursorMonitorProcess.on("close", () => {
			state.nativeCursorMonitorProcess = null;
			state.nativeCursorMonitorOutputBuffer = "";
			state.currentCursorVisualType = "arrow";
		});
	} catch (error) {
		console.warn("Failed to start native cursor monitor:", error);
		state.nativeCursorMonitorProcess = null;
		state.nativeCursorMonitorOutputBuffer = "";
		state.currentCursorVisualType = "arrow";
	}
}

function showCursor() {
	// This is handled by the renderer or native OS level generally in Recordly,
	// but we can add platform-specific logic here if needed.
}

function waitForNativeCaptureStart(process: ChildProcessWithoutNullStreams) {
	return new Promise<void>((resolve, reject) => {
		const timer = setTimeout(() => {
			cleanup();
			reject(new Error("Timed out waiting for ScreenCaptureKit recorder to start"));
		}, 12000);
		const onStdout = (chunk: Buffer) => {
			const text = chunk.toString();
			if (text.includes("Recording started")) {
				cleanup();
				resolve();
			}
		};
		const onError = (error: Error) => {
			cleanup();
			reject(error);
		};
		const onExit = (code: number | null) => {
			cleanup();
			reject(
				new Error(
					state.nativeCaptureOutputBuffer.trim() ||
						`Native capture helper exited before recording started (code ${code ?? "unknown"})`,
				),
			);
		};
		const cleanup = () => {
			clearTimeout(timer);
			process.stdout.off("data", onStdout);
			process.off("error", onError);
			process.off("exit", onExit);
		};
		process.stdout.on("data", onStdout);
		process.once("error", onError);
		process.once("exit", onExit);
	});
}

function waitForNativeCaptureStop(process: ChildProcessWithoutNullStreams) {
	return new Promise<string>((resolve, reject) => {
		const onClose = (code: number | null) => {
			cleanup();
			const match = state.nativeCaptureOutputBuffer.match(/Recording stopped\. Output path: (.+)/);
			if (match?.[1]) {
				resolve(match[1].trim());
				return;
			}
			if (code === 0 && state.nativeCaptureTargetPath) {
				resolve(state.nativeCaptureTargetPath);
				return;
			}
			reject(
				new Error(
					state.nativeCaptureOutputBuffer.trim() ||
						`Native capture helper exited with code ${code ?? "unknown"}`,
				),
			);
		};
		const onError = (error: Error) => {
			cleanup();
			reject(error);
		};
		const cleanup = () => {
			process.off("close", onClose);
			process.off("error", onError);
		};
		process.once("close", onClose);
		process.once("error", onError);
	});
}

function waitForWindowsCaptureStart(process: ChildProcessWithoutNullStreams) {
	return new Promise<void>((resolve, reject) => {
		const timer = setTimeout(() => {
			cleanup();
			reject(new Error("Timed out waiting for Windows WGC capture to start"));
		}, 12000);
		const onStdout = (chunk: Buffer) => {
			if (chunk.toString().includes("is now recording")) {
				cleanup();
				resolve();
			}
		};
		const onError = (error: Error) => {
			cleanup();
			reject(error);
		};
		const onExit = (code: number | null) => {
			cleanup();
			reject(
				new Error(
					state.windowsCaptureOutputBuffer.trim() ||
						`Windows capture helper exited before recording started (code ${code ?? "unknown"})`,
				),
			);
		};
		const cleanup = () => {
			clearTimeout(timer);
			process.stdout.off("data", onStdout);
			process.off("error", onError);
			process.off("exit", onExit);
		};
		process.stdout.on("data", onStdout);
		process.once("error", onError);
		process.once("exit", onExit);
	});
}

function waitForWindowsCaptureStop(process: ChildProcessWithoutNullStreams) {
	return new Promise<string>((resolve, reject) => {
		const onClose = (code: number | null) => {
			cleanup();
			const match = state.windowsCaptureOutputBuffer.match(/Recording stopped.*output path: (.+)/i);
			if (match?.[1]) {
				resolve(match[1].trim());
				return;
			}
			if (code === 0 && state.windowsCaptureTargetPath) {
				resolve(state.windowsCaptureTargetPath);
				return;
			}
			reject(
				new Error(
					state.windowsCaptureOutputBuffer.trim() ||
						`Windows capture helper exited with code ${code ?? "unknown"}`,
				),
			);
		};
		const onError = (error: Error) => {
			cleanup();
			reject(error);
		};
		const cleanup = () => {
			process.off("close", onClose);
			process.off("error", onError);
		};
		process.once("close", onClose);
		process.once("error", onError);
	});
}

async function muxNativeMacRecordingWithAudio(
	videoPath: string,
	systemAudioPath?: string | null,
	microphonePath?: string | null,
) {
	const ffmpegPath = getFfmpegBinaryPath();
	const mixedOutputPath = `${videoPath}.mixed.mp4`;
	const inputs = ["-i", videoPath];
	const availableAudioInputs: string[] = [];

	if (systemAudioPath) {
		try {
			await fs.access(systemAudioPath);
			inputs.push("-i", systemAudioPath);
			availableAudioInputs.push("system");
		} catch {
			/* ignore */
		}
	}
	if (microphonePath) {
		try {
			await fs.access(microphonePath);
			inputs.push("-i", microphonePath);
			availableAudioInputs.push("microphone");
		} catch {
			/* ignore */
		}
	}

	if (availableAudioInputs.length === 0) return;

	const args =
		availableAudioInputs.length === 2
			? [
					"-y",
					...inputs,
					"-filter_complex",
					"[1:a][2:a]amix=inputs=2:duration=longest:normalize=0[aout]",
					"-map",
					"0:v:0",
					"-map",
					"[aout]",
					"-c:v",
					"copy",
					"-c:a",
					"aac",
					"-b:a",
					"192k",
					"-shortest",
					mixedOutputPath,
				]
			: [
					"-y",
					...inputs,
					"-map",
					"0:v:0",
					"-map",
					"1:a:0",
					"-c:v",
					"copy",
					"-c:a",
					"aac",
					"-b:a",
					"192k",
					"-shortest",
					mixedOutputPath,
				];

	const { execFile } = await import("node:child_process");
	const execFileAsync = (await import("node:util")).promisify(execFile);
	await execFileAsync(ffmpegPath, args, { timeout: 120000, maxBuffer: 10 * 1024 * 1024 });
	await moveFileWithOverwrite(mixedOutputPath, videoPath);

	for (const audioPath of [systemAudioPath, microphonePath]) {
		if (audioPath) await fs.rm(audioPath, { force: true }).catch(() => {});
	}
}

async function muxNativeWindowsVideoWithAudio(
	videoPath: string,
	systemAudioPath?: string | null,
	microphonePath?: string | null,
) {
	// Similar to Mac muxing but might have Windows-specific needs
	return muxNativeMacRecordingWithAudio(videoPath, systemAudioPath, microphonePath);
}

function attachWindowsCaptureLifecycle(process: ChildProcessWithoutNullStreams) {
	process.on("close", () => {
		const wasActive = state.windowsNativeCaptureActive;
		state.windowsCaptureProcess = null;
		if (!wasActive || state.windowsCaptureStopRequested) return;
		state.windowsNativeCaptureActive = false;
		state.nativeScreenRecordingActive = false;
		state.windowsCaptureTargetPath = null;
		state.windowsCaptureStopRequested = false;
		state.windowsCapturePaused = false;

		const sourceName = state.selectedSource?.name ?? "Screen";
		BrowserWindow.getAllWindows().forEach((window) => {
			if (!window.isDestroyed())
				window.webContents.send("recording-state-changed", { recording: false, sourceName });
		});

		emitRecordingInterrupted("capture-stopped", "Native Windows recording stopped unexpectedly.");
	});
}

function attachNativeCaptureLifecycle(process: ChildProcessWithoutNullStreams) {
	process.on("close", () => {
		const wasActive = state.nativeScreenRecordingActive;
		state.nativeCaptureProcess = null;
		if (!wasActive || state.nativeCaptureStopRequested) return;
		state.nativeScreenRecordingActive = false;
		state.nativeCaptureTargetPath = null;
		state.nativeCaptureStopRequested = false;
		state.nativeCaptureSystemAudioPath = null;
		state.nativeCaptureMicrophonePath = null;

		const sourceName = state.selectedSource?.name ?? "Screen";
		BrowserWindow.getAllWindows().forEach((window) => {
			if (!window.isDestroyed())
				window.webContents.send("recording-state-changed", { recording: false, sourceName });
		});

		const message = state.nativeCaptureOutputBuffer.includes("WINDOW_UNAVAILABLE")
			? "The selected window is no longer capturable. Please reselect a window."
			: "Recording stopped unexpectedly.";
		emitRecordingInterrupted(
			state.nativeCaptureOutputBuffer.includes("WINDOW_UNAVAILABLE")
				? "window-unavailable"
				: "capture-stopped",
			message,
		);
	});
}

function emitRecordingInterrupted(reason: string, message: string) {
	BrowserWindow.getAllWindows().forEach((window) => {
		if (!window.isDestroyed())
			window.webContents.send("recording-interrupted", { reason, message });
	});
}

async function ensureNativeCaptureHelperBinary() {
	return ensureSwiftHelperBinary(
		getNativeCaptureHelperSourcePath(),
		getNativeCaptureHelperBinaryPath(),
		"native ScreenCaptureKit helper",
		"openscreen-screencapturekit-helper",
	);
}

async function recoverNativeMacCaptureOutput() {
	const diagnosticsPath =
		state.lastNativeCaptureDiagnostics?.backend === "mac-screencapturekit"
			? (state.lastNativeCaptureDiagnostics.outputPath ?? null)
			: null;
	const candidatePath = state.nativeCaptureTargetPath ?? diagnosticsPath;
	if (!candidatePath) return null;
	try {
		return await finalizeStoredVideo(candidatePath);
	} catch (error) {
		recordNativeCaptureDiagnostics({
			backend: "mac-screencapturekit",
			phase: "stop",
			outputPath: candidatePath,
			systemAudioPath: state.nativeCaptureSystemAudioPath,
			microphonePath: state.nativeCaptureMicrophonePath,
			processOutput: state.nativeCaptureOutputBuffer.trim() || undefined,
			fileSizeBytes: await getFileSizeIfPresent(candidatePath),
			error: String(error),
		});
		return null;
	}
}

async function isNativeWindowsCaptureAvailable() {
	if (process.platform !== "win32") return false;
	const release = (await import("node:os")).release();
	const major = Number.parseInt(release.split(".")[0], 10);
	const build = Number.parseInt(release.split(".")[2], 10);
	return major > 10 || (major === 10 && build >= 19041);
}

export function killWindowsCaptureProcess() {
	if (state.windowsCaptureProcess) {
		try {
			state.windowsCaptureProcess.kill();
		} catch {
			/* ignore */
		}
		state.windowsCaptureProcess = null;
		state.windowsCaptureTargetPath = null;
		state.windowsNativeCaptureActive = false;
		state.nativeScreenRecordingActive = false;
		state.windowsCaptureStopRequested = false;
		state.windowsCapturePaused = false;
		state.windowsSystemAudioPath = null;
		state.windowsMicAudioPath = null;
		state.windowsPendingVideoPath = null;
	}
}

async function buildFfmpegCaptureArgs(_source: SelectedSource, outputPath: string) {
	const args: string[] = ["-y", "-hide_banner"];

	if (process.platform === "darwin") {
		args.push("-f", "avfoundation", "-i", "1:0");
	} else if (process.platform === "win32") {
		args.push("-f", "gdigrab", "-framerate", "30", "-i", "desktop");
	} else {
		args.push("-f", "x11grab", "-framerate", "30", "-i", ":0.0");
	}

	args.push("-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", outputPath);
	return args;
}

function waitForFfmpegCaptureStart(process: ChildProcessWithoutNullStreams) {
	return new Promise<void>((resolve, _reject) => {
		const timer = setTimeout(() => {
			cleanup();
			resolve();
		}, 3000); // FFmpeg might not always log a clear "started" message
		const onStderr = (chunk: Buffer) => {
			if (chunk.toString().includes("Press [q] to stop")) {
				cleanup();
				resolve();
			}
		};
		const cleanup = () => {
			clearTimeout(timer);
			process.stderr.off("data", onStderr);
		};
		process.stderr.on("data", onStderr);
	});
}

function waitForFfmpegCaptureStop(process: ChildProcessWithoutNullStreams, outputPath: string) {
	return new Promise<string>((resolve, reject) => {
		const onClose = () => {
			cleanup();
			resolve(outputPath);
		};
		const onError = (error: Error) => {
			cleanup();
			reject(error);
		};
		const cleanup = () => {
			process.off("close", onClose);
			process.off("error", onError);
		};
		process.once("close", onClose);
		process.once("error", onError);
	});
}

// --- Main Registration Function ---

export function registerRecordingHandlers(
	onRecordingStateChange?: (recording: boolean, sourceName: string) => void,
) {
	ipcMain.handle(
		"start-native-screen-recording",
		async (_, source: SelectedSource, options?: any) => {
			if (process.platform === "win32") {
				const windowsCaptureAvailable = await isNativeWindowsCaptureAvailable();
				if (!windowsCaptureAvailable)
					return { success: false, message: "Native Windows capture is not available." };

				if (state.windowsCaptureProcess && !state.windowsNativeCaptureActive) {
					try {
						state.windowsCaptureProcess.kill();
					} catch {
						/* ignore */
					}
					state.windowsCaptureProcess = null;
					state.windowsCaptureTargetPath = null;
					state.windowsCaptureStopRequested = false;
				}

				if (state.windowsCaptureProcess)
					return {
						success: false,
						message: "A native Windows screen recording is already active.",
					};

				try {
					const exePath = getWindowsCaptureExePath();
					const recordingsDir = await getRecordingsDir();
					const timestamp = Date.now();
					const outputPath = path.join(recordingsDir, `recording-${timestamp}.mp4`);

					const config: Record<string, any> = { outputPath, fps: 60 };
					if (options?.capturesSystemAudio) {
						const audioPath = path.join(recordingsDir, `recording-${timestamp}.system.wav`);
						config.captureSystemAudio = true;
						config.audioOutputPath = audioPath;
						state.windowsSystemAudioPath = audioPath;
					}
					if (options?.capturesMicrophone) {
						const micPath = path.join(recordingsDir, `recording-${timestamp}.mic.wav`);
						config.captureMic = true;
						config.micOutputPath = micPath;
						if (options.microphoneLabel) config.micDeviceName = options.microphoneLabel;
						state.windowsMicAudioPath = micPath;
					}

					const windowId = parseWindowId(source?.id);
					if (windowId && source?.id?.startsWith("window:")) {
						config.windowHandle = windowId;
					} else {
						const resolvedDisplay = resolveWindowsCaptureDisplay(
							source,
							getScreen().getAllDisplays(),
							getScreen().getPrimaryDisplay(),
						);
						config.displayId = resolvedDisplay.displayId;
						config.displayX = Math.round(resolvedDisplay.bounds.x);
						config.displayY = Math.round(resolvedDisplay.bounds.y);
						config.displayW = Math.round(resolvedDisplay.bounds.width);
						config.displayH = Math.round(resolvedDisplay.bounds.height);
					}

					state.windowsCaptureOutputBuffer = "";
					state.windowsCaptureTargetPath = outputPath;
					state.windowsCaptureStopRequested = false;
					state.windowsCapturePaused = false;
					state.windowsCaptureProcess = spawn(exePath, [JSON.stringify(config)], {
						cwd: recordingsDir,
						stdio: ["pipe", "pipe", "pipe"],
					});
					attachWindowsCaptureLifecycle(state.windowsCaptureProcess);

					state.windowsCaptureProcess.stdout?.on("data", (chunk: Buffer) => {
						state.windowsCaptureOutputBuffer += chunk.toString();
					});
					state.windowsCaptureProcess.stderr?.on("data", (chunk: Buffer) => {
						state.windowsCaptureOutputBuffer += chunk.toString();
					});

					await waitForWindowsCaptureStart(state.windowsCaptureProcess);
					state.windowsNativeCaptureActive = true;
					state.nativeScreenRecordingActive = true;
					return { success: true };
				} catch (error) {
					console.error("Failed to start native Windows capture:", error);
					state.windowsNativeCaptureActive = false;
					state.nativeScreenRecordingActive = false;
					state.windowsCaptureProcess = null;
					return {
						success: false,
						message: "Failed to start native Windows capture",
						error: String(error),
					};
				}
			}

			if (process.platform !== "darwin")
				return { success: false, message: "Native screen recording is only available on macOS." };

			if (state.nativeCaptureProcess && !state.nativeScreenRecordingActive) {
				try {
					state.nativeCaptureProcess.kill();
				} catch {
					/* ignore */
				}
				state.nativeCaptureProcess = null;
				state.nativeCaptureTargetPath = null;
				state.nativeCaptureStopRequested = false;
			}

			if (state.nativeCaptureProcess)
				return { success: false, message: "A native screen recording is already active." };

			try {
				const recordingsDir = await getRecordingsDir();
				try {
					await desktopCapturer.getSources({
						types: ["screen"],
						thumbnailSize: { width: 1, height: 1 },
					});
				} catch {
					/* ignore */
				}

				if (options?.capturesMicrophone) {
					const micStatus = systemPreferences.getMediaAccessStatus("microphone");
					if (micStatus !== "granted") await systemPreferences.askForMediaAccess("microphone");
				}

				const helperPath = await ensureNativeCaptureHelperBinary();
				const outputPath = path.join(recordingsDir, `recording-${Date.now()}.mp4`);
				const capturesSystemAudio = Boolean(options?.capturesSystemAudio);
				const capturesMicrophone = Boolean(options?.capturesMicrophone);
				const systemAudioOutputPath = capturesSystemAudio
					? path.join(recordingsDir, `recording-${Date.now()}.system.m4a`)
					: null;
				const microphoneOutputPath = capturesMicrophone
					? path.join(recordingsDir, `recording-${Date.now()}.mic.m4a`)
					: null;

				const config: Record<string, any> = {
					fps: 60,
					outputPath,
					capturesSystemAudio,
					capturesMicrophone,
				};
				if (options?.microphoneDeviceId) config.microphoneDeviceId = options.microphoneDeviceId;
				if (options?.microphoneLabel) config.microphoneLabel = options.microphoneLabel;
				if (systemAudioOutputPath) config.systemAudioOutputPath = systemAudioOutputPath;
				if (microphoneOutputPath) config.microphoneOutputPath = microphoneOutputPath;

				const windowId = parseWindowId(source?.id);
				const screenId = Number(source?.display_id);
				if (Number.isFinite(windowId) && windowId && source?.id?.startsWith("window:")) {
					config.windowId = windowId;
				} else if (Number.isFinite(screenId) && screenId > 0) {
					config.displayId = screenId;
				} else {
					config.displayId = Number(getScreen().getPrimaryDisplay().id);
				}

				state.nativeCaptureOutputBuffer = "";
				state.nativeCaptureTargetPath = outputPath;
				state.nativeCaptureSystemAudioPath = systemAudioOutputPath;
				state.nativeCaptureMicrophonePath = microphoneOutputPath;
				state.nativeCaptureStopRequested = false;
				state.nativeCapturePaused = false;
				state.nativeCaptureProcess = spawn(helperPath, [JSON.stringify(config)], {
					cwd: recordingsDir,
					stdio: ["pipe", "pipe", "pipe"],
				});
				attachNativeCaptureLifecycle(state.nativeCaptureProcess);

				state.nativeCaptureProcess.stdout?.on("data", (chunk: Buffer) => {
					state.nativeCaptureOutputBuffer += chunk.toString();
				});
				state.nativeCaptureProcess.stderr?.on("data", (chunk: Buffer) => {
					state.nativeCaptureOutputBuffer += chunk.toString();
				});

				await waitForNativeCaptureStart(state.nativeCaptureProcess);
				state.nativeScreenRecordingActive = true;
				return { success: true };
			} catch (error) {
				console.error("Failed to start native ScreenCaptureKit recording:", error);
				state.nativeScreenRecordingActive = false;
				state.nativeCaptureProcess = null;
				return {
					success: false,
					message: "Failed to start native macOS recording",
					error: String(error),
				};
			}
		},
	);

	ipcMain.handle("stop-native-screen-recording", async () => {
		if (process.platform === "win32" && state.windowsNativeCaptureActive) {
			try {
				if (!state.windowsCaptureProcess)
					throw new Error("Native Windows capture process not running");
				const proc = state.windowsCaptureProcess;
				const preferredVideoPath = state.windowsCaptureTargetPath;
				state.windowsCaptureStopRequested = true;
				proc.stdin?.write("stop\n");
				const tempVideoPath = await waitForWindowsCaptureStop(proc);
				state.windowsCaptureProcess = null;
				state.windowsNativeCaptureActive = false;
				state.nativeScreenRecordingActive = false;
				state.windowsCaptureTargetPath = null;
				state.windowsCaptureStopRequested = false;

				const finalVideoPath = preferredVideoPath ?? tempVideoPath;
				if (tempVideoPath !== finalVideoPath)
					await moveFileWithOverwrite(tempVideoPath, finalVideoPath);
				state.windowsPendingVideoPath = finalVideoPath;
				return { success: true, path: finalVideoPath };
			} catch (error) {
				console.error("Failed to stop native Windows capture:", error);
				state.windowsNativeCaptureActive = false;
				state.nativeScreenRecordingActive = false;
				state.windowsCaptureProcess = null;
				state.windowsCaptureTargetPath = null;
				return {
					success: false,
					message: "Failed to stop native Windows capture",
					error: String(error),
				};
			}
		}

		if (process.platform !== "darwin")
			return { success: false, message: "Native screen recording only on macOS." };
		if (!state.nativeScreenRecordingActive) {
			const recovered = await recoverNativeMacCaptureOutput();
			return recovered || { success: false, message: "No active native recording." };
		}

		try {
			if (!state.nativeCaptureProcess) throw new Error("Native capture process not running");
			const proc = state.nativeCaptureProcess;
			const preferredVideoPath = state.nativeCaptureTargetPath;
			const preferredSystemAudioPath = state.nativeCaptureSystemAudioPath;
			const preferredMicrophonePath = state.nativeCaptureMicrophonePath;
			state.nativeCaptureStopRequested = true;
			proc.stdin?.write("stop\n");
			const tempVideoPath = await waitForNativeCaptureStop(proc);
			state.nativeCaptureProcess = null;
			state.nativeScreenRecordingActive = false;
			state.nativeCaptureTargetPath = null;
			state.nativeCaptureSystemAudioPath = null;
			state.nativeCaptureMicrophonePath = null;

			const finalVideoPath = preferredVideoPath ?? tempVideoPath;
			if (tempVideoPath !== finalVideoPath)
				await moveFileWithOverwrite(tempVideoPath, finalVideoPath);
			if (preferredSystemAudioPath || preferredMicrophonePath) {
				await muxNativeMacRecordingWithAudio(
					finalVideoPath,
					preferredSystemAudioPath,
					preferredMicrophonePath,
				).catch((e) => console.warn("Mux error:", e));
			}
			return await finalizeStoredVideo(finalVideoPath);
		} catch (error) {
			console.error("Failed to stop native macOS recording:", error);
			state.nativeScreenRecordingActive = false;
			state.nativeCaptureProcess = null;
			return {
				success: false,
				message: "Failed to stop native macOS recording",
				error: String(error),
			};
		}
	});

	ipcMain.handle("recover-native-screen-recording", async () => {
		if (process.platform !== "darwin") return { success: false, message: "Mac only." };
		const recovered = await recoverNativeMacCaptureOutput();
		return recovered || { success: false, message: "No recoverable output." };
	});

	ipcMain.handle("pause-native-screen-recording", async () => {
		const proc =
			process.platform === "win32" ? state.windowsCaptureProcess : state.nativeCaptureProcess;
		const active =
			process.platform === "win32"
				? state.windowsNativeCaptureActive
				: state.nativeScreenRecordingActive;
		const paused =
			process.platform === "win32" ? state.windowsCapturePaused : state.nativeCapturePaused;

		if (!active || !proc) return { success: false, message: "No active recording." };
		if (paused) return { success: true };

		try {
			proc.stdin?.write("pause\n");
			if (process.platform === "win32") state.windowsCapturePaused = true;
			else state.nativeCapturePaused = true;
			return { success: true };
		} catch (error) {
			return { success: false, message: "Failed to pause", error: String(error) };
		}
	});

	ipcMain.handle("resume-native-screen-recording", async () => {
		const proc =
			process.platform === "win32" ? state.windowsCaptureProcess : state.nativeCaptureProcess;
		const active =
			process.platform === "win32"
				? state.windowsNativeCaptureActive
				: state.nativeScreenRecordingActive;
		const paused =
			process.platform === "win32" ? state.windowsCapturePaused : state.nativeCapturePaused;

		if (!active || !proc) return { success: false, message: "No active recording." };
		if (!paused) return { success: true };

		try {
			proc.stdin?.write("resume\n");
			if (process.platform === "win32") state.windowsCapturePaused = false;
			else state.nativeCapturePaused = false;
			return { success: true };
		} catch (error) {
			return { success: false, message: "Failed to resume", error: String(error) };
		}
	});

	ipcMain.handle("get-system-cursor-assets", async () => {
		// Mocked as this depends on a helper
		return { success: true, cursors: {} };
	});

	ipcMain.handle("is-native-windows-capture-available", async () => {
		return { available: await isNativeWindowsCaptureAvailable() };
	});

	ipcMain.handle("get-last-native-capture-diagnostics", async () => {
		return { success: true, diagnostics: state.lastNativeCaptureDiagnostics };
	});

	ipcMain.handle("mux-native-windows-recording", async () => {
		const videoPath = state.windowsPendingVideoPath;
		state.windowsPendingVideoPath = null;
		if (!videoPath) return { success: false, message: "No pending video." };
		try {
			if (state.windowsSystemAudioPath || state.windowsMicAudioPath) {
				await muxNativeWindowsVideoWithAudio(
					videoPath,
					state.windowsSystemAudioPath,
					state.windowsMicAudioPath,
				);
				state.windowsSystemAudioPath = null;
				state.windowsMicAudioPath = null;
			}
			return await finalizeStoredVideo(videoPath);
		} catch (error) {
			console.error("Mux error:", error);
			return { success: false, error: String(error) };
		}
	});

	ipcMain.handle("start-ffmpeg-recording", async (_, source: SelectedSource) => {
		if (state.ffmpegCaptureProcess) return { success: false, message: "FFmpeg recording active." };
		try {
			const recordingsDir = await getRecordingsDir();
			const ffmpegPath = getFfmpegBinaryPath();
			const outputPath = path.join(recordingsDir, `recording-${Date.now()}.mp4`);
			const args = await buildFfmpegCaptureArgs(source, outputPath);
			state.ffmpegCaptureProcess = spawn(ffmpegPath, args, {
				cwd: recordingsDir,
				stdio: ["pipe", "pipe", "pipe"],
			});
			await waitForFfmpegCaptureStart(state.ffmpegCaptureProcess);
			state.ffmpegScreenRecordingActive = true;
			state.ffmpegCaptureTargetPath = outputPath;
			return { success: true };
		} catch (error) {
			console.error("FFmpeg start error:", error);
			return { success: false, error: String(error) };
		}
	});

	ipcMain.handle("stop-ffmpeg-recording", async () => {
		if (
			!state.ffmpegScreenRecordingActive ||
			!state.ffmpegCaptureProcess ||
			!state.ffmpegCaptureTargetPath
		) {
			return { success: false, message: "No active FFmpeg recording." };
		}
		try {
			const proc = state.ffmpegCaptureProcess;
			const outputPath = state.ffmpegCaptureTargetPath;
			proc.stdin?.write("q\n");
			const finalPath = await waitForFfmpegCaptureStop(proc, outputPath);
			state.ffmpegCaptureProcess = null;
			state.ffmpegScreenRecordingActive = false;
			return await finalizeStoredVideo(finalPath);
		} catch (error) {
			console.error("FFmpeg stop error:", error);
			return { success: false, error: String(error) };
		}
	});

	ipcMain.handle("store-recorded-video", async (_, videoData: ArrayBuffer, fileName: string) => {
		try {
			const recordingsDir = await getRecordingsDir();
			const videoPath = path.join(recordingsDir, fileName);
			await fs.writeFile(videoPath, Buffer.from(videoData));
			return await finalizeStoredVideo(videoPath);
		} catch (error) {
			return { success: false, error: String(error) };
		}
	});

	ipcMain.handle("get-recorded-video-path", async () => {
		try {
			const recordingsDir = await getRecordingsDir();
			const files = await fs.readdir(recordingsDir);
			const videoFiles = files
				.filter((f) => /\.(webm|mov|mp4)$/i.test(f))
				.sort()
				.reverse();
			if (videoFiles.length === 0) return { success: false };
			return { success: true, path: path.join(recordingsDir, videoFiles[0]) };
		} catch (error) {
			return { success: false, error: String(error) };
		}
	});

	ipcMain.handle("get-cursor-telemetry", async (_, videoPath?: string) => {
		const target = normalizeVideoSourcePath(videoPath ?? state.currentVideoPath);
		if (!target) return { success: true, samples: [] };
		const telemetryPath = getTelemetryPathForVideo(target);
		try {
			const content = await fs.readFile(telemetryPath, "utf-8");
			const parsed = JSON.parse(content);
			const samples = (Array.isArray(parsed) ? parsed : parsed.samples || []).sort(
				(a: any, b: any) => a.timeMs - b.timeMs,
			);
			return { success: true, samples };
		} catch (error) {
			return { success: true, samples: [] };
		}
	});

	ipcMain.handle("set-recording-state", (_, recording: boolean) => {
		if (recording) {
			stopCursorCapture();
			stopInteractionCapture();
			startWindowBoundsCapture();
			void startNativeCursorMonitor();
			state.isCursorCaptureActive = true;
			state.activeCursorSamples = [];
			state.pendingCursorSamples = [];
			state.cursorCaptureStartTimeMs = Date.now();
			state.linuxCursorScreenPoint = null;
			state.lastLeftClick = null;
			sampleCursorPoint();
			state.cursorCaptureInterval = setInterval(sampleCursorPoint, CURSOR_SAMPLE_INTERVAL_MS);
			void startInteractionCapture();
		} else {
			state.isCursorCaptureActive = false;
			stopCursorCapture();
			stopInteractionCapture();
			stopWindowBoundsCapture();
			stopNativeCursorMonitor();
			showCursor();
			state.linuxCursorScreenPoint = null;
			snapshotCursorTelemetryForPersistence();
			state.activeCursorSamples = [];
		}

		const source = state.selectedSource || { name: "Screen" };
		BrowserWindow.getAllWindows().forEach((window) => {
			if (!window.isDestroyed()) {
				window.webContents.send("recording-state-changed", {
					recording,
					sourceName: source.name,
				});
			}
		});

		if (onRecordingStateChange) onRecordingStateChange(recording, source.name);
	});
}
