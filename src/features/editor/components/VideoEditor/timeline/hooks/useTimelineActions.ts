import type { Span } from "dnd-timeline";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { toFileUrl } from "@/features/project/domain/services/projectPersistence";
import type {
	AnnotationRegion,
	AudioRegion,
	CaptionCue,
	SpeedRegion,
	TrimRegion,
	ZoomAdded,
	ZoomRegion,
	ZoomSuggested,
} from "../../types";
import { detectInteractionCandidates, normalizeCursorTelemetry } from "../zoomSuggestionUtils";

interface TimelineActionsProps {
	totalMs: number;
	currentTimeMs: number;
	timeSelection: any | null;
	zoomRegions: ZoomRegion[];
	trimRegions: TrimRegion[];
	speedRegions: SpeedRegion[];
	audioRegions: AudioRegion[];
	annotationRegions: AnnotationRegion[];
	autoCaptions: CaptionCue[];
	onZoomAdded: ZoomAdded;
	onZoomSuggested?: ZoomSuggested;
	onTrimAdded?: (span: any) => void;
	onSpeedAdded?: (span: any) => void;
	onAudioAdded?: (span: any, path: string) => void;
	onAnnotationAdded?: (span: any) => void;
	onZoomDelete: (id: string) => void;
	onTrimDelete?: (id: string) => void;
	onSpeedDelete?: (id: string) => void;
	onAudioDelete?: (id: string) => void;
	onAnnotationDelete?: (id: string) => void;
	onClearAutoCaptions?: () => void;
	onTimeSelectionChange?: (s: any | null) => void;
	clearSelectedBlocks: () => void;
	disableSuggestedZooms?: boolean;
	cursorTelemetry?: any[];
}

