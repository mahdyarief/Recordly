import { constants as fsConstants } from "node:fs";
import { RECORDINGS_DIR } from "../../appPaths";
import fs from "node:fs/promises";
import path from "node:path";
import { dialog, ipcMain, shell } from "electron";
import { ProjectLibraryEntry, state } from "../state";
import {
	LEGACY_PROJECT_FILE_EXTENSIONS,
	MAX_RECENT_PROJECTS,
	normalizePath,
	normalizeVideoSourcePath,
	PROJECT_FILE_EXTENSION,
	PROJECT_THUMBNAIL_SUFFIX,
	PROJECTS_DIRECTORY_NAME,
	RECENT_PROJECTS_FILE,
} from "../utils";

async function getRecordingsDir() {
	const targetDir = state.customRecordingsDir ?? RECORDINGS_DIR;
	await fs.mkdir(targetDir, { recursive: true });
	return targetDir;
}

export async function getProjectsDir() {
	const projectsDir = path.join(await getRecordingsDir(), PROJECTS_DIRECTORY_NAME);
	await fs.mkdir(projectsDir, { recursive: true });
	return projectsDir;
}

export function getProjectThumbnailPath(projectPath: string) {
	return `${projectPath}${PROJECT_THUMBNAIL_SUFFIX}`;
}

export async function saveProjectThumbnail(projectPath: string, thumbnailDataUrl?: string | null) {
	const thumbnailPath = getProjectThumbnailPath(projectPath);
	if (!thumbnailDataUrl) {
		await fs.rm(thumbnailPath, { force: true }).catch(() => undefined);
		return null;
	}

	const match = thumbnailDataUrl.match(/^data:image\/png;base64,(.+)$/);
	if (!match) throw new Error("Project thumbnail must be a PNG data URL.");

	await fs.writeFile(thumbnailPath, Buffer.from(match[1], "base64"));
	return thumbnailPath;
}

async function loadRecentProjectPaths() {
	try {
		const content = await fs.readFile(RECENT_PROJECTS_FILE, "utf-8");
		const parsed = JSON.parse(content) as { paths?: unknown };
		return Array.isArray(parsed.paths)
			? parsed.paths.filter((v): v is string => typeof v === "string" && v.trim().length > 0)
			: [];
	} catch {
		return [];
	}
}

async function saveRecentProjectPaths(paths: string[]) {
	const normalizedPaths = Array.from(new Set(paths.map((v) => normalizePath(v)))).slice(
		0,
		MAX_RECENT_PROJECTS,
	);
	await fs.writeFile(
		RECENT_PROJECTS_FILE,
		JSON.stringify({ paths: normalizedPaths }, null, 2),
		"utf-8",
	);
}

function hasProjectFileExtension(filePath: string) {
	const extension = path.extname(filePath).replace(/^\./, "").toLowerCase();
	return [PROJECT_FILE_EXTENSION, ...LEGACY_PROJECT_FILE_EXTENSIONS].includes(extension);
}

export async function rememberRecentProject(projectPath: string) {
	if (!hasProjectFileExtension(projectPath)) return;
	const existingPaths = await loadRecentProjectPaths();
	await saveRecentProjectPaths([projectPath, ...existingPaths]);
}

async function resolveProjectMediaSources(project: unknown) {
	if (!project || typeof project !== "object")
		return { success: false, message: "Invalid project file format" };

	const rawVideoPath = (project as any).videoPath;
	if (typeof rawVideoPath !== "string")
		return { success: false, message: "Project file is missing a video path" };

	const normalizedVideoPath = normalizeVideoSourcePath(rawVideoPath);
	if (!normalizedVideoPath)
		return { success: false, message: "Project file is missing a valid video path" };

	try {
		await fs.access(normalizedVideoPath, fsConstants.F_OK);
	} catch {
		return { success: false, message: `Project video file not found: ${normalizedVideoPath}` };
	}

	const rawWebcamPath = (project as any).editor?.webcam?.sourcePath;
	const normalizedWebcamPath = normalizeVideoSourcePath(rawWebcamPath);

	if (!normalizedWebcamPath)
		return { success: true, videoPath: normalizedVideoPath, webcamPath: null };

	try {
		await fs.access(normalizedWebcamPath, fsConstants.F_OK);
		return { success: true, videoPath: normalizedVideoPath, webcamPath: normalizedWebcamPath };
	} catch {
		return { success: true, videoPath: normalizedVideoPath, webcamPath: null };
	}
}

