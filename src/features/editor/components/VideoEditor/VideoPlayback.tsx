import { forwardRef, useImperativeHandle } from "react";
import { type VideoPlaybackProps, type VideoPlaybackRef } from "./types";
import { AnnotationLayers } from "./videoPlayback/components/AnnotationLayers";
import { CaptionOverlay } from "./videoPlayback/components/CaptionOverlay";
import { WebcamBubble } from "./videoPlayback/components/WebcamBubble";
import { useVideoPlaybackLogic } from "./videoPlayback/hooks/useVideoPlaybackLogic";

const VideoPlayback = forwardRef<VideoPlaybackRef, VideoPlaybackProps>((props, ref) => {
	const logic = useVideoPlaybackLogic(props);

	useImperativeHandle(ref, () => ({
		video: logic.videoRef.current,
		app: logic.appRef.current,
		videoSprite: logic.videoSpriteRef.current,
		videoContainer: logic.videoContainerRef.current,
		containerRef: logic.containerRef,
		play: async () => logic.videoRef.current?.play(),
		pause: () => logic.videoRef.current?.pause(),
		refreshFrame: async () => {
			// Handled by Pixi ticker
		},
		seek: (time: number) => logic.seek(time),
	}));

	return (
		<div className="flex-1 w-full h-full min-h-0 bg-[#0d0d0f] relative overflow-hidden flex flex-col items-center justify-center group/playback">
			<div
				ref={logic.containerRef}
				className="w-full h-full relative"
				style={{ aspectRatio: props.aspectRatio }}
			>
				{logic.pixiReady && (
					<div
						ref={logic.overlayRef}
						className="absolute inset-0 z-10 pointer-events-none transition-opacity duration-300"
					>
						<WebcamBubble
							ref={logic.webcamBubbleRef}
							webcam={props.webcam}
							webcamVideoPath={props.webcamVideoPath}
							videoRef={logic.webcamVideoRef}
						/>

						<AnnotationLayers
							annotationRegions={props.annotationRegions}
							selectedAnnotationId={props.selectedAnnotationId}
							currentTime={props.currentTime}
							overlayRef={logic.overlayRef}
							onSelectAnnotation={props.onSelectAnnotation}
							onAnnotationPositionChange={props.onAnnotationPositionChange}
							onAnnotationSizeChange={props.onAnnotationSizeChange}
						/>

						<CaptionOverlay
							activeCaptionLayout={logic.activeCaptionLayout}
							autoCaptionSettings={props.autoCaptionSettings}
							overlayRef={logic.overlayRef}
						/>

						{props.showCursor && (
							<canvas
								ref={logic.cursorCanvasRef}
								className="absolute inset-0 pointer-events-none w-full h-full z-[10000]"
							/>
						)}
					</div>
				)}

				<video
					ref={logic.videoRef}
					src={props.videoPath}
					className="hidden"
					preload="metadata"
					playsInline
					onLoadedMetadata={logic.handleLoadedMetadata}
					onDurationChange={(e) => props.onDurationChange?.(e.currentTarget.duration)}
					onTimeUpdate={(e) => props.onTimeUpdate?.(e.currentTarget.currentTime)}
					onError={() => props.onError?.("Video load failed")}
				/>
			</div>
		</div>
	);
});

VideoPlayback.displayName = "VideoPlayback";
export default VideoPlayback;
