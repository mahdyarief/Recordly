import { EditorProjectData, validateProjectData } from "../domain/entities/ProjectData";
import { ProjectStoragePort } from "../domain/ports/ProjectStoragePort";

export class ElectronProjectStorageAdapter implements ProjectStoragePort {
	async loadProject(filePath: string): Promise<EditorProjectData> {
		const result = await window.electronAPI.readLocalFile(filePath);
		if (!result.success || !result.data) {
			throw new Error(result.error || `Failed to read file: ${filePath}`);
		}
		const decoded = new TextDecoder().decode(result.data);
		const parsed = JSON.parse(decoded);
		if (!validateProjectData(parsed)) {
			throw new Error("Invalid project file format");
		}
		return parsed;
	}

	async saveProject(filePath: string, data: EditorProjectData): Promise<void> {
		await window.electronAPI.saveProjectFile(data, undefined, filePath);
	}

	async pickProjectFile(): Promise<string | null> {
		const result = await window.electronAPI.loadProjectFile();
		return result.success && result.path ? result.path : null;
	}

	async pickVideoFile(): Promise<string | null> {
		const result = await window.electronAPI.openVideoFilePicker();
		return result.success && result.path ? result.path : null;
	}
}
