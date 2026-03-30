import { useCallback } from "react";
import { toast } from "sonner";
import {
	createProjectData,
	type EditorProjectData,
	normalizeProjectEditor,
	type ProjectEditorState,
	validateProjectData,
} from "@/features/project/domain/services/projectPersistence";
import { useI18n } from "@/shared/adapters/I18nProvider";
import { useEditorContext } from "../context/EditorContext";

export function useProjectActions() {
	const {
		state,
		updateState,
		videoSourcePath,
		setLoading,
		currentProjectPath,
		setCurrentProjectPath,
		setHasUnsavedChanges,
	} = useEditorContext();

	const { t } = useI18n();

	const buildPersistedEditorState = useCallback(
		(overrides?: Partial<ProjectEditorState>): EditorProjectData => {
			return createProjectData(videoSourcePath || "", { ...state, ...overrides });
		},
		[state, videoSourcePath],
	);

	const applyLoadedProject = useCallback(
		async (candidate: unknown, path?: string | null) => {
			try {
				if (!validateProjectData(candidate)) {
					throw new Error("Invalid project data format");
				}

				const normalized = normalizeProjectEditor(candidate.editor);
				updateState(normalized);

				if (path) {
					setCurrentProjectPath(path);
				}

				setHasUnsavedChanges(false);
				toast.success(t("editor.projectLoaded", "Project loaded successfully"));
				return true;
			} catch (err) {
				console.error("Failed to apply project data:", err);
				toast.error(t("editor.projectLoadError", "Failed to load project"));
				return false;
			}
		},
		[t, updateState, setCurrentProjectPath, setHasUnsavedChanges],
	);

	const saveProject = useCallback(
		async (forceSaveAs = false): Promise<boolean> => {
			if (!videoSourcePath) {
				return false;
			}

			const stateToSave = buildPersistedEditorState();
			const result = await window.electronAPI.saveProjectFile(
				stateToSave,
				undefined,
				forceSaveAs ? undefined : (currentProjectPath ?? undefined),
			);

			if (result.success) {
				if (result.path) {
					setCurrentProjectPath(result.path);
				}
				setHasUnsavedChanges(false);
				toast.success(t("editor.projectSaved", "Project saved successfully"));
				return true;
			} else {
				if (!result.canceled) {
					toast.error(result.error || t("editor.projectSaveError", "Failed to save project"));
				}
				return false;
			}
		},
		[
			videoSourcePath,
			currentProjectPath,
			buildPersistedEditorState,
			t,
			setCurrentProjectPath,
			setHasUnsavedChanges,
		],
	);

	const handleOpenProjectFromLibrary = useCallback(
		async (projectPath: string) => {
			setLoading(true);
			try {
				const result = await (window.electronAPI as any).loadProjectFile(projectPath);
				if (result.success && result.project) {
					await applyLoadedProject(result.project, projectPath);
				} else {
					toast.error(result.error || t("editor.projectLoadError", "Failed to load project"));
				}
			} catch (err) {
				console.error("Project load error:", err);
				toast.error(t("editor.projectLoadError", "Failed to load project"));
			} finally {
				setLoading(false);
			}
		},
		[applyLoadedProject, setLoading, t],
	);

	return {
		saveProject,
		handleOpenProjectFromLibrary,
		applyLoadedProject,
		buildPersistedEditorState,
	};
}
