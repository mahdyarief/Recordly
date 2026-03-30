import { type RefObject, useEffect } from "react";
import { useShortcuts } from "@/shared/adapters/ShortcutsProvider";
import { matchesShortcut } from "@/shared/lib/shortcuts";
import type { AnnotationRegion } from "../../types";

interface TimelineShortcutsProps {
	isMac: boolean;
	isTimelineFocusedRef: RefObject<boolean>;
	setSelectedKeyframeId: (id: string | null) => void;
	setSelectAllBlocksActive: (active: boolean) => void;
	handleAddZoom: () => void;
	handleAddTrim: () => void;
	handleAddAnnotation: () => void;
	handleAddSpeed: () => void;
	onTimelineModeChange?: (m: any) => void;
	annotationRegions: AnnotationRegion[];
	currentTimeMs: number;
	onSelectAnnotation?: (id: string | null) => void;
	selectAllBlocksActive: boolean;
	deleteAllBlocks: () => void;
	selectedKeyframeId: string | null;
	setKeyframes: (fn: (p: any[]) => any[]) => void;
	selectedZoomId: string | null;
	onZoomDelete: (id: string) => void;
	selectedTrimId?: string | null;
	onTrimDelete?: (id: string) => void;
	selectedAnnotationId: string | null;
	onAnnotationDelete?: (id: string) => void;
	selectedSpeedId?: string | null;
	onSpeedDelete?: (id: string) => void;
	selectedAudioId?: string | null;
	onAudioDelete?: (id: string) => void;
}

export function useTimelineShortcuts(props: TimelineShortcutsProps) {
	const {
		isMac,
		isTimelineFocusedRef,
		setSelectedKeyframeId,
		setSelectAllBlocksActive,
		handleAddZoom,
		handleAddTrim,
		handleAddAnnotation,
		handleAddSpeed,
		onTimelineModeChange,
		annotationRegions,
		currentTimeMs,
		onSelectAnnotation,
		selectAllBlocksActive,
		deleteAllBlocks,
		selectedKeyframeId,
		setKeyframes,
		selectedZoomId,
		onZoomDelete,
		selectedTrimId,
		onTrimDelete,
		selectedAnnotationId,
		onAnnotationDelete,
		selectedSpeedId,
		onSpeedDelete,
		selectedAudioId,
		onAudioDelete,
	} = props;

	const { shortcuts: keyShortcuts } = useShortcuts();

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
			if (matchesShortcut(e, { key: "a", ctrl: true }, isMac)) {
				if (!isTimelineFocusedRef.current) return;
				e.preventDefault();
				setSelectedKeyframeId(null);
				setSelectAllBlocksActive(true);
				return;
			}
			if (matchesShortcut(e, keyShortcuts.addZoom, isMac)) handleAddZoom();
			if (matchesShortcut(e, keyShortcuts.addTrim, isMac)) handleAddTrim();
			if (matchesShortcut(e, keyShortcuts.addAnnotation, isMac)) handleAddAnnotation();
			if (matchesShortcut(e, keyShortcuts.addSpeed, isMac)) handleAddSpeed();
			if (e.key.toLowerCase() === "v" && !e.ctrlKey) onTimelineModeChange?.("move");
			if (e.key.toLowerCase() === "e" && !e.ctrlKey) onTimelineModeChange?.("select");
			if (e.key === "Tab" && annotationRegions.length > 0) {
				const overlapping = annotationRegions
					.filter((a) => currentTimeMs >= a.startMs && currentTimeMs <= a.endMs)
					.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
				if (overlapping.length > 0) {
					e.preventDefault();
					const idx = overlapping.findIndex((a) => a.id === selectedAnnotationId);
					const next = e.shiftKey
						? (idx - 1 + overlapping.length) % overlapping.length
						: (idx + 1) % overlapping.length;
					onSelectAnnotation?.(overlapping[next].id);
				}
			}
			if (
				e.key === "Delete" ||
				e.key === "Backspace" ||
				matchesShortcut(e, keyShortcuts.deleteSelected, isMac)
			) {
				if (selectAllBlocksActive) {
					e.preventDefault();
					deleteAllBlocks();
				} else if (selectedKeyframeId) {
					setKeyframes((p) => p.filter((k) => k.id !== selectedKeyframeId));
					setSelectedKeyframeId(null);
				} else if (selectedZoomId) onZoomDelete(selectedZoomId);
				else if (selectedTrimId) onTrimDelete?.(selectedTrimId);
				else if (selectedAnnotationId) onAnnotationDelete?.(selectedAnnotationId);
				else if (selectedSpeedId) onSpeedDelete?.(selectedSpeedId);
				else if (selectedAudioId) onAudioDelete?.(selectedAudioId);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [
		isMac,
		keyShortcuts,
		isTimelineFocusedRef,
		setSelectedKeyframeId,
		setSelectAllBlocksActive,
		handleAddZoom,
		handleAddTrim,
		handleAddAnnotation,
		handleAddSpeed,
		onTimelineModeChange,
		annotationRegions,
		currentTimeMs,
		selectedAnnotationId,
		onSelectAnnotation,
		selectAllBlocksActive,
		deleteAllBlocks,
		selectedKeyframeId,
		setKeyframes,
		selectedZoomId,
		onZoomDelete,
		selectedTrimId,
		onTrimDelete,
		selectedAnnotationId,
		onAnnotationDelete,
		selectedSpeedId,
		onSpeedDelete,
		selectedAudioId,
		onAudioDelete,
	]);
}
