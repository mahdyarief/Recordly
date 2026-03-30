import { useCallback } from "react";
import { toast } from "sonner";
import { useI18n } from "@/shared/adapters/I18nProvider";
import { useEditorContext } from "../context/EditorContext";

export function useCaptionActions() {
	const { t } = useI18n();
	const {
		state,
		updateState,
		videoPath: videoSourcePath,
		whisperExecutablePath,
		setWhisperExecutablePath,
		whisperModelPath,
		setWhisperModelPath,
		setIsGeneratingCaptions,
		setAutoCaptionProgress,
		setWhisperModelDownloadProgress,
		setWhisperModelDownloadStatus,
	} = useEditorContext();

	const { autoCaptionSettings } = state;

	const handlePickWhisperExecutable = useCallback(async () => {
		try {
			const result = await (window.electronAPI as any).pickWhisperExecutable();
			if (result.success && result.path) {
				setWhisperExecutablePath(result.path);
			}
		} catch (err) {
			console.error("Failed to pick whisper executable:", err);
		}
	}, [setWhisperExecutablePath]);

	const handlePickWhisperModel = useCallback(async () => {
		try {
			const result = await (window.electronAPI as any).pickWhisperModel();
			if (result.success && result.path) {
				setWhisperModelPath(result.path);
			}
		} catch (err) {
			console.error("Failed to pick whisper model:", err);
		}
	}, [setWhisperModelPath]);

	const handleGenerateAutoCaptions = useCallback(async () => {
		if (!videoSourcePath) return;
		setIsGeneratingCaptions(true);
		setAutoCaptionProgress(0);
		try {
			const result = await (window.electronAPI as any).generateAutoCaptions({
				videoPath: videoSourcePath,
				whisperPath: whisperExecutablePath || "",
				modelPath: whisperModelPath || "",
				language: autoCaptionSettings.language,
			});
			if (result.success) {
				updateState({ autoCaptions: result.captions });
				toast.success(t("editor.captionsGenerated", "Captions generated successfully"));
			} else {
				toast.error(
					result.error || t("editor.captionGenerationError", "Failed to generate captions"),
				);
			}
		} catch (err) {
			console.error("Caption generation error:", err);
			toast.error(t("editor.captionGenerationError", "Failed to generate captions"));
		} finally {
			setIsGeneratingCaptions(false);
			setAutoCaptionProgress(null);
		}
	}, [
		videoSourcePath,
		whisperExecutablePath,
		whisperModelPath,
		autoCaptionSettings.language,
		setIsGeneratingCaptions,
		setAutoCaptionProgress,
		updateState,
		t,
	]);

	const handleDownloadWhisperModel = useCallback(async () => {
		const model = autoCaptionSettings.selectedModel;
		if (!model || model === "custom") return;

		setWhisperModelDownloadStatus("downloading");
		setWhisperModelDownloadProgress(0);
		try {
			const result = await (window.electronAPI as any).downloadWhisperModel(model);
			if (result.success) {
				setWhisperModelPath(result.path || null);
				setWhisperModelDownloadStatus("ready");
				toast.success(t("editor.modelDownloaded", "Model downloaded successfully"));
			} else {
				setWhisperModelDownloadStatus("error");
				toast.error(result.error || t("editor.modelDownloadError", "Failed to download model"));
			}
		} catch (err) {
			console.error("Model download error:", err);
			setWhisperModelDownloadStatus("error");
		} finally {
			setWhisperModelDownloadProgress(null);
		}
	}, [
		autoCaptionSettings.selectedModel,
		setWhisperModelDownloadStatus,
		setWhisperModelDownloadProgress,
		setWhisperModelPath,
		t,
	]);

	const handleDeleteWhisperModel = useCallback(async () => {
		setWhisperModelPath(null);
		setWhisperModelDownloadStatus("idle");
	}, [setWhisperModelPath, setWhisperModelDownloadStatus]);

	return {
		handlePickWhisperExecutable,
		handlePickWhisperModel,
		handleGenerateAutoCaptions,
		handleDownloadWhisperModel,
		handleDeleteWhisperModel,
	};
}
