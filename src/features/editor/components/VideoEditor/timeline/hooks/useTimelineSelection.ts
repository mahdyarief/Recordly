import { useCallback } from "react";

export interface TimelineSelectionProps {
	onSelectZoom: (id: string | null) => void;
	onSelectTrim?: (id: string | null) => void;
	onSelectAnnotation?: (id: string | null) => void;
	onSelectSpeed?: (id: string | null) => void;
	onSelectAudio?: (id: string | null) => void;
	onSelectCaption?: (id: string | null) => void;
	onSelectMaster?: (selected: boolean) => void;
	onTimeSelectionChange?: (s: any | null) => void;
	setSelectAllBlocksActive: (active: boolean) => void;
}

export function useTimelineSelection(props: TimelineSelectionProps) {
	const {
		onSelectZoom,
		onSelectTrim,
		onSelectAnnotation,
		onSelectSpeed,
		onSelectAudio,
		onSelectCaption,
		onSelectMaster,
		onTimeSelectionChange,
		setSelectAllBlocksActive,
	} = props;

	const handleSelectZoom = useCallback(
		(id: string | null) => {
			setSelectAllBlocksActive(false);
			onSelectZoom?.(id);
			if (id) {
				onSelectTrim?.(null);
				onSelectAnnotation?.(null);
				onSelectSpeed?.(null);
				onSelectAudio?.(null);
				onSelectCaption?.(null);
				onTimeSelectionChange?.(null);
				onSelectMaster?.(false);
			}
		},
		[
			onSelectZoom,
			onSelectTrim,
			onSelectAnnotation,
			onSelectSpeed,
			onSelectAudio,
			onSelectCaption,
			onTimeSelectionChange,
			onSelectMaster,
			setSelectAllBlocksActive,
		],
	);

	const handleSelectTrim = useCallback(
		(id: string | null) => {
			setSelectAllBlocksActive(false);
			onSelectTrim?.(id);
			if (id) {
				onSelectZoom?.(null);
				onSelectAnnotation?.(null);
				onSelectSpeed?.(null);
				onSelectAudio?.(null);
				onSelectCaption?.(null);
				onTimeSelectionChange?.(null);
				onSelectMaster?.(false);
			}
		},
		[
			onSelectZoom,
			onSelectTrim,
			onSelectAnnotation,
			onSelectSpeed,
			onSelectAudio,
			onSelectCaption,
			onTimeSelectionChange,
			onSelectMaster,
			setSelectAllBlocksActive,
		],
	);

	const handleSelectAnnotation = useCallback(
		(id: string | null) => {
			setSelectAllBlocksActive(false);
			onSelectAnnotation?.(id);
			if (id) {
				onSelectZoom?.(null);
				onSelectTrim?.(null);
				onSelectSpeed?.(null);
				onSelectAudio?.(null);
				onSelectCaption?.(null);
				onTimeSelectionChange?.(null);
				onSelectMaster?.(false);
			}
		},
		[
			onSelectZoom,
			onSelectTrim,
			onSelectAnnotation,
			onSelectSpeed,
			onSelectAudio,
			onSelectCaption,
			onTimeSelectionChange,
			onSelectMaster,
			setSelectAllBlocksActive,
		],
	);

	const handleSelectSpeed = useCallback(
		(id: string | null) => {
			setSelectAllBlocksActive(false);
			onSelectSpeed?.(id);
			if (id) {
				onSelectZoom?.(null);
				onSelectTrim?.(null);
				onSelectAnnotation?.(null);
				onSelectAudio?.(null);
				onSelectCaption?.(null);
				onTimeSelectionChange?.(null);
				onSelectMaster?.(false);
			}
		},
		[
			onSelectZoom,
			onSelectTrim,
			onSelectAnnotation,
			onSelectSpeed,
			onSelectAudio,
			onSelectCaption,
			onTimeSelectionChange,
			onSelectMaster,
			setSelectAllBlocksActive,
		],
	);

	const handleSelectAudio = useCallback(
		(id: string | null) => {
			setSelectAllBlocksActive(false);
			onSelectAudio?.(id);
			if (id) {
				onSelectZoom?.(null);
				onSelectTrim?.(null);
				onSelectAnnotation?.(null);
				onSelectSpeed?.(null);
				onSelectCaption?.(null);
				onTimeSelectionChange?.(null);
				onSelectMaster?.(false);
			}
		},
		[
			onSelectZoom,
			onSelectTrim,
			onSelectAnnotation,
			onSelectSpeed,
			onSelectAudio,
			onSelectCaption,
			onTimeSelectionChange,
			onSelectMaster,
			setSelectAllBlocksActive,
		],
	);

	const handleSelectCaption = useCallback(
		(id: string | null) => {
			setSelectAllBlocksActive(false);
			onSelectCaption?.(id);
			if (id) {
				onSelectZoom(null);
				onSelectTrim?.(null);
				onSelectAnnotation?.(null);
				onSelectSpeed?.(null);
				onSelectAudio?.(null);
				onTimeSelectionChange?.(null);
				onSelectMaster?.(false);
			}
		},
		[
			onSelectZoom,
			onSelectTrim,
			onSelectAnnotation,
			onSelectSpeed,
			onSelectAudio,
			onSelectCaption,
			onTimeSelectionChange,
			onSelectMaster,
			setSelectAllBlocksActive,
		],
	);

	const handleSelectMaster = useCallback(
		(selected: boolean) => {
			setSelectAllBlocksActive(false);
			onSelectMaster?.(selected);
			if (selected) {
				onSelectZoom(null);
				onSelectTrim?.(null);
				onSelectAnnotation?.(null);
				onSelectSpeed?.(null);
				onSelectAudio?.(null);
				onSelectCaption?.(null);
				onTimeSelectionChange?.(null);
			}
		},
		[
			onSelectZoom,
			onSelectTrim,
			onSelectAnnotation,
			onSelectSpeed,
			onSelectAudio,
			onSelectCaption,
			onTimeSelectionChange,
			onSelectMaster,
			setSelectAllBlocksActive,
		],
	);

	const clearSelectedBlocks = useCallback(() => {
		onSelectZoom(null);
		onSelectTrim?.(null);
		onSelectAnnotation?.(null);
		onSelectSpeed?.(null);
		onSelectAudio?.(null);
		onSelectCaption?.(null);
		onSelectMaster?.(false);
		setSelectAllBlocksActive(false);
	}, [
		onSelectAnnotation,
		onSelectAudio,
		onSelectSpeed,
		onSelectTrim,
		onSelectZoom,
		onSelectCaption,
		onSelectMaster,
		setSelectAllBlocksActive,
	]);

	return {
		handleSelectZoom,
		handleSelectTrim,
		handleSelectAnnotation,
		handleSelectSpeed,
		handleSelectAudio,
		handleSelectCaption,
		handleSelectMaster,
		clearSelectedBlocks,
	};
}
