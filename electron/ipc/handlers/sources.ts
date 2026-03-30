import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { app, BrowserWindow, desktopCapturer, ipcMain } from "electron";
import {
	getNativeMacWindowSources,
	parseWindowId,
	resolveLinuxWindowBounds,
	resolveMacWindowBounds,
} from "../helpers";
import { SelectedSource, state } from "../state";
import {
	ALLOW_RECORDLY_WINDOW_CAPTURE,
	getScreen,
	hasUsableSourceThumbnail,
	normalizeDesktopSourceName,
} from "../utils";
import { resolveWindowsCaptureDisplay } from "../windowsCaptureSelection";

const execFileAsync = promisify(execFile);

/** Returns the currently selected source ID for setDisplayMediaRequestHandler */
export function getSelectedSourceId(): string | null {
	return (state.selectedSource?.id as string | null) ?? null;
}

function getDisplayBoundsForSource(source: SelectedSource) {
	return resolveWindowsCaptureDisplay(
		source,
		getScreen().getAllDisplays(),
		getScreen().getPrimaryDisplay(),
	).bounds;
}

export function registerSourceHandlers(
	getSourceSelectorWindow: () => BrowserWindow | null,
	createSourceSelectorWindow: () => BrowserWindow,
	createEditorWindow: () => void,
	stopWindowBoundsCapture: () => void,
) {
	ipcMain.handle("get-sources", async (_, opts) => {
		const includeScreens = Array.isArray(opts?.types) ? opts.types.includes("screen") : true;
		const includeWindows = Array.isArray(opts?.types) ? opts.types.includes("window") : true;
		const electronTypes = [
			...(includeScreens ? ["screen" as const] : []),
			...(includeWindows ? ["window" as const] : []),
		];
		const electronSources =
			electronTypes.length > 0
				? await desktopCapturer.getSources({
						...opts,
						types: electronTypes,
					})
				: [];
		const ownWindowNames = new Set(
			[
				app.getName(),
				"Recordly",
				...BrowserWindow.getAllWindows().flatMap((win) => {
					const title = win.getTitle().trim();
					return title ? [title] : [];
				}),
			]
				.map((name) => normalizeDesktopSourceName(name))
				.filter(Boolean),
		);
		const ownAppName = normalizeDesktopSourceName(app.getName());

		const displays = includeScreens
			? [...getScreen().getAllDisplays()].sort(
					(left, right) =>
						left.bounds.x - right.bounds.x || left.bounds.y - right.bounds.y || left.id - right.id,
				)
			: [];
		const primaryDisplayId = includeScreens ? String(getScreen().getPrimaryDisplay().id) : "";
		const electronScreenSourcesByDisplayId = new Map(
			electronSources
				.filter((source) => source.id.startsWith("screen:"))
				.map((source) => [String(source.display_id ?? ""), source] as const),
		);

		const screenSources = displays.map((display, index) => {
			const displayId = String(display.id);
			const matchedSource = electronScreenSourcesByDisplayId.get(displayId);
			const displayName =
				displayId === primaryDisplayId ? `Screen ${index + 1} (Primary)` : `Screen ${index + 1}`;

			return {
				id: matchedSource?.id ?? `screen:fallback:${displayId}`,
				name: displayName,
				originalName: matchedSource?.name ?? displayName,
				display_id: displayId,
				thumbnail: matchedSource?.thumbnail ? matchedSource.thumbnail.toDataURL() : null,
				appIcon: matchedSource?.appIcon ? matchedSource.appIcon.toDataURL() : null,
				sourceType: "screen" as const,
			};
		});

		if (process.platform !== "darwin" || !includeWindows) {
			const windowSources = electronSources
				.filter((source) => source.id.startsWith("window:"))
				.filter((source) => hasUsableSourceThumbnail(source.thumbnail))
				.filter((source) => {
					const normalizedName = normalizeDesktopSourceName(source.name);
					if (!normalizedName) return true;
					if (ALLOW_RECORDLY_WINDOW_CAPTURE && normalizedName.includes("recordly")) return true;
					for (const ownName of ownWindowNames) {
						if (ownName && normalizedName === ownName) return false;
					}
					return true;
				})
				.map((source) => ({
					id: source.id,
					name: source.name,
					originalName: source.name,
					display_id: source.display_id,
					thumbnail: source.thumbnail ? source.thumbnail.toDataURL() : null,
					appIcon: source.appIcon ? source.appIcon.toDataURL() : null,
					sourceType: "window" as const,
				}));

			return [...screenSources, ...windowSources];
		}

		try {
			const nativeWindowSources = await getNativeMacWindowSources();
			const electronWindowSourceMap = new Map(
				electronSources
					.filter((source) => source.id.startsWith("window:"))
					.map((source) => [source.id, source] as const),
			);

			const mergedWindowSources = nativeWindowSources
				.filter((source) => {
					const normalizedWindowName = normalizeDesktopSourceName(
						source.windowTitle ?? source.name,
					);
					const normalizedAppName = normalizeDesktopSourceName(source.appName ?? "");

					if (!ALLOW_RECORDLY_WINDOW_CAPTURE && normalizedAppName === ownAppName) return false;
					if (
						ALLOW_RECORDLY_WINDOW_CAPTURE &&
						(normalizedAppName === "recordly" || normalizedWindowName?.includes("recordly"))
					)
						return true;
					if (!normalizedWindowName) return true;

					for (const ownName of ownWindowNames) {
						if (ownName && normalizedWindowName === ownName) return false;
					}
					return true;
				})
				.map((source) => {
					const electronWindowSource = electronWindowSourceMap.get(source.id);
					return {
						id: source.id,
						name: source.name,
						originalName: source.name,
						display_id: source.display_id ?? electronWindowSource?.display_id ?? "",
						thumbnail: electronWindowSource?.thumbnail
							? electronWindowSource.thumbnail.toDataURL()
							: null,
						appIcon:
							source.appIcon ??
							(electronWindowSource?.appIcon ? electronWindowSource.appIcon.toDataURL() : null),
						appName: source.appName,
						windowTitle: source.windowTitle,
						sourceType: "window" as const,
					};
				})
				.filter((source) => Boolean(source.thumbnail));

			return [...screenSources, ...mergedWindowSources];
		} catch {
			return screenSources;
		}
	});

	ipcMain.handle("select-source", (_, source: SelectedSource) => {
		state.selectedSource = source;
		state.broadcastSelectedSourceChange();
		stopWindowBoundsCapture();
		const sourceSelectorWin = getSourceSelectorWindow();
		if (sourceSelectorWin) {
			sourceSelectorWin.close();
		}
		return state.selectedSource;
	});

	ipcMain.handle("show-source-highlight", async (_, source: SelectedSource) => {
		try {
			const isWindow = source.id?.startsWith("window:");
			const windowId = isWindow ? parseWindowId(source.id) : null;
			let asBounds: { x: number; y: number; width: number; height: number } | null = null;

			if (isWindow && process.platform === "darwin") {
				const appName = source.appName || source.name?.split(" — ")[0]?.trim();
				if (appName) {
					try {
						const { stdout } = await execFileAsync(
							"osascript",
							[
								"-e",
								`tell application "${appName}"\n  activate\nend tell\ndelay 0.3\ntell application "System Events"\n  tell process "${appName}"\n    set frontWindow to front window\n    set {x1, y1} to position of frontWindow\n    set {w1, h1} to size of frontWindow\n    return (x1 as text) & "," & (y1 as text) & "," & (w1 as text) & "," & (h1 as text)\n  end tell\nend tell`,
							],
							{ timeout: 4000 },
						);
						const parts = stdout.trim().split(",").map(Number);
						if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
							asBounds = { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
						}
					} catch {
						try {
							await execFileAsync(
								"osascript",
								["-e", `tell application "${appName}" to activate`],
								{ timeout: 2000 },
							);
							await new Promise((resolve) => setTimeout(resolve, 350));
						} catch {
							/* ignore */
						}
					}
				}
			} else if (windowId && process.platform === "linux") {
				try {
					await execFileAsync("wmctrl", ["-i", "-a", `0x${windowId.toString(16)}`], {
						timeout: 1500,
					});
				} catch {
					try {
						await execFileAsync("xdotool", ["windowactivate", String(windowId)], { timeout: 1500 });
					} catch {
						/* ignore */
					}
				}
				await new Promise((resolve) => setTimeout(resolve, 250));
			}

			let bounds = asBounds;
			if (!bounds) {
				if (source.id?.startsWith("screen:")) {
					bounds = getDisplayBoundsForSource(source);
				} else if (isWindow) {
					if (process.platform === "darwin") bounds = await resolveMacWindowBounds(source);
					else if (process.platform === "linux") bounds = await resolveLinuxWindowBounds(source);
				}
			}

			if (!bounds || bounds.width <= 0 || bounds.height <= 0) {
				bounds = getDisplayBoundsForSource(source ?? { name: "Unknown" });
			}

			const pad = 6;
			const highlightWin = new BrowserWindow({
				x: (bounds?.x ?? 0) - pad,
				y: (bounds?.y ?? 0) - pad,
				width: (bounds?.width ?? 0) + pad * 2,
				height: (bounds?.height ?? 0) + pad * 2,
				frame: false,
				transparent: true,
				alwaysOnTop: true,
				skipTaskbar: true,
				hasShadow: false,
				resizable: false,
				focusable: false,
				webPreferences: { nodeIntegration: false, contextIsolation: true },
			});
			highlightWin.setIgnoreMouseEvents(true);

			const html = `<!DOCTYPE html><html><head><style>
                *{margin:0;padding:0;box-sizing:border-box}
                body{background:transparent;overflow:hidden;width:100vw;height:100vh}
                .border-wrap{position:fixed;inset:0;border-radius:10px;padding:3px;background:conic-gradient(from var(--angle,0deg),transparent 0%,transparent 60%,rgba(99,96,245,.15) 70%,rgba(99,96,245,.9) 80%,rgba(123,120,255,1) 85%,rgba(99,96,245,.9) 90%,rgba(99,96,245,.15) 95%,transparent 100%);-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;animation:spin 1.2s linear forwards, fadeAll 1.6s ease-out forwards;}
                .glow-wrap{position:fixed;inset:-4px;border-radius:14px;padding:6px;background:conic-gradient(from var(--angle,0deg),transparent 0%,transparent 65%,rgba(99,96,245,.3) 78%,rgba(123,120,255,.5) 85%,rgba(99,96,245,.3) 92%,transparent 100%);-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;filter:blur(8px);animation:spin 1.2s linear forwards, fadeAll 1.6s ease-out forwards;}
                @property --angle{syntax:'<angle>';initial-value:0deg;inherits:false;}
                @keyframes spin{0%{--angle:0deg}100%{--angle:360deg}}
                @keyframes fadeAll{0%,60%{opacity:1}100%{opacity:0}}
                </style></head><body><div class="glow-wrap"></div><div class="border-wrap"></div></body></html>`;

			await highlightWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
			setTimeout(() => {
				if (!highlightWin.isDestroyed()) highlightWin.close();
			}, 1700);
			return { success: true };
		} catch (error) {
			console.error("Failed to show source highlight:", error);
			return { success: false };
		}
	});

	ipcMain.handle("get-selected-source", () => {
		return state.selectedSource;
	});

	ipcMain.handle("open-source-selector", () => {
		const sourceSelectorWin = getSourceSelectorWindow();
		if (sourceSelectorWin) {
			sourceSelectorWin.focus();
			return;
		}
		createSourceSelectorWindow();
	});

	ipcMain.handle("switch-to-editor", () => {
		createEditorWindow();
	});
}
