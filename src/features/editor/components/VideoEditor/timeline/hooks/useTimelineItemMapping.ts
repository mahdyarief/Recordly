import { useMemo } from "react";
import type {
	AnnotationRegion,
	AudioRegion,
	CaptionCue,
	SpeedRegion,
	TimelineRenderItem,
	TrimRegion,
	ZoomRegion,
} from "../../types";

const ZOOM_ROW_ID = "row-zoom";
const TRIM_ROW_ID = "row-trim";
const ANNOTATION_ROW_ID = "row-annotation";
const SPEED_ROW_ID = "row-speed";
const ORIGINAL_AUDIO_ROW_ID = "row-original-audio";
const AUDIO_ROW_ID = "row-audio";
const CAPTION_ROW_ID = "row-caption";

interface TimelineItemMappingProps {
	zoomRegions: ZoomRegion[];
	trimRegions: TrimRegion[];
	annotationRegions: AnnotationRegion[];
	speedRegions: SpeedRegion[];
	videoPath?: string;
	totalMs: number;
	masterAudioMuted?: boolean;
	audioRegions: AudioRegion[];
	autoCaptions: CaptionCue[];
}

export function useTimelineItemMapping(props: TimelineItemMappingProps) {
	const {
		zoomRegions,
		trimRegions,
		annotationRegions,
		speedRegions,
		videoPath,
		totalMs,
		masterAudioMuted,
		audioRegions,
		autoCaptions,
	} = props;

	return useMemo<TimelineRenderItem[]>(() => {
		const zooms = zoomRegions.map((r: ZoomRegion, i: number) => ({
			id: r.id,
			rowId: ZOOM_ROW_ID,
			span: { start: r.startMs, end: r.endMs },
			label: `Zoom ${i + 1}`,
			variant: "zoom" as const,
		}));
		const trims = trimRegions.map((r: TrimRegion, i: number) => ({
			id: r.id,
			rowId: TRIM_ROW_ID,
			span: { start: r.startMs, end: r.endMs },
			label: `Trim ${i + 1}`,
			variant: "trim" as const,
		}));
		const annotations = annotationRegions.map((r: AnnotationRegion) => ({
			id: r.id,
			rowId: ANNOTATION_ROW_ID,
			span: { start: r.startMs, end: r.endMs },
			label: r.type === "text" ? r.content : "Annotation",
			variant: "annotation" as const,
		}));
		const speeds = speedRegions.map((r: SpeedRegion, i: number) => ({
			id: r.id,
			rowId: SPEED_ROW_ID,
			span: { start: r.startMs, end: r.endMs },
			label: `Speed ${i + 1}`,
			variant: "speed" as const,
		}));
		const videoAudio =
			videoPath && totalMs > 0
				? [
						{
							id: "master-audio",
							rowId: ORIGINAL_AUDIO_ROW_ID,
							span: { start: 0, end: totalMs },
							label: "Master Audio",
							variant: "audio" as const,
							audioPath: videoPath,
							muted: masterAudioMuted,
						},
					]
				: [];
		const audios = audioRegions.map((r: AudioRegion) => ({
			id: r.id,
			rowId: AUDIO_ROW_ID,
			span: { start: r.startMs, end: r.endMs },
			label: r.audioPath.split(/[\\/]/).pop() || "Audio",
			variant: "audio" as const,
			audioPath: r.audioPath,
			muted: r.muted,
			soloed: r.soloed,
		}));
		const captions = autoCaptions.map((r: CaptionCue) => ({
			id: r.id,
			rowId: CAPTION_ROW_ID,
			span: { start: r.startMs, end: r.endMs },
			label: r.text,
			variant: "caption" as const,
		}));
		return [...zooms, ...trims, ...annotations, ...speeds, ...videoAudio, ...audios, ...captions];
	}, [
		zoomRegions,
		trimRegions,
		annotationRegions,
		speedRegions,
		videoPath,
		totalMs,
		masterAudioMuted,
		audioRegions,
		autoCaptions,
	]);
}