async function buildProjectLibraryEntry(
	projectPath: string,
	projectsDir: string,
): Promise<ProjectLibraryEntry | null> {
	try {
		const normalizedPath = normalizePath(projectPath);
		if (!hasProjectFileExtension(normalizedPath)) return null;
		const stats = await fs.stat(normalizedPath);
		if (!stats.isFile()) return null;

		const thumbnailPath = getProjectThumbnailPath(normalizedPath);
		const thumbnailExists = await fs
			.access(thumbnailPath, fsConstants.R_OK)
			.then(() => true)
			.catch(() => false);

		return {
			path: normalizedPath,
			name: path.basename(normalizedPath).replace(/\.(recordly|openscreen)$/i, ""),
			updatedAt: stats.mtimeMs,
			thumbnailPath: thumbnailExists ? thumbnailPath : null,
			isCurrent: Boolean(
				state.currentProjectPath && normalizePath(state.currentProjectPath) === normalizedPath,
			),
			isInProjectsDirectory: path.dirname(normalizedPath) === normalizePath(projectsDir),
		};
	} catch {
		return null;
	}
}

async function listProjectLibraryEntries() {
	const projectsDir = await getProjectsDir();
	const projectPaths: string[] = [];
	try {
		const entries = await fs.readdir(projectsDir, { withFileTypes: true });
		for (const entry of entries) {
			if (entry.isFile() && hasProjectFileExtension(entry.name)) {
				projectPaths.push(path.join(projectsDir, entry.name));
			}
		}
	} catch {
		/* ignore */
	}

	const recentProjectPaths = await loadRecentProjectPaths();
	const candidatePaths = Array.from(new Set([...projectPaths, ...recentProjectPaths]));
	const entries = (
		await Promise.all(candidatePaths.map((cp: string) => buildProjectLibraryEntry(cp, projectsDir)))
	)
		.filter((e: ProjectLibraryEntry | null): e is ProjectLibraryEntry => e != null)
		.sort((l: ProjectLibraryEntry, r: ProjectLibraryEntry) => r.updatedAt - l.updatedAt);

	await saveRecentProjectPaths(entries.map((e: ProjectLibraryEntry) => e.path));
	return { projectsDir, entries };
}

async function loadProjectFromPath(projectPath: string) {
	const normalizedPath = normalizePath(projectPath);
	const content = await fs.readFile(normalizedPath, "utf-8");
	const project = JSON.parse(content);
	const mediaSources: any = await resolveProjectMediaSources(project);

	if (!mediaSources.success) {
		return { success: false, canceled: false, message: mediaSources.message };
	}

	state.currentProjectPath = normalizedPath;
	state.currentVideoPath = mediaSources.videoPath;
	state.currentRecordingSession = {
		videoPath: mediaSources.videoPath,
		webcamPath: mediaSources.webcamPath,
		timeOffsetMs: 0,
	};
	await rememberRecentProject(normalizedPath);

	return { success: true, path: normalizedPath, project };
}

function isTrustedProjectPath(filePath?: string | null) {
	if (!filePath || !state.currentProjectPath) return false;
	return normalizePath(filePath) === normalizePath(state.currentProjectPath);
}

