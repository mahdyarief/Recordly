import { execFile } from "node:child_process";
import { existsSync, constants as fsConstants } from "node:fs";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { app, BrowserWindow, desktopCapturer } from "electron";
import { RECORDINGS_DIR, USER_DATA_PATH } from "../appPaths";
import { state } from "./state";

const execFileAsync = promisify(execFile);
const nodeRequire = createRequire(import.meta.url);

export const PROJECT_FILE_EXTENSION = "recordly";
export const LEGACY_PROJECT_FILE_EXTENSIONS = ["openscreen"];
export const PROJECTS_DIRECTORY_NAME = "Projects";
export const PROJECT_THUMBNAIL_SUFFIX = ".preview.png";
export const RECENT_PROJECTS_FILE = path.join(USER_DATA_PATH, "recent-projects.json");
export const MAX_RECENT_PROJECTS = 16;
export const SHORTCUTS_FILE = path.join(USER_DATA_PATH, "shortcuts.json");
export const RECORDINGS_SETTINGS_FILE = path.join(USER_DATA_PATH, "recordings-settings.json");
export const COUNTDOWN_SETTINGS_FILE = path.join(USER_DATA_PATH, "countdown-settings.json");
export const AUTO_RECORDING_PREFIX = "recording-";
export const AUTO_RECORDING_RETENTION_COUNT = 20;
export const AUTO_RECORDING_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;
export const ALLOW_RECORDLY_WINDOW_CAPTURE = Boolean(process.env["VITE_DEV_SERVER_URL"]);
export const RECORDING_SESSION_MANIFEST_SUFFIX = ".recordly-session.json";
export const WHISPER_MODEL_DIR = path.join(USER_DATA_PATH, "whisper");

export function getAssetRootPath() {
	if (app.isPackaged) {
		return path.join(process.resourcesPath, "assets");
	}
	return path.join(app.getAppPath(), "public");
}

export function getScreen() {
	if (!app.isReady()) {
		throw new Error(
			"getScreen() called before app is ready. Ensure all screen access happens after app.whenReady().",
		);
	}
	return nodeRequire("electron").screen as typeof import("electron").screen;
}

export function normalizeRecordingTimeOffsetMs(value: unknown): number {
	return typeof value === "number" && Number.isFinite(value) ? Math.round(value) : 0;
}

export function normalizePath(filePath: string) {
	return path.resolve(filePath);
}

