import {
	type AspectRatioStr,
	type TimelineMode,
	type TimeSelection,
	type ZoomAdded,
	type ZoomDelete,
	type ZoomRegion,
	type ZoomSpanChange,
	type ZoomSuggested,
} from "../types";
import { TimelineFooter } from "./components/TimelineFooter";
import { TimelineToolbar } from "./components/TimelineToolbar";
import { TimelineTracks } from "./components/TimelineTracks";
import { useTimelineEditor } from "./hooks/useTimelineEditor";

export interface TimelineEditorProps {
	videoDuration: number;
	videoPath?: string;
	currentTime: number;
	onSeek?: (time: number) => void;
	cursorTelemetry?: any[];
	disableSuggestedZooms?: boolean;
	zoomRegions: ZoomRegion[];
	onZoomAdded: ZoomAdded;
	onZoomSuggested?: ZoomSuggested;
	onZoomSpanChange: ZoomSpanChange;
	onZoomDelete: ZoomDelete;
	selectedZoomId: string | null;
	onSelectZoom: (id: string | null) => void;
	trimRegions?: any[];
	onTrimAdded?: (span: any) => void;
	onTrimSpanChange?: (id: string, span: any) => void;
	onTrimDelete?: (id: string) => void;
	selectedTrimId?: string | null;
	onSelectTrim?: (id: string | null) => void;
	annotationRegions?: any[];
	onAnnotationAdded?: (span: any) => void;
	onAnnotationSpanChange?: (id: string, span: any) => void;
	onAnnotationDelete?: (id: string) => void;
	selectedAnnotationId?: string | null;
	onSelectAnnotation?: (id: string | null) => void;
	speedRegions?: any[];
	onSpeedAdded?: (span: any) => void;
	onSpeedSpanChange?: (id: string, span: any) => void;
	onSpeedDelete?: (id: string) => void;
	selectedSpeedId?: string | null;
	onSelectSpeed?: (id: string | null) => void;
	audioRegions?: any[];
	onAudioAdded?: (span: any, path: string) => void;
	onAudioSpanChange?: (id: string, span: any) => void;
	onAudioMutedChange?: (id: string, muted: boolean) => void;
	onAudioSoloedChange?: (id: string, soloed: boolean) => void;
	onAudioDelete?: (id: string) => void;
	selectedAudioId?: string | null;
	onSelectAudio?: (id: string | null) => void;
	masterAudioMuted?: boolean;
	onMasterAudioMutedChange?: (muted: boolean) => void;
	masterAudioSoloed?: boolean;
	onMasterAudioSoloedChange?: (soloed: boolean) => void;
	masterAudioVolume?: number;
	audioTrackVolume?: number;
	onMasterAudioVolumeChange?: (v: number) => void;
	onAudioTrackVolumeChange?: (v: number) => void;
	autoCaptions?: any[];
	onCaptionSpanChange?: (id: string, span: any) => void;
	selectedCaptionId?: string | null;
	onSelectCaption?: (id: string | null) => void;
	onClearAutoCaptions?: () => void;
	aspectRatio: AspectRatioStr;
	onAspectRatioChange: (r: AspectRatioStr) => void;
	onOpenCropEditor?: () => void;
	isCropped?: boolean;
	timeSelection?: TimeSelection | null;
	onTimeSelectionChange?: (s: TimeSelection | null) => void;
	isMasterSelected?: boolean;
	onSelectMaster?: (s: boolean) => void;
	timelineMode?: TimelineMode;
	onTimelineModeChange?: (m: TimelineMode) => void;
	autoSuggestZoomsTrigger?: number;
	onAutoSuggestZoomsConsumed?: () => void;
}

export default function TimelineEditor(props: TimelineEditorProps) {
	const totalMs = Math.max(0, Math.round(props.videoDuration * 1000));
	const currentTimeMs = Math.round(props.currentTime * 1000);

	const editor = useTimelineEditor({ ...props, totalMs, currentTimeMs });

	return (
		<div className="flex flex-col h-full bg-[#18181b] border-t border-white/10 shadow-2xl relative">
			<TimelineToolbar props={editor} />
			<TimelineTracks props={editor} />
			<TimelineFooter panLabel={editor.scrollLabels.pan} zoomLabel={editor.scrollLabels.zoom} />
		</div>
	);
}
