import type { Span } from "dnd-timeline";
import { useCallback } from "react";
import { useShortcuts } from "@/shared/adapters/ShortcutsProvider";
import { type TimelineEditorProps } from "../../types";
import { useTimelineActions } from "./useTimelineActions";
import { useTimelineItemMapping } from "./useTimelineItemMapping";
import { useTimelineSelection } from "./useTimelineSelection";
import { useTimelineShortcuts } from "./useTimelineShortcuts";
import { useTimelineState } from "./useTimelineState";

const ZOOM_ROW_ID = "row-zoom";
const TRIM_ROW_ID = "row-trim";
const ANNOTATION_ROW_ID = "row-annotation";
const SPEED_ROW_ID = "row-speed";
const AUDIO_ROW_ID = "row-audio";
const CAPTION_ROW_ID = "row-caption";

export function useTimelineEditor(props: TimelineEditorProps) {
	const {
		zoomRegions,
		onZoomAdded,
		onZoomSuggested,
		onZoomSpanChange,
		onZoomDelete,
		onSelectZoom,
		trimRegions = [],
		onTrimAdded,
		onTrimSpanChange,
		onTrimDelete,
		onSelectTrim,
		annotationRegions = [],
		onAnnotationAdded,
		onAnnotationSpanChange,
		onAnnotationDelete,
		onSelectAnnotation,
		speedRegions = [],
		onSpeedAdded,
		onSpeedSpanChange,
		onSpeedDelete,
		onSelectSpeed,
		audioRegions = [],
		onAudioAdded,
		onAudioSpanChange,
		onAudioDelete,
		onSelectAudio,
		autoCaptions = [],
		onCaptionSpanChange,
		onSelectCaption,
		onClearAutoCaptions,
		onTimeSelectionChange,
		onSelectMaster,
		videoPath,
		masterAudioMuted,
		cursorTelemetry = [],
		disableSuggestedZooms = false,
		timeSelection = null,
		onTimelineModeChange,
		currentTimeMs,
		totalMs,
	} = props;

	const state = useTimelineState(totalMs, currentTimeMs);
	const selection = useTimelineSelection({
		onSelectZoom,
		onSelectTrim,
		onSelectAnnotation,
		onSelectSpeed,
		onSelectAudio,
		onSelectCaption,
		onSelectMaster,
		onTimeSelectionChange,
		setSelectAllBlocksActive: state.setSelectAllBlocksActive,
	});

	const actions = useTimelineActions({
		totalMs,
		currentTimeMs,
		timeSelection,
		zoomRegions,
		trimRegions,
		speedRegions,
		audioRegions,
		annotationRegions,
		autoCaptions,
		onZoomAdded,
		onZoomSuggested,
		onTrimAdded,
		onSpeedAdded,
		onAudioAdded,
		onAnnotationAdded,
		onZoomDelete,
		onTrimDelete,
		onSpeedDelete,
		onAudioDelete,
		onAnnotationDelete,
		onClearAutoCaptions,
		onTimeSelectionChange,
		clearSelectedBlocks: selection.clearSelectedBlocks,
		disableSuggestedZooms,
		cursorTelemetry,
	});

	const { isMac } = useShortcuts();
	useTimelineShortcuts({
		isMac,
		isTimelineFocusedRef: state.isTimelineFocusedRef,
		setSelectedKeyframeId: state.setSelectedKeyframeId,
		setSelectAllBlocksActive: state.setSelectAllBlocksActive,
		handleAddZoom: actions.handleAddZoom,
		handleAddTrim: actions.handleAddTrim,
		handleAddAnnotation: actions.handleAddAnnotation,
		handleAddSpeed: actions.handleAddSpeed,
		onTimelineModeChange,
		annotationRegions,
		currentTimeMs,
		selectedAnnotationId: props.selectedAnnotationId ?? null,
		onSelectAnnotation,
		selectAllBlocksActive: state.selectAllBlocksActive,
		deleteAllBlocks: actions.deleteAllBlocks,
		selectedKeyframeId: state.selectedKeyframeId,
		setKeyframes: state.setKeyframes as any,
		selectedZoomId: props.selectedZoomId ?? null,
		onZoomDelete,
		selectedTrimId: props.selectedTrimId ?? null,
		onTrimDelete,
		selectedSpeedId: props.selectedSpeedId ?? null,
		onSpeedDelete,
		selectedAudioId: props.selectedAudioId ?? null,
		onAudioDelete,
	});

	const timelineItems = useTimelineItemMapping({
		zoomRegions,
		trimRegions,
		annotationRegions,
		speedRegions,
		videoPath,
		totalMs,
		masterAudioMuted,
		audioRegions,
		autoCaptions,
	});

	const handleItemSpanChange = useCallback(
		(id: string, span: Span, rowId: string) => {
			if (rowId === ZOOM_ROW_ID) onZoomSpanChange(id, span);
			else if (rowId === TRIM_ROW_ID) onTrimSpanChange?.(id, span);
			else if (rowId === ANNOTATION_ROW_ID) onAnnotationSpanChange?.(id, span);
			else if (rowId === SPEED_ROW_ID) onSpeedSpanChange?.(id, span);
			else if (rowId === AUDIO_ROW_ID) onAudioSpanChange?.(id, span);
			else if (rowId === CAPTION_ROW_ID) onCaptionSpanChange?.(id, span);
		},
		[
			onZoomSpanChange,
			onTrimSpanChange,
			onAnnotationSpanChange,
			onSpeedSpanChange,
			onAudioSpanChange,
			onCaptionSpanChange,
		],
	);

	const scrollLabels = { pan: "Shift + Ctrl + Scroll", zoom: "Ctrl + Scroll" };

	return {
		...props,
		...state,
		...selection,
		...actions,
		timelineItems,
		handleItemSpanChange,
		scrollLabels,
	};
}
