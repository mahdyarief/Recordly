import { useCallback } from "react";
import { toast } from "sonner";
import {
	type ExportFormat,
	type ExportProgress,
	type ExportQuality,
	type ExportSettings,
	type GifFrameRate,
	type GifSizePreset,
	type PendingExportSave,
} from "@/features/exporter";
import { calculateGifOutputDimensions } from "../../../lib/exportUtils";
import { type VideoPlaybackRef } from "../types";

interface ExportWorkflowProps {
	videoSourcePath: string | null;
	videoPlaybackRef: React.RefObject<VideoPlaybackRef>;
	gifSizePreset: GifSizePreset;
	exportFormat: ExportFormat;
	exportQuality: ExportQuality;
	gifFrameRate: GifFrameRate;
	gifLoop: boolean;
	exportedFilePath?: string;
	setShowExportDropdown: (show: boolean) => void;
	setExportProgress: (p: ExportProgress | null) => void;
	setExportError: (e: string | null) => void;
	setExportedFilePath: (p: string | undefined) => void;
	handleExport: (settings: ExportSettings) => void;
	clearPendingExportSave: () => void;
	pendingExportSaveRef: React.MutableRefObject<PendingExportSave | null>;
}

export function useExportWorkflow(props: ExportWorkflowProps) {
	const {
		videoSourcePath,
		videoPlaybackRef,
		gifSizePreset,
		exportFormat,
		exportQuality,
		gifFrameRate,
		gifLoop,
		exportedFilePath,
		setShowExportDropdown,
		setExportProgress,
		setExportError,
		setExportedFilePath,
		handleExport,
		clearPendingExportSave,
		pendingExportSaveRef,
	} = props;

	const handleOpenExportDropdown = useCallback(() => {
		if (!videoSourcePath) {
			toast.error("No video loaded");
			return;
		}
		setShowExportDropdown(true);
		setExportProgress(null);
		setExportError(null);
	}, [videoSourcePath, setShowExportDropdown, setExportProgress, setExportError]);

	const showExportSuccessToast = useCallback((filePath: string) => {
		toast.success(`Exported successfully to ${filePath}`, {
			action: {
				label: "Show in Folder",
				onClick: async () => {
					try {
						const result = await window.electronAPI.revealInFolder(filePath);
						if (!result.success) toast.error(result.message || "Failed to reveal");
					} catch (err) {
						toast.error(`Error: ${err}`);
					}
				},
			},
		});
	}, []);

	const handleStartExportFromDropdown = useCallback(() => {
		const video = videoPlaybackRef.current?.video;
		if (!videoSourcePath || !video) return;

		const dims = calculateGifOutputDimensions(
			video.videoWidth || 1920,
			video.videoHeight || 1080,
			gifSizePreset,
		);
		const settings: ExportSettings = {
			format: exportFormat,
			quality: exportFormat === "mp4" ? exportQuality : undefined,
			gifConfig:
				exportFormat === "gif"
					? {
							frameRate: gifFrameRate,
							loop: gifLoop,
							sizePreset: gifSizePreset,
							width: dims.width,
							height: dims.height,
						}
					: undefined,
		};

		setExportError(null);
		setExportedFilePath(undefined);
		setShowExportDropdown(true);
		handleExport(settings);
	}, [
		videoSourcePath,
		exportFormat,
		exportQuality,
		gifFrameRate,
		gifLoop,
		gifSizePreset,
		handleExport,
		videoPlaybackRef,
		setExportError,
		setExportedFilePath,
		setShowExportDropdown,
	]);

	const handleCancelExport = useCallback(() => {
		setExportedFilePath(undefined);
	}, [setExportedFilePath]);

	const handleExportDropdownClose = useCallback(() => {
		clearPendingExportSave();
		setShowExportDropdown(false);
		setExportProgress(null);
		setExportError(null);
		setExportedFilePath(undefined);
	}, [
		clearPendingExportSave,
		setShowExportDropdown,
		setExportProgress,
		setExportError,
		setExportedFilePath,
	]);

	const handleRetrySaveExport = useCallback(async () => {
		const pendingSave = pendingExportSaveRef.current;
		if (!pendingSave) return;
		const result = await window.electronAPI.saveExportedVideo(
			pendingSave.arrayBuffer,
			pendingSave.fileName,
		);
		if (result.canceled) {
			setExportError("Canceled. Click Save Again.");
			return;
		}
		if (result.success && result.path) {
			clearPendingExportSave();
			setExportError(null);
			setExportedFilePath(result.path);
			showExportSuccessToast(result.path);
			setShowExportDropdown(true);
			return;
		}
		toast.error(result.message || "Failed to save");
	}, [
		clearPendingExportSave,
		setExportError,
		setExportedFilePath,
		showExportSuccessToast,
		setShowExportDropdown,
		pendingExportSaveRef,
	]);

	const revealExportedFile = useCallback(async () => {
		if (!exportedFilePath) return;
		try {
			const result = await window.electronAPI.revealInFolder(exportedFilePath);
			if (!result.success) toast.error(result.message);
		} catch (err) {
			toast.error(`Error: ${err}`);
		}
	}, [exportedFilePath]);

	const openRecordingsFolder = useCallback(async () => {
		try {
			const result = await (window.electronAPI as any).openRecordingsFolder();
			if (!result.success) toast.error(result.message);
		} catch (err) {
			toast.error(`Error: ${err}`);
		}
	}, []);

	return {
		handleOpenExportDropdown,
		handleStartExportFromDropdown,
		handleCancelExport,
		handleExportDropdownClose,
		handleRetrySaveExport,
		revealExportedFile,
		openRecordingsFolder,
	};
}
