import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { app, ipcMain, shell, systemPreferences } from "electron";
import { hideCursor } from "../../cursorHider";
import { getMacPrivacySettingsUrl, SHORTCUTS_FILE } from "../utils";

function getAssetRootPath() {
	if (app.isPackaged) {
		return path.join(process.resourcesPath, "assets");
	}
	return path.join(app.getAppPath(), "public");
}

export function registerSettingsHandlers() {
	ipcMain.handle("get-asset-base-path", () => {
		try {
			const assetPath = getAssetRootPath();
			return pathToFileURL(`${assetPath}${path.sep}`).toString();
		} catch (err) {
			console.error("Failed to resolve asset base path:", err);
			return null;
		}
	});

	ipcMain.handle("list-asset-directory", async (_, relativeDir: string) => {
		try {
			const normalizedRelativeDir = String(relativeDir ?? "")
				.replace(/\\/g, "/")
				.replace(/^\/+/, "");

			const assetRootPath = path.resolve(getAssetRootPath());
			const targetDirPath = path.resolve(assetRootPath, normalizedRelativeDir);
			if (
				targetDirPath !== assetRootPath &&
				!targetDirPath.startsWith(`${assetRootPath}${path.sep}`)
			) {
				return { success: false, error: "Invalid asset directory" };
			}

			const entries = await fs.readdir(targetDirPath, { withFileTypes: true });
			const files = entries
				.filter((entry) => entry.isFile())
				.map((entry) => entry.name)
				.sort(new Intl.Collator(undefined, { numeric: true, sensitivity: "base" }).compare);

			return { success: true, files };
		} catch (error) {
			console.error("Failed to list asset directory:", error);
			return { success: false, error: String(error) };
		}
	});

	ipcMain.handle("read-local-file", async (_, filePath: string) => {
		try {
			const data = await fs.readFile(filePath);
			return { success: true, data };
		} catch (error) {
			console.error("Failed to read local file:", error);
			return { success: false, error: String(error) };
		}
	});

	ipcMain.handle("get-shortcuts", async () => {
		try {
			const data = await fs.readFile(SHORTCUTS_FILE, "utf-8");
			return JSON.parse(data);
		} catch {
			return null;
		}
	});

	ipcMain.handle("save-shortcuts", async (_, shortcuts: unknown) => {
		try {
			await fs.writeFile(SHORTCUTS_FILE, JSON.stringify(shortcuts, null, 2), "utf-8");
			return { success: true };
		} catch (error) {
			console.error("Failed to save shortcuts:", error);
			return { success: false, error: String(error) };
		}
	});

	ipcMain.handle("get-platform", () => {
		return process.platform;
	});

	ipcMain.handle("app:getVersion", () => {
		return app.getVersion();
	});

	ipcMain.handle("hide-cursor", () => {
		if (process.platform !== "win32") {
			return { success: true };
		}
		return { success: hideCursor() };
	});

	ipcMain.handle("open-external-url", async (_, url: string) => {
		try {
			await shell.openExternal(url);
			return { success: true };
		} catch (error) {
			console.error("Failed to open URL:", error);
			return { success: false, error: String(error) };
		}
	});

	ipcMain.handle("get-accessibility-permission-status", () => {
		if (process.platform !== "darwin") {
			return { success: true, trusted: true, prompted: false };
		}
		return {
			success: true,
			trusted: systemPreferences.isTrustedAccessibilityClient(false),
			prompted: false,
		};
	});

	ipcMain.handle("request-accessibility-permission", () => {
		if (process.platform !== "darwin") {
			return { success: true, trusted: true, prompted: false };
		}
		return {
			success: true,
			trusted: systemPreferences.isTrustedAccessibilityClient(true),
			prompted: true,
		};
	});

	ipcMain.handle("get-screen-recording-permission-status", () => {
		if (process.platform !== "darwin") {
			return { success: true, status: "granted" };
		}
		try {
			return {
				success: true,
				status: systemPreferences.getMediaAccessStatus("screen"),
			};
		} catch (error) {
			console.error("Failed to get screen recording permission status:", error);
			return { success: false, status: "unknown", error: String(error) };
		}
	});

	ipcMain.handle("open-screen-recording-preferences", async () => {
		if (process.platform !== "darwin") return { success: true };
		try {
			await shell.openExternal(getMacPrivacySettingsUrl("screen"));
			return { success: true };
		} catch (error) {
			console.error("Failed to open Screen Recording preferences:", error);
			return { success: false, error: String(error) };
		}
	});

	ipcMain.handle("open-accessibility-preferences", async () => {
		if (process.platform !== "darwin") return { success: true };
		try {
			await shell.openExternal(getMacPrivacySettingsUrl("accessibility"));
			return { success: true };
		} catch (error) {
			console.error("Failed to open Accessibility preferences:", error);
			return { success: false, error: String(error) };
		}
	});
}
