import { useCallback } from "react";
import { useEditorContext } from "../context/EditorContext";

export function useWebcamActions() {
	const { state, updateState } = useEditorContext();

	const { webcam } = state;

	const handleUploadWebcam = useCallback(async () => {
		try {
			const result = await (window.electronAPI as any).pickVideoFile();
			if (result.success && result.path) {
				updateState({ webcam: { ...webcam, sourcePath: result.path, enabled: true } });
			}
		} catch (err) {
			console.error("Failed to pick webcam video:", err);
		}
	}, [webcam, updateState]);

	const handleClearWebcam = useCallback(() => {
		updateState({ webcam: { ...webcam, sourcePath: null, enabled: false } });
	}, [webcam, updateState]);

	return {
		handleUploadWebcam,
		handleClearWebcam,
	};
}
