import { useMemo } from "react";
import {
	type AnnotationRegion,
	type AudioRegion,
	type CaptionCue,
	type SpeedRegion,
	type TimeSelection,
	type TrimRegion,
	type ZoomRegion,
} from "../types";

interface TimeSelectionProps {
	selectedZoomId: string | null;
	selectedTrimId: string | null;
	selectedSpeedId: string | null;
	selectedAudioId: string | null;
	selectedAnnotationId: string | null;
	selectedCaptionId: string | null;
	zoomRegions: ZoomRegion[];
	trimRegions: TrimRegion[];
	speedRegions: SpeedRegion[];
	audioRegions: AudioRegion[];
	annotationRegions: AnnotationRegion[];
	autoCaptions: CaptionCue[];
}

export function useTimeSelection(props: TimeSelectionProps) {
	const {
		selectedZoomId,
		selectedTrimId,
		selectedSpeedId,
		selectedAudioId,
		selectedAnnotationId,
		selectedCaptionId,
		zoomRegions,
		trimRegions,
		speedRegions,
		audioRegions,
		annotationRegions,
		autoCaptions,
	} = props;

	return useMemo<TimeSelection | null>(() => {
		if (selectedZoomId) {
			const zoom = zoomRegions.find((z) => z.id === selectedZoomId);
			if (zoom) return { startMs: zoom.startMs, endMs: zoom.endMs };
		}
		if (selectedTrimId) {
			const trim = trimRegions.find((t) => t.id === selectedTrimId);
			if (trim) return { startMs: trim.startMs, endMs: trim.endMs };
		}
		if (selectedSpeedId) {
			const speed = speedRegions.find((s) => s.id === selectedSpeedId);
			if (speed) return { startMs: speed.startMs, endMs: speed.endMs };
		}
		if (selectedAudioId) {
			const audio = audioRegions.find((a) => a.id === selectedAudioId);
			if (audio) return { startMs: audio.startMs, endMs: audio.endMs };
		}
		if (selectedAnnotationId) {
			const anno = annotationRegions.find((a) => a.id === selectedAnnotationId);
			if (anno) return { startMs: anno.startMs, endMs: anno.endMs };
		}
		if (selectedCaptionId) {
			const caption = autoCaptions.find((c) => c.id === selectedCaptionId);
			if (caption) return { startMs: caption.startMs, endMs: caption.endMs };
		}
		return null;
	}, [
		selectedZoomId,
		selectedTrimId,
		selectedSpeedId,
		selectedAudioId,
		selectedAnnotationId,
		selectedCaptionId,
		zoomRegions,
		trimRegions,
		speedRegions,
		audioRegions,
		annotationRegions,
		autoCaptions,
	]);
}
