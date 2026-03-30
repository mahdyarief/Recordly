import { EditorProjectData } from "../entities/ProjectData";

export interface ProjectStoragePort {
	loadProject(filePath: string): Promise<EditorProjectData>;
	saveProject(filePath: string, data: EditorProjectData): Promise<void>;
	pickProjectFile(): Promise<string | null>;
	pickVideoFile(): Promise<string | null>;
}
