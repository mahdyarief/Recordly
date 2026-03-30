import { clamp, isFiniteNumber } from "@/shared/lib/math";

export type WebcamCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";
export type WebcamPositionPreset =
	| WebcamCorner
	| "top-center"
	| "center-left"
	| "center"
	| "center-right"
	| "bottom-center"
	| "custom";

export interface WebcamOverlaySettings {
	enabled: boolean;
	sourcePath: string | null;
	timeOffsetMs: number;
	mirror: boolean;
	corner: WebcamCorner;
	positionPreset: WebcamPositionPreset;
	positionX: number;
	positionY: number;
	size: number;
	reactToZoom: boolean;
	cornerRadius: number;
	shadow: number;
	margin: number;
}

export function normalizeWebcamOverlay(
	region: any,
	defaults: WebcamOverlaySettings,
): WebcamOverlaySettings {
	const webcam: any = region && typeof region === "object" ? region : {};
	const webcamSourcePath = typeof webcam.sourcePath === "string" ? webcam.sourcePath : null;
	const legacyZoomScaleEffect = isFiniteNumber(webcam.zoomScaleEffect)
		? (webcam.zoomScaleEffect as number)
		: null;

	return {
		enabled: typeof webcam.enabled === "boolean" ? webcam.enabled : defaults.enabled,
		sourcePath: webcamSourcePath,
		mirror: typeof webcam.mirror === "boolean" ? webcam.mirror : defaults.mirror,
		positionPreset:
			webcam.positionPreset === "top-left" ||
			webcam.positionPreset === "top-center" ||
			webcam.positionPreset === "top-right" ||
			webcam.positionPreset === "center-left" ||
			webcam.positionPreset === "center" ||
			webcam.positionPreset === "center-right" ||
			webcam.positionPreset === "bottom-left" ||
			webcam.positionPreset === "bottom-center" ||
			webcam.positionPreset === "bottom-right" ||
			webcam.positionPreset === "custom"
				? (webcam.positionPreset as WebcamPositionPreset)
				: webcam.corner === "top-left" ||
						webcam.corner === "top-right" ||
						webcam.corner === "bottom-left" ||
						webcam.corner === "bottom-right"
					? (webcam.corner as WebcamCorner)
					: defaults.positionPreset,
		positionX: isFiniteNumber(webcam.positionX)
			? clamp(webcam.positionX, 0, 1)
			: defaults.positionX,
		positionY: isFiniteNumber(webcam.positionY)
			? clamp(webcam.positionY, 0, 1)
			: defaults.positionY,
		corner:
			webcam.corner === "top-left" ||
			webcam.corner === "top-right" ||
			webcam.corner === "bottom-left" ||
			webcam.corner === "bottom-right"
				? (webcam.corner as WebcamCorner)
				: defaults.corner,
		size: isFiniteNumber(webcam.size) ? clamp(webcam.size, 10, 100) : defaults.size,
		reactToZoom:
			typeof webcam.reactToZoom === "boolean"
				? webcam.reactToZoom
				: legacyZoomScaleEffect != null
					? legacyZoomScaleEffect > 0
					: defaults.reactToZoom,
		cornerRadius: isFiniteNumber(webcam.cornerRadius)
			? clamp(webcam.cornerRadius, 0, 160)
			: defaults.cornerRadius,
		shadow: isFiniteNumber(webcam.shadow) ? clamp(webcam.shadow, 0, 1) : defaults.shadow,
		timeOffsetMs: isFiniteNumber(webcam.timeOffsetMs)
			? Math.round(webcam.timeOffsetMs)
			: defaults.timeOffsetMs,
		margin: isFiniteNumber(webcam.margin) ? clamp(webcam.margin, 0, 96) : defaults.margin,
	};
}
