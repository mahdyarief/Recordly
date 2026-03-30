import { constants as fsConstants } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { BrowserWindow, dialog, ipcMain, SaveDialogOptions, shell, app } from "electron";
import { RECORDINGS_DIR } from "../../appPaths";
import { state } from "../state";
import {
	getTelemetryPathForVideo,
	isAutoRecordingPath,
	normalizeRecordingTimeOffsetMs,
	normalizeVideoSourcePath,
	RECORDING_SESSION_MANIFEST_SUFFIX,
	RECORDINGS_SETTINGS_FILE,
} from "../utils";

async function getRecordingsDir() {
	const targetDir = state.customRecordingsDir ?? RECORDINGS_DIR;
	await fs.mkdir(targetDir, { recursive: true });
	return targetDir;
}

async function persistRecordingsDirectorySetting(nextDir: string) {
	state.customRecordingsDir = path.resolve(nextDir);
	state.recordingsDirLoaded = true;
	await fs.writeFile(
		RECORDINGS_SETTINGS_FILE,
		JSON.stringify({ recordingsDir: state.customRecordingsDir }, null, 2),
		"utf-8",
	);
}

function getRecordingSessionManifestPath(videoPath: string) {
	const extension = path.extname(videoPath);
	const baseName = path.basename(videoPath, extension);
	return path.join(path.dirname(videoPath), `${baseName}${RECORDING_SESSION_MANIFEST_SUFFIX}`);
}

async function persistRecordingSessionManifest(session: {
	videoPath: string;
	webcamPath?: string | null;
	timeOffsetMs?: number;
}) {
	const normalizedVideoPath = normalizeVideoSourcePath(session.videoPath);
	if (!normalizedVideoPath) return;

	const normalizedWebcamPath = normalizeVideoSourcePath(session.webcamPath ?? null);
	const manifestPath = getRecordingSessionManifestPath(normalizedVideoPath);

	if (!normalizedWebcamPath) {
		await fs.rm(manifestPath, { force: true }).catch(() => {});
		return;
	}

	const manifest = {
		version: 2,
		videoFileName: path.basename(normalizedVideoPath),
		webcamFileName: path.basename(normalizedWebcamPath),
		timeOffsetMs: normalizeRecordingTimeOffsetMs(session.timeOffsetMs),
	};

	try {
		await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
	} catch (error) {
		console.warn(
			`[persistRecordingSessionManifest] Could not write manifest to ${manifestPath} (likely read-only directory):`,
			error,
		);
	}
}

async function resolveRecordingSessionManifest(videoPath?: string | null) {
	const normalizedVideoPath = normalizeVideoSourcePath(videoPath);
	if (!normalizedVideoPath) return null;

	const manifestPath = getRecordingSessionManifestPath(normalizedVideoPath);

	try {
		const content = await fs.readFile(manifestPath, "utf-8");
		const parsed = JSON.parse(content);
		if (parsed.version !== 1 && parsed.version !== 2) return null;

		const webcamFileName =
			typeof parsed.webcamFileName === "string" && parsed.webcamFileName.trim()
				? parsed.webcamFileName.trim()
				: null;

		if (!webcamFileName) {
			return { videoPath: normalizedVideoPath, webcamPath: null, timeOffsetMs: 0 };
		}

		const webcamPath = path.join(path.dirname(normalizedVideoPath), webcamFileName);
		await fs.access(webcamPath, fsConstants.F_OK);

		return {
			videoPath: normalizedVideoPath,
			webcamPath,
			timeOffsetMs: normalizeRecordingTimeOffsetMs(parsed.timeOffsetMs),
		};
	} catch {
		return null;
	}
}

async function resolveLinkedWebcamPath(videoPath?: string | null) {
	const normalizedVideoPath = normalizeVideoSourcePath(videoPath);
	if (!normalizedVideoPath) return null;

	const extension = path.extname(normalizedVideoPath);
	const baseName = path.basename(normalizedVideoPath, extension);
	if (!baseName || baseName.endsWith("-webcam")) return null;

	const candidateExtensions = Array.from(
		new Set([extension, ".webm", ".mp4", ".mov", ".mkv", ".avi"].filter(Boolean)),
	);

	for (const candidateExtension of candidateExtensions) {
		const candidatePath = path.join(
			path.dirname(normalizedVideoPath),
			`${baseName}-webcam${candidateExtension}`,
		);
		try {
			await fs.access(candidatePath, fsConstants.F_OK);
			return candidatePath;
		} catch {
			continue;
		}
	}
	return null;
}

