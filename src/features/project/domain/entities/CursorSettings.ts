import type { CursorTelemetryPoint } from "@/features/timeline/domain/entities/TimelineTypes";

export type CursorStyle =
	| "tahoe"
	| "dot"
	| "figma"
	| "mono"
	| "lavender"
	| "parched"
	| "chooper"
	| "amongus"
	| "turtle";

export function normalizeCursorStyle(value: any, fallback: CursorStyle): CursorStyle {
	return value === "dot" ||
		value === "figma" ||
		value === "mono" ||
		value === "tahoe" ||
		value === "lavender" ||
		value === "parched" ||
		value === "chooper" ||
		value === "amongus" ||
		value === "turtle"
		? (value as CursorStyle)
		: fallback;
}

export interface CursorVisualSettings {
	size: number;
	smoothing: number;
	motionBlur: number;
	clickBounce: number;
	clickBounceDuration: number;
	sway: number;
	style: CursorStyle;
}

export type { CursorTelemetryPoint };