export function useTimelineActions(props: TimelineActionsProps) {
	const {
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
		clearSelectedBlocks,
		disableSuggestedZooms,
		cursorTelemetry = [],
	} = props;

	const defaultRegionDurationMs = useMemo(() => Math.min(1000, totalMs), [totalMs]);

	const hasOverlap = useCallback(
		(newSpan: Span, excludeId?: string): boolean => {
			const check = (regions: any[]) =>
				regions.some(
					(r) => r.id !== excludeId && newSpan.end > r.startMs && newSpan.start < r.endMs,
				);
			const isZoom = zoomRegions.some((r) => r.id === excludeId);
			const isTrim = trimRegions.some((r) => r.id === excludeId);
			const isSpeed = speedRegions.some((r) => r.id === excludeId);
			const isAudio = audioRegions.some((r) => r.id === excludeId);

			if (isZoom) return check(zoomRegions);
			if (isTrim) return check(trimRegions);
			if (isSpeed) return check(speedRegions);
			if (isAudio) return check(audioRegions);
			return false;
		},
		[zoomRegions, trimRegions, speedRegions, audioRegions],
	);

	const allRegionSpans = useMemo(() => {
		const regions = [
			...zoomRegions,
			...trimRegions,
			...speedRegions,
			...audioRegions,
			...autoCaptions,
		];
		return regions.map((r: any) => ({ id: r.id, start: r.startMs, end: r.endMs }));
	}, [zoomRegions, trimRegions, speedRegions, audioRegions, autoCaptions]);

	const handleAddZoom = useCallback(() => {
		if (!totalMs || !onZoomAdded) return;
		const startPos = timeSelection
			? timeSelection.startMs
			: Math.max(0, Math.min(currentTimeMs, totalMs));
		const duration = timeSelection
			? timeSelection.endMs - timeSelection.startMs
			: defaultRegionDurationMs;
		const sorted = [...zoomRegions].sort((a, b) => a.startMs - b.startMs);
		const next = sorted.find((r) => r.startMs > startPos);
		const gap = next ? next.startMs - startPos : totalMs - startPos;

		if (
			sorted.some((r) => startPos >= r.startMs && startPos < r.endMs) ||
			gap <= 0 ||
			duration > gap
		) {
			toast.error("Cannot place zoom here");
			return;
		}
		onZoomAdded({ start: startPos, end: startPos + Math.min(duration, gap) });
		if (timeSelection) onTimeSelectionChange?.(null);
	}, [
		totalMs,
		currentTimeMs,
		zoomRegions,
		onZoomAdded,
		defaultRegionDurationMs,
		timeSelection,
		onTimeSelectionChange,
	]);

	const handleSuggestZooms = useCallback(() => {
		if (!totalMs || disableSuggestedZooms || !onZoomSuggested || cursorTelemetry.length < 2) return;
		const normalizedSamples = normalizeCursorTelemetry(cursorTelemetry, totalMs);
		const dwellCandidates = detectInteractionCandidates(normalizedSamples);
		if (dwellCandidates.length === 0) {
			toast.info("No clear interaction moments found");
			return;
		}
		const reservedSpans = zoomRegions
			.map((r) => ({ start: r.startMs, end: r.endMs }))
			.sort((a, b) => a.start - b.start);
		let addedCount = 0;
		[...dwellCandidates]
			.sort((a: any, b: any) => b.strength - a.strength)
			.forEach((c: any) => {
				const start = Math.max(
					0,
					Math.min(
						Math.round(c.centerTimeMs - defaultRegionDurationMs / 2),
						totalMs - defaultRegionDurationMs,
					),
				);
				const end = start + defaultRegionDurationMs;
				if (reservedSpans.some((s) => end > s.start && start < s.end)) return;
				reservedSpans.push({ start, end });
				onZoomSuggested({ start, end }, c.focus);
				addedCount++;
			});
		if (addedCount > 0) toast.success(`Added ${addedCount} zoom suggestions`);
	}, [
		totalMs,
		disableSuggestedZooms,
		onZoomSuggested,
		cursorTelemetry,
		zoomRegions,
		defaultRegionDurationMs,
	]);

	const handleAddTrim = useCallback(() => {
		if (!totalMs || !onTrimAdded) return;
		const startPos = timeSelection
			? timeSelection.startMs
			: Math.max(0, Math.min(currentTimeMs, totalMs));
		const duration = timeSelection
			? timeSelection.endMs - timeSelection.startMs
			: defaultRegionDurationMs;
		const sorted = [...trimRegions].sort((a, b) => a.startMs - b.startMs);
		const next = sorted.find((r) => r.startMs > startPos);
		const gap = next ? next.startMs - startPos : totalMs - startPos;

		if (
			sorted.some((r) => startPos >= r.startMs && startPos < r.endMs) ||
			gap <= 0 ||
			duration > gap
		) {
			toast.error("Cannot place trim here");
			return;
		}
		onTrimAdded({ start: startPos, end: startPos + Math.min(duration, gap) });
		if (timeSelection) onTimeSelectionChange?.(null);
	}, [
		totalMs,
		currentTimeMs,
		trimRegions,
		onTrimAdded,
		defaultRegionDurationMs,
		timeSelection,
		onTimeSelectionChange,
	]);

	const handleAddSpeed = useCallback(() => {
		if (!totalMs || !onSpeedAdded) return;
		const startPos = timeSelection
			? timeSelection.startMs
			: Math.max(0, Math.min(currentTimeMs, totalMs));
		const duration = timeSelection
			? timeSelection.endMs - timeSelection.startMs
			: defaultRegionDurationMs;
		const sorted = [...speedRegions].sort((a, b) => a.startMs - b.startMs);
		const next = sorted.find((r) => r.startMs > startPos);
		const gap = next ? next.startMs - startPos : totalMs - startPos;

		if (
			sorted.some((r) => startPos >= r.startMs && startPos < r.endMs) ||
			gap <= 0 ||
			duration > gap
		) {
			toast.error("Cannot place speed here");
			return;
		}
		onSpeedAdded({ start: startPos, end: startPos + Math.min(duration, gap) });
		if (timeSelection) onTimeSelectionChange?.(null);
	}, [
		totalMs,
		currentTimeMs,
		speedRegions,
		onSpeedAdded,
		defaultRegionDurationMs,
		timeSelection,
		onTimeSelectionChange,
	]);

	const handleAddAudio = useCallback(async () => {
		if (!totalMs || !onAudioAdded) return;
		const result = await (window as any).electronAPI.openAudioFilePicker();
		if (!result?.success || !result.path) return;
		const audioDurationMs = await new Promise<number>((resolve) => {
			const audio = new Audio(toFileUrl(result.path));
			audio.addEventListener("loadedmetadata", () => resolve(Math.round(audio.duration * 1000)));
			audio.addEventListener("error", () => resolve(0));
		});
		if (audioDurationMs <= 0) {
			toast.error("Could not read audio file");
			return;
		}
		const startPos = timeSelection
			? timeSelection.startMs
			: Math.max(0, Math.min(currentTimeMs, totalMs));
		const sorted = [...audioRegions].sort((a, b) => a.startMs - b.startMs);
		const next = sorted.find((r) => r.startMs > startPos);
		const gap = next ? next.startMs - startPos : totalMs - startPos;

		if (sorted.some((r) => startPos >= r.startMs && startPos < r.endMs) || gap <= 0) {
			toast.error("Cannot place audio here");
			return;
		}
		onAudioAdded(
			{ start: startPos, end: startPos + Math.min(audioDurationMs, gap, totalMs - startPos) },
			result.path,
		);
		if (timeSelection) onTimeSelectionChange?.(null);
	}, [totalMs, currentTimeMs, audioRegions, onAudioAdded, timeSelection, onTimeSelectionChange]);

	const handleAddAnnotation = useCallback(() => {
		if (!totalMs || !onAnnotationAdded) return;
		const startPos = timeSelection
			? timeSelection.startMs
			: Math.max(0, Math.min(currentTimeMs, totalMs));
		const duration = timeSelection
			? timeSelection.endMs - timeSelection.startMs
			: defaultRegionDurationMs;
		onAnnotationAdded({ start: startPos, end: Math.min(startPos + duration, totalMs) });
		if (timeSelection) onTimeSelectionChange?.(null);
	}, [
		totalMs,
		currentTimeMs,
		onAnnotationAdded,
		defaultRegionDurationMs,
		timeSelection,
		onTimeSelectionChange,
	]);

	const deleteAllBlocks = useCallback(() => {
		zoomRegions.forEach((r) => onZoomDelete(r.id));
		trimRegions.forEach((r) => onTrimDelete?.(r.id));
		annotationRegions.forEach((r) => onAnnotationDelete?.(r.id));
		speedRegions.forEach((r) => onSpeedDelete?.(r.id));
		audioRegions.forEach((r) => onAudioDelete?.(r.id));
		onClearAutoCaptions?.();
		clearSelectedBlocks();
	}, [
		annotationRegions,
		audioRegions,
		clearSelectedBlocks,
		onAnnotationDelete,
		onAudioDelete,
		onClearAutoCaptions,
		onSpeedDelete,
		onTrimDelete,
		onZoomDelete,
		speedRegions,
		trimRegions,
		zoomRegions,
	]);

	return {
		allRegionSpans,
		hasOverlap,
		handleAddZoom,
		handleAddTrim,
		handleAddSpeed,
		handleAddAudio,
		handleAddAnnotation,
		handleSuggestZooms,
		deleteAllBlocks,
	};
}