async function resolveRecordingSession(videoPath?: string | null) {
	const manifestSession = await resolveRecordingSessionManifest(videoPath);
	if (manifestSession) return manifestSession;

	const normalizedVideoPath = normalizeVideoSourcePath(videoPath);
	if (!normalizedVideoPath) return null;

	const linkedWebcamPath = await resolveLinkedWebcamPath(normalizedVideoPath);
	return { videoPath: normalizedVideoPath, webcamPath: linkedWebcamPath, timeOffsetMs: 0 };
}

export function registerMediaHandlers() {
	ipcMain.handle("save-exported-video", async (event, videoData: ArrayBuffer, fileName: string) => {
		try {
			const isGif = fileName.toLowerCase().endsWith(".gif");
			const filters = isGif
				? [{ name: "GIF Image", extensions: ["gif"] }]
				: [{ name: "Video Files", extensions: ["mp4", "webm"] }];
			const parentWindow = BrowserWindow.fromWebContents(event.sender);
			const saveDialogOptions: SaveDialogOptions = {
				title: isGif ? "Save Exported GIF" : "Save Exported Video",
				defaultPath: path.join(app.getPath("downloads"), fileName),
				filters,
				properties: ["createDirectory", "showOverwriteConfirmation"],
			};

			const result = parentWindow
				? await dialog.showSaveDialog(parentWindow, saveDialogOptions)
				: await dialog.showSaveDialog(saveDialogOptions);

			if (result.canceled || !result.filePath)
				return { success: false, canceled: true, message: "Export canceled" };

			await fs.writeFile(result.filePath, Buffer.from(videoData));

			return { success: true, path: result.filePath, message: "Video exported successfully" };
		} catch (error) {
			console.error("Failed to save exported video:", error);
			return { success: false, message: "Failed to save exported video", error: String(error) };
		}
	});

	ipcMain.handle("open-video-file-picker", async () => {
		try {
			const recordingsDir = await getRecordingsDir();
			const result = await dialog.showOpenDialog({
				title: "Select Video File",
				defaultPath: recordingsDir,
				filters: [
					{ name: "Common Video Files", extensions: ["mp4", "webm"] },
					{ name: "Other Video Files", extensions: ["mov", "avi", "mkv"] },
					{ name: "All Files", extensions: ["*"] },
				],
				properties: ["openFile"],
			});

			if (result.canceled || result.filePaths.length === 0)
				return { success: false, canceled: true };

			state.currentProjectPath = null;
			return { success: true, path: result.filePaths[0] };
		} catch (error) {
			console.error("Failed to open file picker:", error);
			return { success: false, message: "Failed to open file picker", error: String(error) };
		}
	});

	ipcMain.handle("open-audio-file-picker", async () => {
		try {
			const result = await dialog.showOpenDialog({
				title: "Select Audio File",
				filters: [
					{ name: "Audio Files", extensions: ["mp3", "wav", "aac", "m4a", "flac", "ogg"] },
					{ name: "All Files", extensions: ["*"] },
				],
				properties: ["openFile"],
			});

			if (result.canceled || result.filePaths.length === 0)
				return { success: false, canceled: true };

			return { success: true, path: result.filePaths[0] };
		} catch (error) {
			console.error("Failed to open audio file picker:", error);
			return { success: false, message: "Failed to open audio file picker", error: String(error) };
		}
	});

	ipcMain.handle("set-current-video-path", async (_, pathStr: string) => {
		try {
			state.currentVideoPath = normalizeVideoSourcePath(pathStr) ?? pathStr;
			const resolvedSession = (await resolveRecordingSession(state.currentVideoPath)) ?? {
				videoPath: state.currentVideoPath,
				webcamPath: null,
				timeOffsetMs: 0,
			};

			state.currentRecordingSession = resolvedSession;

			if (resolvedSession.webcamPath) {
				await persistRecordingSessionManifest(resolvedSession);
			}

			state.currentProjectPath = null;
			return { success: true, webcamPath: resolvedSession.webcamPath ?? null };
		} catch (error) {
			console.error("[set-current-video-path] Error:", error);
			return { success: false, message: "Failed to set current video path", error: String(error) };
		}
	});

	ipcMain.handle(
		"set-current-recording-session",
		async (
			_,
			session: { videoPath: string; webcamPath?: string | null; timeOffsetMs?: number },
		) => {
			const normalizedVideoPath = normalizeVideoSourcePath(session.videoPath) ?? session.videoPath;
			state.currentVideoPath = normalizedVideoPath;
			state.currentRecordingSession = {
				videoPath: normalizedVideoPath,
				webcamPath: normalizeVideoSourcePath(session.webcamPath ?? null),
				timeOffsetMs: normalizeRecordingTimeOffsetMs(session.timeOffsetMs),
			};
			state.currentProjectPath = null;
			await persistRecordingSessionManifest(state.currentRecordingSession);
			return { success: true };
		},
	);

	ipcMain.handle("get-current-recording-session", () => {
		if (!state.currentRecordingSession) return { success: false };
		return { success: true, session: state.currentRecordingSession };
	});

	ipcMain.handle("get-current-video-path", () => {
		return state.currentVideoPath
			? { success: true, path: state.currentVideoPath }
			: { success: false };
	});

	ipcMain.handle("clear-current-video-path", () => {
		state.currentVideoPath = null;
		state.currentRecordingSession = null;
		return { success: true };
	});

	ipcMain.handle("delete-recording-file", async (_, filePath: string) => {
		try {
			if (!filePath || !isAutoRecordingPath(filePath)) {
				return { success: false, error: "Only auto-generated recordings can be deleted" };
			}
			await fs.unlink(filePath);
			const telemetryPath = getTelemetryPathForVideo(filePath);
			await fs.unlink(telemetryPath).catch(() => {});
			if (state.currentVideoPath === filePath) {
				state.currentVideoPath = null;
				state.currentRecordingSession = null;
			}
			return { success: true };
		} catch (error) {
			return { success: false, error: String(error) };
		}
	});

	ipcMain.handle("reveal-in-folder", async (_, filePath: string) => {
		try {
			shell.showItemInFolder(filePath);
			return { success: true };
		} catch (error) {
			try {
				const openPathResult = await shell.openPath(path.dirname(filePath));
				if (openPathResult) return { success: false, error: openPathResult };
				return { success: true, message: "Could not reveal item, but opened directory." };
			} catch (openError) {
				return { success: false, error: String(error) };
			}
		}
	});

	ipcMain.handle("open-recordings-folder", async () => {
		try {
			const recordingsDir = await getRecordingsDir();
			const openPathResult = await shell.openPath(recordingsDir);
			if (openPathResult)
				return {
					success: false,
					error: openPathResult,
					message: "Failed to open recordings folder.",
				};
			return { success: true };
		} catch (error) {
			console.error("Failed to open recordings folder:", error);
			return { success: false, error: String(error), message: "Failed to open recordings folder." };
		}
	});

	ipcMain.handle("get-recordings-directory", async () => {
		try {
			const recordingsDir = await getRecordingsDir();
			return { success: true, path: recordingsDir, isDefault: recordingsDir === RECORDINGS_DIR };
		} catch (error) {
			return { success: false, path: RECORDINGS_DIR, isDefault: true, error: String(error) };
		}
	});

	ipcMain.handle("choose-recordings-directory", async () => {
		try {
			const current = await getRecordingsDir();
			const result = await dialog.showOpenDialog({
				title: "Choose recordings folder",
				defaultPath: current,
				properties: ["openDirectory", "createDirectory", "promptToCreate"],
			});

			if (result.canceled || result.filePaths.length === 0)
				return { success: false, canceled: true, path: current };

			const selectedPath = path.resolve(result.filePaths[0]);
			await fs.mkdir(selectedPath, { recursive: true });
			await fs.access(selectedPath, fsConstants.W_OK);
			await persistRecordingsDirectorySetting(selectedPath);

			return { success: true, path: selectedPath, isDefault: selectedPath === RECORDINGS_DIR };
		} catch (error) {
			return { success: false, error: String(error), message: "Failed to set recordings folder" };
		}
	});
}
