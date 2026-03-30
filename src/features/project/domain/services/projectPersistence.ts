import { fromFileUrl as fromUrl, toFileUrl as toUrl } from "@/shared/lib/fileUrl";
import { deriveNextId as deriveId } from "@/shared/lib/idUtils";
import {
	ProjectEditorState as EditorState,
	normalizeProjectEditor as normalizeEditor,
	EditorProjectData as ProjectData,
	PROJECT_VERSION as VERSION,
	validateProjectData as validateData,
} from "../entities/index";

export const PROJECT_VERSION = VERSION;

export type ProjectEditorState = EditorState;
export type EditorProjectData = ProjectData;

export const toFileUrl = toUrl;
export const fromFileUrl = fromUrl;
export const deriveNextId = deriveId;
export const validateProjectData = validateData;
export const normalizeProjectEditor = normalizeEditor;

export function createProjectData(
	videoPath: string,
	editor: Partial<ProjectEditorState>,
): EditorProjectData {
	return {
		version: PROJECT_VERSION,
		videoPath,
		editor,
	};
}
