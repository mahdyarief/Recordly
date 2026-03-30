import { execFile, spawn, spawnSync } from "node:child_process";
import { existsSync, constants as fsConstants } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { app } from "electron";
import { NativeCaptureDiagnostics, SelectedSource, state, WindowBounds } from "./state";
import {
	getPrebundledNativeHelperPath,
	normalizeDesktopSourceName,
	resolvePreferredWindowsNativeHelperPath,
	resolveUnpackedAppPath,
} from "./utils";

const execFileAsync = promisify(execFile);

export function getNativeCaptureHelperSourcePath() {
	return resolveUnpackedAppPath("electron", "native", "ScreenCaptureKitRecorder.swift");
}

export function getNativeCaptureHelperBinaryPath() {
	return path.join(app.getPath("userData"), "native-tools", "openscreen-screencapturekit-helper");
}

export function getSystemCursorHelperSourcePath() {
	return resolveUnpackedAppPath("electron", "native", "SystemCursorAssets.swift");
}

export function getSystemCursorHelperBinaryPath() {
	return path.join(app.getPath("userData"), "native-tools", "openscreen-system-cursors");
}

export function getNativeCursorMonitorSourcePath() {
	return resolveUnpackedAppPath("electron", "native", "NativeCursorMonitor.swift");
}

export function getNativeCursorMonitorBinaryPath() {
	return path.join(app.getPath("userData"), "native-tools", "openscreen-native-cursor-monitor");
}

export function getNativeWindowListSourcePath() {
	return resolveUnpackedAppPath("electron", "native", "ScreenCaptureKitWindowList.swift");
}

export function getNativeWindowListBinaryPath() {
	return path.join(app.getPath("userData"), "native-tools", "openscreen-window-list");
}

export type NativeMacWindowSource = {
	id: string;
	name: string;
	display_id?: string;
	appName?: string;
	windowTitle?: string;
	bundleId?: string;
	appIcon?: string | null;
	x?: number;
	y?: number;
	width?: number;
	height?: number;
};

let cachedNativeMacWindowSources: NativeMacWindowSource[] | null = null;
let cachedNativeMacWindowSourcesAtMs = 0;

export async function ensureSwiftHelperBinary(
	sourcePath: string,
	binaryPath: string,
	label: string,
	prebundledBinaryName?: string,
) {
	if (prebundledBinaryName) {
		const prebundledPath = getPrebundledNativeHelperPath(prebundledBinaryName);
		try {
			await fs.access(prebundledPath, fsConstants.X_OK);
			return prebundledPath;
		} catch {
			if (app.isPackaged) {
				throw new Error(
					`${label} is missing from this app build (${prebundledPath}). Reinstall or update the app.`,
				);
			}
		}
	}

	const helperDir = path.dirname(binaryPath);
	await fs.mkdir(helperDir, { recursive: true });

	let shouldCompile = false;
	try {
		const [sourceStat, binaryStat] = await Promise.all([
			fs.stat(sourcePath),
			fs.stat(binaryPath).catch(() => null),
		]);
		shouldCompile = !binaryStat || sourceStat.mtimeMs > binaryStat.mtimeMs;
	} catch (error) {
		throw new Error(`${label} source is unavailable: ${String(error)}`);
	}

	if (!shouldCompile) {
		return binaryPath;
	}

	const result = spawnSync("swiftc", ["-O", sourcePath, "-o", binaryPath], {
		encoding: "utf8",
		timeout: 120000,
	});

	if (result.status !== 0) {
		const details = [result.stderr, result.stdout].filter(Boolean).join("\n").trim();
		throw new Error(details || `Failed to compile ${label}`);
	}

	return binaryPath;
}

export async function ensureNativeWindowListBinary() {
	return ensureSwiftHelperBinary(
		getNativeWindowListSourcePath(),
		getNativeWindowListBinaryPath(),
		"native ScreenCaptureKit window list helper",
		"openscreen-window-list",
	);
}