export function registerProjectHandlers() {
	ipcMain.handle(
		"save-project-file",
		async (_, projectData, suggestedName?, existingProjectPath?, thumbnailDataUrl?) => {
			try {
				const projectsDir = await getProjectsDir();
				const trustedPath = isTrustedProjectPath(existingProjectPath) ? existingProjectPath : null;

				if (trustedPath) {
					await fs.writeFile(trustedPath, JSON.stringify(projectData, null, 2), "utf-8");
					state.currentProjectPath = trustedPath;
					await saveProjectThumbnail(trustedPath, thumbnailDataUrl);
					await rememberRecentProject(trustedPath);
					return { success: true, path: trustedPath, message: "Project saved successfully" };
				}

				const safeName = (suggestedName || `project-${Date.now()}`).replace(/[^a-zA-Z0-9-_]/g, "_");
				const defaultName = safeName.endsWith(`.${PROJECT_FILE_EXTENSION}`)
					? safeName
					: `${safeName}.${PROJECT_FILE_EXTENSION}`;

				const result = await dialog.showSaveDialog({
					title: "Save Recordly Project",
					defaultPath: path.join(projectsDir, defaultName),
					filters: [
						{ name: "Recordly Project", extensions: [PROJECT_FILE_EXTENSION] },
						{ name: "JSON", extensions: ["json"] },
					],
					properties: ["createDirectory", "showOverwriteConfirmation"],
				});

				if (result.canceled || !result.filePath)
					return { success: false, canceled: true, message: "Save project canceled" };

				await fs.writeFile(result.filePath, JSON.stringify(projectData, null, 2), "utf-8");
				state.currentProjectPath = result.filePath;
				await saveProjectThumbnail(result.filePath, thumbnailDataUrl);
				await rememberRecentProject(result.filePath);

				return { success: true, path: result.filePath, message: "Project saved successfully" };
			} catch (error) {
				console.error("Failed to save project file:", error);
				return { success: false, message: "Failed to save project file", error: String(error) };
			}
		},
	);

	ipcMain.handle("load-project-file", async () => {
		try {
			const projectsDir = await getProjectsDir();
			const result = await dialog.showOpenDialog({
				title: "Open Recordly Project",
				defaultPath: projectsDir,
				filters: [
					{
						name: "Recordly Project",
						extensions: [PROJECT_FILE_EXTENSION, ...LEGACY_PROJECT_FILE_EXTENSIONS],
					},
					{ name: "JSON", extensions: ["json"] },
					{ name: "All Files", extensions: ["*"] },
				],
				properties: ["openFile"],
			});
			if (result.canceled || result.filePaths.length === 0)
				return { success: false, canceled: true, message: "Open project canceled" };
			return await loadProjectFromPath(result.filePaths[0]);
		} catch (error) {
			console.error("Failed to load project file:", error);
			return { success: false, message: "Failed to load project file", error: String(error) };
		}
	});

	ipcMain.handle("load-current-project-file", async () => {
		try {
			if (!state.currentProjectPath) return { success: false, message: "No active project" };
			return await loadProjectFromPath(state.currentProjectPath);
		} catch (error) {
			console.error("Failed to load current project file:", error);
			return {
				success: false,
				message: "Failed to load current project file",
				error: String(error),
			};
		}
	});

	ipcMain.handle("get-projects-directory", async () => {
		try {
			return { success: true, path: await getProjectsDir() };
		} catch (error) {
			return { success: false, error: String(error) };
		}
	});

	ipcMain.handle("list-project-files", async () => {
		try {
			const library = await listProjectLibraryEntries();
			return { success: true, projectsDir: library.projectsDir, entries: library.entries };
		} catch (error) {
			return { success: false, projectsDir: null, entries: [], error: String(error) };
		}
	});

	ipcMain.handle("open-project-file-at-path", async (_, filePath) => {
		try {
			return await loadProjectFromPath(filePath);
		} catch (error) {
			console.error("Failed to open project file at path:", error);
			return { success: false, message: "Failed to open project file", error: String(error) };
		}
	});

	ipcMain.handle("open-projects-directory", async () => {
		try {
			const projectsDir = await getProjectsDir();
			const openPathResult = await shell.openPath(projectsDir);
			if (openPathResult)
				return {
					success: false,
					error: openPathResult,
					message: "Failed to open projects folder.",
				};
			return { success: true, path: projectsDir };
		} catch (error) {
			console.error("Failed to open projects folder:", error);
			return { success: false, error: String(error), message: "Failed to open projects folder." };
		}
	});
}
