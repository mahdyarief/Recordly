import React from "react";
import { Panel } from "react-resizable-panels";
import PlaybackControls from "../../PlaybackControls";
import {
	type AnnotationRegion,
	type AspectRatio,
	type AutoCaptionSettings,
	type CaptionCue,
	type CursorStyle,
	type CursorTelemetryPoint,
	type TimeSelection,
	type VideoPlaybackRef,
	type ZoomFocus,
	type ZoomRegion,
	type ZoomTransitionEasing,
} from "../types";
import VideoPlayback from "../VideoPlayback";
import { EditorRail, type EditorSectionButton } from "./EditorRail";

interface PlaybackPanelProps {
	videoSourcePath: string;
	previewVersion: number;
	previewVolume: number;
	masterAudioVolume: number;
	aspectRatio: AspectRatio;
	videoPlaybackRef: React.RefObject<VideoPlaybackRef>;
	onDurationChange: (d: number) => void;
	onTimeUpdate: (t: number) => void;
	currentTime: number;
	setIsPlaying: (p: boolean) => void;
	setError: (e: string | null) => void;
	wallpaper: string;
	effectiveZoomRegions: ZoomRegion[];
	selectedZoomId: string | null;
	handleSelectZoom: (id: string) => void;
	handleZoomFocusChange: (id: string, focus: ZoomFocus) => void;
	isPlaying: boolean;
	shadowIntensity: number;
	backgroundBlur: number;
	zoomMotionBlur: number;
	connectZooms: boolean;
	zoomInDurationMs: number;
	zoomInOverlapMs: number;
	zoomOutDurationMs: number;
	connectedZoomGapMs: number;
	connectedZoomDurationMs: number;
	zoomInEasing: ZoomTransitionEasing;
	zoomOutEasing: ZoomTransitionEasing;
	connectedZoomEasing: ZoomTransitionEasing;
	annotationRegions: AnnotationRegion[];
	autoCaptions: CaptionCue[];
	autoCaptionSettings: AutoCaptionSettings;
	selectedAnnotationId: string | null;
	handleSelectAnnotation: (id: string | null) => void;
	handleAnnotationPositionChange: (id: string, pos: { x: number; y: number }) => void;
	handleAnnotationSizeChange: (id: string, size: { width: number; height: number }) => void;
	effectiveCursorTelemetry: CursorTelemetryPoint[];
	showCursor: boolean;
	cursorStyle: CursorStyle;
	cursorSize: number;
	cursorSmoothing: number;
	cursorMotionBlur: number;
	cursorClickBounce: number;
	cursorClickBounceDuration: number;
	cursorSway: number;
	timeSelection: TimeSelection | null;
	togglePlayPause: () => void;
	handleSeek: (t: number) => void;
	setPreviewVolume: (v: number) => void;
	activeEffectSection: string;
	setActiveEffectSection: (id: string) => void;
	editorSectionButtons: EditorSectionButton[];
	duration: number;
}

export function PlaybackPanel(props: PlaybackPanelProps) {
	return (
		<Panel defaultSize={67} minSize={40}>
			<div className="relative flex h-full flex-col overflow-hidden">
				<div
					className="flex w-full min-h-0 flex-1 items-stretch"
					style={{ flex: "1 1 auto", margin: "6px 0 0" }}
				>
					<EditorRail
						sections={props.editorSectionButtons}
						activeSection={props.activeEffectSection}
						onSectionChange={props.setActiveEffectSection}
					/>
					<div className="flex min-w-0 flex-1 items-center justify-center pl-2 pr-1">
						<div
							className="relative overflow-hidden rounded-[30px]"
							style={{
								width: "auto",
								height: "100%",
								aspectRatio: 16 / 9,
								maxWidth: "100%",
								margin: "0 auto",
							}}
						>
							<VideoPlayback
								key={`${props.videoSourcePath || "no-video"}:${props.previewVersion}`}
								volume={props.previewVolume * props.masterAudioVolume}
								aspectRatio={props.aspectRatio}
								ref={props.videoPlaybackRef}
								videoPath={props.videoSourcePath}
								onDurationChange={props.onDurationChange}
								onTimeUpdate={props.onTimeUpdate}
								currentTime={props.currentTime}
								onPlayStateChange={props.setIsPlaying}
								onError={props.setError}
								wallpaper={props.wallpaper}
								zoomRegions={props.effectiveZoomRegions}
								selectedZoomId={props.selectedZoomId}
								onSelectZoom={props.handleSelectZoom}
								onZoomFocusChange={props.handleZoomFocusChange}
								isPlaying={props.isPlaying}
								showShadow={props.shadowIntensity > 0}
								shadowIntensity={props.shadowIntensity}
								backgroundBlur={props.backgroundBlur}
								zoomMotionBlur={props.zoomMotionBlur}
								connectZooms={props.connectZooms}
								zoomInDurationMs={props.zoomInDurationMs}
								zoomInOverlapMs={props.zoomInOverlapMs}
								zoomOutDurationMs={props.zoomOutDurationMs}
								connectedZoomGapMs={props.connectedZoomGapMs}
								connectedZoomDurationMs={props.connectedZoomDurationMs}
								zoomInEasing={props.zoomInEasing}
								zoomOutEasing={props.zoomOutEasing}
								connectedZoomEasing={props.connectedZoomEasing}
								annotationRegions={props.annotationRegions}
								autoCaptions={props.autoCaptions}
								autoCaptionSettings={props.autoCaptionSettings}
								selectedAnnotationId={props.selectedAnnotationId}
								onSelectAnnotation={props.handleSelectAnnotation}
								onAnnotationPositionChange={props.handleAnnotationPositionChange}
								onAnnotationSizeChange={props.handleAnnotationSizeChange}
								cursorTelemetry={props.effectiveCursorTelemetry}
								showCursor={props.showCursor}
								cursorStyle={props.cursorStyle}
								cursorSize={props.cursorSize}
								cursorSmoothing={props.cursorSmoothing}
								cursorMotionBlur={props.cursorMotionBlur}
								cursorClickBounce={props.cursorClickBounce}
								cursorClickBounceDuration={props.cursorClickBounceDuration}
								cursorSway={props.cursorSway}
								timeSelection={props.timeSelection}
							/>
						</div>
					</div>
				</div>
				<div className="w-full flex justify-center items-center h-12 shrink-0 px-3 my-1.5">
					<div className="w-full max-w-[700px]">
						<PlaybackControls
							isPlaying={props.isPlaying}
							currentTime={props.currentTime}
							duration={props.duration}
							onTogglePlayPause={props.togglePlayPause}
							onSeek={props.handleSeek}
							volume={props.previewVolume}
							onVolumeChange={props.setPreviewVolume}
						/>
					</div>
				</div>
			</div>
		</Panel>
	);
}