export function normalizeDesktopSourceName(value: string) {
	return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function hasUsableSourceThumbnail(
	thumbnail:
		| {
				isEmpty: () => boolean;
				getSize: () => { width: number; height: number };
		  }
		| null
		| undefined,
) {
	if (!thumbnail || thumbnail.isEmpty()) {
		return false;
	}
	const size = thumbnail.getSize();
	return size.width > 1 && size.height > 1;
}

export function getMacPrivacySettingsUrl(pane: "screen" | "accessibility" | "microphone") {
	if (pane === "screen")
		return "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture";
	if (pane === "microphone")
		return "x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone";
	return "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility";
}

export function isAutoRecordingPath(filePath: string) {
	return path.basename(filePath).startsWith(AUTO_RECORDING_PREFIX);
}

export function getTelemetryPathForVideo(videoPath: string) {
	return `${videoPath}.cursor.json`;
}

export function normalizeVideoSourcePath(videoPath?: string | null): string | null {
	if (typeof videoPath !== "string") {
		return null;
	}

	const trimmed = videoPath.trim();
	if (!trimmed) {
		return null;
	}

	if (/^file:\/\//i.test(trimmed)) {
		try {
			return fileURLToPath(trimmed);
		} catch {
			// Fall through and keep best-effort string path below.
		}
	}

	return trimmed;
}

export function getNativeArchTag() {
	if (process.platform === "darwin") {
		return process.arch === "arm64" ? "darwin-arm64" : "darwin-x64";
	}

	if (process.platform === "win32") {
		return process.arch === "arm64" ? "win32-arm64" : "win32-x64";
	}

	if (process.platform === "linux") {
		return process.arch === "arm64" ? "linux-arm64" : "linux-x64";
	}

	return `${process.platform}-${process.arch}`;
}

export function resolveUnpackedAppPath(...segments: string[]) {
	const base = app.getAppPath();
	const resolved = path.join(base, ...segments);
	if (app.isPackaged) {
		return resolved.replace(/\.asar([/\\])/, ".asar.unpacked$1");
	}
	return resolved;
}

export function getPrebundledNativeHelperPath(binaryName: string) {
	return resolveUnpackedAppPath("electron", "native", "bin", getNativeArchTag(), binaryName);
}

export function resolvePreferredWindowsNativeHelperPath(
	helperDirectory: string,
	binaryName: string,
) {
	const buildOutputPath = resolveUnpackedAppPath(
		"electron",
		"native",
		helperDirectory,
		"build",
		"Release",
		binaryName,
	);
	const prebundledPath = getPrebundledNativeHelperPath(binaryName);

	if (existsSync(buildOutputPath)) {
		return buildOutputPath;
	}

	if (existsSync(prebundledPath)) {
		return prebundledPath;
	}

	return buildOutputPath;
}

export function loadFfmpegStatic() {
	const moduleExports = nodeRequire("ffmpeg-static");
	if (typeof moduleExports === "string") {
		return moduleExports;
	}

	if (typeof moduleExports?.default === "string") {
		return moduleExports.default as string;
	}

	return null;
}

export function getFfmpegBinaryPath() {
	const ffmpegStatic = loadFfmpegStatic();
	if (!ffmpegStatic || typeof ffmpegStatic !== "string") {
		throw new Error("FFmpeg binary is unavailable. Install ffmpeg-static for this platform.");
	}

	if (app.isPackaged) {
		return ffmpegStatic.replace(/\.asar([/\\])/, ".asar.unpacked$1");
	}

	return ffmpegStatic;
}

export function safeSend(
	webContents: Electron.WebContents | undefined,
	channel: string,
	...args: any[]
) {
	if (webContents && !webContents.isDestroyed()) {
		webContents.send(channel, ...args);
	}
}

export async function moveFileWithOverwrite(src: string, dest: string) {
	try {
		await fs.rename(src, dest);
	} catch (error) {
		const nodeError = error as NodeJS.ErrnoException;
		// cross-device move fallback
		if (nodeError.code === "EXDEV") {
			await fs.copyFile(src, dest);
			await fs.unlink(src);
		} else {
			throw error;
		}
	}
}

export async function loadRecordingsDirectorySetting() {
	if (state.recordingsDirLoaded) {
		return;
	}

	state.recordingsDirLoaded = true;

	try {
		const content = await fs.readFile(RECORDINGS_SETTINGS_FILE, "utf-8");
		const parsed = JSON.parse(content) as { recordingsDir?: unknown };
		if (typeof parsed.recordingsDir === "string" && parsed.recordingsDir.trim()) {
			state.customRecordingsDir = path.resolve(parsed.recordingsDir);
		}
	} catch {
		state.customRecordingsDir = null;
	}
}

export async function getRecordingsDir() {
	await loadRecordingsDirectorySetting();
	const targetDir = state.customRecordingsDir ?? RECORDINGS_DIR;
	await fs.mkdir(targetDir, { recursive: true });
	return targetDir;
}

export async function ensureReadableFile(filePath: string, description: string) {
	await fs.access(filePath, fsConstants.R_OK);
	if (description === "whisper executable") {
		try {
			await fs.access(filePath, fsConstants.X_OK);
		} catch {
			throw new Error("The selected Whisper executable is not marked as executable.");
		}
	}
}

export async function isExecutableFile(filePath: string) {
	try {
		await fs.access(filePath, fsConstants.R_OK | fsConstants.X_OK);
		return true;
	} catch {
		return false;
	}
}

export function getBundledWhisperExecutableCandidates() {
	const binaryNames =
		process.platform === "win32"
			? ["whisper-cli.exe", "whisper-cpp.exe", "whisper.exe", "main.exe"]
			: ["whisper-cli", "whisper-cpp", "whisper", "main"];

	return binaryNames.map((binaryName) => getPrebundledNativeHelperPath(binaryName));
}

export async function resolveWhisperExecutablePath(preferredPath?: string | null) {
	const { spawnSync } = await import("node:child_process");
	const candidatePaths = [
		preferredPath?.trim() || null,
		...getBundledWhisperExecutableCandidates(),
		process.env["WHISPER_CPP_PATH"]?.trim() || null,
		process.platform === "darwin" ? "/opt/homebrew/bin/whisper-cli" : null,
		process.platform === "darwin" ? "/usr/local/bin/whisper-cli" : null,
		process.platform === "darwin" ? "/opt/homebrew/bin/whisper-cpp" : null,
		process.platform === "darwin" ? "/usr/local/bin/whisper-cpp" : null,
	].filter((value): value is string => Boolean(value));

	for (const candidate of candidatePaths) {
		const normalized = path.resolve(candidate);
		if (await isExecutableFile(normalized)) {
			return normalized;
		}
	}

	const pathCommand = process.platform === "win32" ? "where" : "which";
	const binaryNames =
		process.platform === "win32"
			? ["whisper-cli.exe", "whisper.exe", "main.exe"]
			: ["whisper-cli", "whisper-cpp", "whisper", "main"];

	for (const binaryName of binaryNames) {
		const result = spawnSync(pathCommand, [binaryName], { encoding: "utf-8" });
		if (result.status === 0) {
			const resolvedPath = result.stdout
				.split(/\r?\n/)
				.map((line) => line.trim())
				.find(Boolean);

			if (resolvedPath && (await isExecutableFile(resolvedPath))) {
				return resolvedPath;
			}
		}
	}

	throw new Error(
		"No Whisper runtime was found. Recordly looked for a bundled binary first, then checked common system install locations.",
	);
}

export function loadUiohookModule() {
	try {
		// uiohook-napi may be in an asar.unpacked directory in production
		return nodeRequire("uiohook-napi");
	} catch (error) {
		console.warn("Failed to load uiohook-napi:", error);
		return null;
	}
}

export function hasProjectFileExtension(filePath: string) {
	const extension = path.extname(filePath).replace(/^\./, "").toLowerCase();
	return [PROJECT_FILE_EXTENSION, ...LEGACY_PROJECT_FILE_EXTENSIONS].includes(extension);
}

export async function hasSiblingProjectFile(videoPath: string) {
	const baseName = path.basename(videoPath, path.extname(videoPath));
	const candidateExtensions = [PROJECT_FILE_EXTENSION, ...LEGACY_PROJECT_FILE_EXTENSIONS];

	for (const extension of candidateExtensions) {
		const projectPath = path.join(path.dirname(videoPath), `${baseName}.${extension}`);
		try {
			await fs.access(projectPath);
			return true;
		} catch {
			continue;
		}
	}
	return false;
}

export async function pruneAutoRecordings(exemptPaths: string[] = []) {
	const recordingsDir = await getRecordingsDir();
	const exempt = new Set(
		[state.currentVideoPath, ...exemptPaths]
			.filter((value): value is string => Boolean(value))
			.map((value) => normalizePath(value)),
	);

	const entries = await fs.readdir(recordingsDir, { withFileTypes: true });
	const autoRecordingStats = await Promise.all(
		entries
			.filter((entry) => entry.isFile() && /^recording-.*\.(mp4|mov|webm)$/i.test(entry.name))
			.map(async (entry) => {
				const filePath = path.join(recordingsDir, entry.name);
				const stats = await fs.stat(filePath);
				return { filePath, stats };
			}),
	);

	const sorted = autoRecordingStats.sort((left, right) => right.stats.mtimeMs - left.stats.mtimeMs);
	const now = Date.now();

	for (const [index, entry] of sorted.entries()) {
		const normalizedFilePath = normalizePath(entry.filePath);
		if (exempt.has(normalizedFilePath)) {
			continue;
		}

		if (await hasSiblingProjectFile(entry.filePath)) {
			continue;
		}

		const tooOld = now - entry.stats.mtimeMs > AUTO_RECORDING_MAX_AGE_MS;
		const overLimit = index >= AUTO_RECORDING_RETENTION_COUNT;
		if (!tooOld && !overLimit) {
			continue;
		}

		try {
			await fs.rm(entry.filePath, { force: true });
			await fs.rm(getTelemetryPathForVideo(entry.filePath), { force: true });
		} catch (error) {
			console.warn("Failed to prune old auto recording:", entry.filePath, error);
		}
	}
}

export async function getFileSizeIfPresent(filePath?: string | null) {
	if (!filePath) {
		return null;
	}

	try {
		const stat = await fs.stat(filePath);
		return stat.size;
	} catch {
		return null;
	}
}

export function parseFfmpegDurationSeconds(stderr: string) {
	const match = stderr.match(/Duration:\s+(\d+):(\d+):(\d+(?:\.\d+)?)/i);
	if (!match) {
		return null;
	}

	const hours = Number(match[1]);
	const minutes = Number(match[2]);
	const seconds = Number(match[3]);
	if (![hours, minutes, seconds].every(Number.isFinite)) {
		return null;
	}

	return hours * 3600 + minutes * 60 + seconds;
}

export async function validateRecordedVideo(videoPath: string) {
	const stat = await fs.stat(videoPath);
	if (!stat.isFile()) {
		throw new Error(`Recorded output is not a file: ${videoPath}`);
	}

	if (stat.size <= 0) {
		throw new Error(`Recorded output is empty: ${videoPath}`);
	}

	const ffmpegPath = getFfmpegBinaryPath();
	let stderr = "";

	try {
		const result = await execFileAsync(
			ffmpegPath,
			["-hide_banner", "-i", videoPath, "-map", "0:v:0", "-frames:v", "1", "-f", "null", "-"],
			{ timeout: 20000, maxBuffer: 10 * 1024 * 1024 },
		);
		stderr = result.stderr;
	} catch (error) {
		const execError = error as NodeJS.ErrnoException & { stderr?: string };
		const output = execError.stderr?.trim();
		throw new Error(output || `Recorded output could not be decoded: ${videoPath}`);
	}

	if (!/Stream #.*Video:/i.test(stderr)) {
		throw new Error(`Recorded output does not contain a readable video stream: ${videoPath}`);
	}

	const durationSeconds = parseFfmpegDurationSeconds(stderr);
	if (durationSeconds !== null && durationSeconds <= 0) {
		throw new Error(`Recorded output has an invalid duration: ${videoPath}`);
	}

	return {
		fileSizeBytes: stat.size,
		durationSeconds,
	};
}