export async function getNativeMacWindowSources(options?: { maxAgeMs?: number }) {
	if (process.platform !== "darwin") {
		return [] as NativeMacWindowSource[];
	}

	const maxAgeMs = options?.maxAgeMs ?? 5000;
	const now = Date.now();
	if (cachedNativeMacWindowSources && now - cachedNativeMacWindowSourcesAtMs < maxAgeMs) {
		return cachedNativeMacWindowSources;
	}

	const binaryPath = await ensureNativeWindowListBinary();
	const { stdout } = await execFileAsync(binaryPath as string, [], {
		timeout: 30000,
		maxBuffer: 10 * 1024 * 1024,
	});

	const parsed = JSON.parse(stdout);
	if (!Array.isArray(parsed)) {
		return [] as NativeMacWindowSource[];
	}

	const entries = parsed.filter((entry: unknown): entry is NativeMacWindowSource => {
		if (!entry || typeof entry !== "object") return false;
		const candidate = entry as Partial<NativeMacWindowSource>;
		return typeof candidate.id === "string" && typeof candidate.name === "string";
	});

	cachedNativeMacWindowSources = entries;
	cachedNativeMacWindowSourcesAtMs = now;
	return entries;
}

export function parseWindowId(sourceId?: string) {
	if (!sourceId) return null;
	const match = sourceId.match(/^window:(\d+)/);
	return match ? Number.parseInt(match[1], 10) : null;
}

export function getWindowsCaptureExePath() {
	return resolvePreferredWindowsNativeHelperPath("wgc-capture", "wgc-capture.exe");
}

export function getCursorMonitorExePath() {
	return resolvePreferredWindowsNativeHelperPath("cursor-monitor", "cursor-monitor.exe");
}

export function recordNativeCaptureDiagnostics(
	diagnostics: Omit<NativeCaptureDiagnostics, "timestamp">,
) {
	state.lastNativeCaptureDiagnostics = {
		timestamp: new Date().toISOString(),
		...diagnostics,
	};
	return state.lastNativeCaptureDiagnostics;
}

export async function resolveLinuxWindowBounds(
	source: SelectedSource,
): Promise<WindowBounds | null> {
	const windowId = parseWindowId(source?.id);

	if (windowId) {
		try {
			const { stdout } = await execFileAsync("xwininfo", ["-id", String(windowId)], {
				timeout: 1500,
			});
			const absX = stdout.match(/Absolute upper-left X:\s+(-?\d+)/);
			const absY = stdout.match(/Absolute upper-left Y:\s+(-?\d+)/);
			const width = stdout.match(/Width:\s+(\d+)/);
			const height = stdout.match(/Height:\s+(\d+)/);
			if (absX && absY && width && height) {
				return {
					x: Number.parseInt(absX[1], 10),
					y: Number.parseInt(absY[1], 10),
					width: Number.parseInt(width[1], 10),
					height: Number.parseInt(height[1], 10),
				};
			}
		} catch {
			/* ignore */
		}
	}

	const windowTitle =
		typeof source.windowTitle === "string" ? source.windowTitle.trim() : source.name.trim();
	if (!windowTitle) return null;

	try {
		const { stdout } = await execFileAsync("xwininfo", ["-name", windowTitle], { timeout: 1500 });
		const absX = stdout.match(/Absolute upper-left X:\s+(-?\d+)/);
		const absY = stdout.match(/Absolute upper-left Y:\s+(-?\d+)/);
		const width = stdout.match(/Width:\s+(\d+)/);
		const height = stdout.match(/Height:\s+(\d+)/);
		if (absX && absY && width && height) {
			return {
				x: Number.parseInt(absX[1], 10),
				y: Number.parseInt(absY[1], 10),
				width: Number.parseInt(width[1], 10),
				height: Number.parseInt(height[1], 10),
			};
		}
	} catch {
		/* ignore */
	}
	return null;
}

export function getWindowBoundsFromNativeSource(
	source?: NativeMacWindowSource | null,
): WindowBounds | null {
	if (!source) return null;
	const { x, y, width, height } = source;
	if (
		typeof x !== "number" ||
		!Number.isFinite(x) ||
		typeof y !== "number" ||
		!Number.isFinite(y) ||
		typeof width !== "number" ||
		!Number.isFinite(width) ||
		typeof height !== "number" ||
		!Number.isFinite(height) ||
		width <= 0 ||
		height <= 0
	)
		return null;
	return { x, y, width, height };
}

export async function resolveMacWindowBounds(source: SelectedSource): Promise<WindowBounds | null> {
	const windowId = parseWindowId(source.id);
	if (!windowId) return null;
	try {
		const nativeSources = await getNativeMacWindowSources({ maxAgeMs: 250 });
		const matchedSource = nativeSources.find((entry) => parseWindowId(entry.id) === windowId);
		return getWindowBoundsFromNativeSource(matchedSource);
	} catch {
		return null;
	}
}
