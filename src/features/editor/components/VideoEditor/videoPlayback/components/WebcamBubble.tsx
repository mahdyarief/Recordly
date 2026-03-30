import { forwardRef } from "react";
import { type WebcamOverlaySettings } from "../../types";

interface WebcamBubbleProps {
	webcam?: WebcamOverlaySettings;
	webcamVideoPath?: string | null;
	videoRef: React.Ref<HTMLVideoElement | null>;
}

export const WebcamBubble = forwardRef<HTMLDivElement, WebcamBubbleProps>((props, ref) => {
	const { webcam, webcamVideoPath, videoRef } = props;

	if (!webcam?.enabled || !webcamVideoPath) return null;

	return (
		<div
			ref={ref}
			className="absolute pointer-events-none z-40 overflow-visible transition-none transform-gpu"
			style={{
				willChange: "transform, width, height, top, left, filter",
				display: "none",
			}}
		>
			<div
				className="absolute inset-0 bg-[#0d0d0f] transition-none transform-gpu flex items-center justify-center overflow-hidden"
				data-webcam-bubble-inner
			>
				<video
					ref={(el) => {
						if (typeof videoRef === "function") {
							videoRef(el);
						} else if (videoRef && "current" in videoRef) {
							(videoRef as any).current = el;
						}
					}}
					src={webcamVideoPath}
					className="w-full h-full object-cover grayscale transition-none transform-gpu"
					muted
					playsInline
					loop
				/>
			</div>
		</div>
	);
});

WebcamBubble.displayName = "WebcamBubble";
