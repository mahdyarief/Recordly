import { useCallback, useMemo, useState } from "react";
import { type CropRegion, type ProjectEditorState } from "../types";

export function useCropWorkflow(
	cropRegion: CropRegion,
	updateState: (updates: Partial<ProjectEditorState>) => void,
) {
	const [showCropModal, setShowCropModal] = useState(false);
	const cropSnapshotRef = useMemo(() => ({ current: null as CropRegion | null }), []);

	const handleOpenCropEditor = useCallback(() => {
		cropSnapshotRef.current = { ...cropRegion };
		setShowCropModal(true);
	}, [cropRegion, cropSnapshotRef]);

	const handleCancelCropEditor = useCallback(() => {
		if (cropSnapshotRef.current) {
			updateState({ cropRegion: cropSnapshotRef.current });
		}
		setShowCropModal(false);
	}, [updateState, cropSnapshotRef]);

	const isCropped = useMemo(() => {
		const top = Math.round(cropRegion.y * 100);
		const left = Math.round(cropRegion.x * 100);
		const bottom = Math.round((1 - cropRegion.y - cropRegion.height) * 100);
		const right = Math.round((1 - cropRegion.x - cropRegion.width) * 100);
		return top > 0 || left > 0 || bottom > 0 || right > 0;
	}, [cropRegion]);

	return {
		showCropModal,
		setShowCropModal,
		handleOpenCropEditor,
		handleCancelCropEditor,
		isCropped,
	};
}
