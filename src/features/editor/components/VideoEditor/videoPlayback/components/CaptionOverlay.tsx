import React, { useEffect, useRef } from "react";
import {
	CAPTION_LINE_HEIGHT,
	getCaptionScaledFontSize,
	getCaptionScaledRadius,
	getCaptionWordVisualState,
} from "@/features/captions/domain/entities/captionStyle";
import { getSquircleSvgPath } from "@/shared/lib/squircle";
import { type AutoCaptionSettings } from "../../types";

interface CaptionOverlayProps {
	activeCaptionLayout: any;
	autoCaptionSettings: AutoCaptionSettings;
	overlayRef: React.RefObject<HTMLDivElement | null>;
}

export function CaptionOverlay({
	activeCaptionLayout,
	autoCaptionSettings,
	overlayRef,
}: CaptionOverlayProps) {
	const captionBoxRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const captionBox = captionBoxRef.current;
		if (!captionBox || !activeCaptionLayout || !autoCaptionSettings) {
			if (captionBox) {
				captionBox.style.clipPath = "";
				captionBox.style.removeProperty("-webkit-clip-path");
			}
			return;
		}

		const frame = requestAnimationFrame(() => {
			const width = captionBox.offsetWidth;
			const height = captionBox.offsetHeight;
			if (width <= 0 || height <= 0) return;

			const stageWidth = overlayRef.current?.clientWidth || 960;
			const fontSize = getCaptionScaledFontSize(
				autoCaptionSettings.fontSize,
				stageWidth,
				autoCaptionSettings.maxWidth,
			);
			const radius = getCaptionScaledRadius(autoCaptionSettings.boxRadius, fontSize);
			const squirclePath = getSquircleSvgPath({ x: 0, y: 0, width, height, radius });

			captionBox.style.clipPath = `path('${squirclePath}')`;
			captionBox.style.setProperty("-webkit-clip-path", `path('${squirclePath}')`);
		});

		return () => cancelAnimationFrame(frame);
	}, [activeCaptionLayout, autoCaptionSettings, overlayRef]);

	if (!activeCaptionLayout || !autoCaptionSettings.enabled) return null;

	const stageWidth = overlayRef.current?.clientWidth || 960;
	const fontSize = getCaptionScaledFontSize(
		autoCaptionSettings.fontSize,
		stageWidth,
		autoCaptionSettings.maxWidth,
	);

	return (
		<div
			className="absolute inset-x-0 bottom-[10%] flex flex-col items-center pointer-events-none select-none z-50 transition-transform duration-200"
			style={{
				transform: `translateY(${activeCaptionLayout.verticalOffsetPercent}%)`,
				pointerEvents: "none",
			}}
		>
			<div
				ref={captionBoxRef}
				className="px-6 py-4 flex flex-col items-center transition-colors"
				style={{
					backgroundColor: `rgba(0, 0, 0, ${autoCaptionSettings.backgroundOpacity || 0.65})`,
					boxShadow: "0 10px 40px -10px rgba(0,0,0,0.5)",
				}}
			>
				<div
					className="flex flex-col items-center gap-1 transition-opacity"
					style={{
						fontFamily: autoCaptionSettings.fontFamily,
						fontWeight: 700,
						lineHeight: CAPTION_LINE_HEIGHT,
						textAlign: "center",
					}}
				>
					{activeCaptionLayout.visibleLines.map((line: any) => (
						<div
							key={`${activeCaptionLayout.blockKey}-${line.startWordIndex}`}
							className="flex justify-center flex-nowrap whitespace-nowrap"
						>
							{line.words.map((word: any) => {
								const visualState = getCaptionWordVisualState(
									activeCaptionLayout.hasWordTimings,
									word.state,
								);
								return (
									<span
										key={`${activeCaptionLayout.blockKey}-${word.index}`}
										className="inline-block whitespace-pre"
										style={{
											color: visualState.isInactive
												? autoCaptionSettings.inactiveTextColor
												: autoCaptionSettings.textColor,
											opacity: visualState.opacity,
											fontSize: fontSize,
										}}
									>
										{`${word.leadingSpace ? " " : ""}${word.text}`}
									</span>
								);
							})}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
