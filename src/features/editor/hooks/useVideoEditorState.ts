import { useCallback, useMemo, useState } from "react";
import {
	normalizeProjectEditor,
	type ProjectEditorState,
} from "@/features/project/domain/entities/ProjectState";
import { loadEditorPreferences } from "@/features/project/domain/services/editorPreferences";

export function useVideoEditorState() {
	const initialEditorPreferences = useMemo(() => loadEditorPreferences(), []);

	const [state, setState] = useState<ProjectEditorState>(() =>
		normalizeProjectEditor(initialEditorPreferences),
	);

	const updateState = useCallback(
		(
			update:
				| Partial<ProjectEditorState>
				| ((prev: ProjectEditorState) => Partial<ProjectEditorState>),
		) => {
			setState((prev) => {
				const nextUpdate = typeof update === "function" ? update(prev) : update;
				return { ...prev, ...nextUpdate };
			});
		},
		[],
	);

	// Special case for complex arrays to avoid accidental overwrites
	const updateZoomRegions = useCallback(
		(zoomRegions: ProjectEditorState["zoomRegions"]) => {
			updateState({ zoomRegions });
		},
		[updateState],
	);

	const updateTrimRegions = useCallback(
		(trimRegions: ProjectEditorState["trimRegions"]) => {
			updateState({ trimRegions });
		},
		[updateState],
	);

	const updateAnnotationRegions = useCallback(
		(annotationRegions: ProjectEditorState["annotationRegions"]) => {
			updateState({ annotationRegions });
		},
		[updateState],
	);

	const updateAudioRegions = useCallback(
		(audioRegions: ProjectEditorState["audioRegions"]) => {
			updateState({ audioRegions });
		},
		[updateState],
	);

	const updateAutoCaptions = useCallback(
		(autoCaptions: ProjectEditorState["autoCaptions"]) => {
			updateState({ autoCaptions });
		},
		[updateState],
	);

	return {
		state,
		updateState,
		updateZoomRegions,
		updateTrimRegions,
		updateAnnotationRegions,
		updateAudioRegions,
		updateAutoCaptions,
		initialEditorPreferences,
	};
}
