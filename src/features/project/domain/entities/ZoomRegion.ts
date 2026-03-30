import { clamp, isFiniteNumber } from "@/shared/lib/math";

export type ZoomTransitionEasing = "recordly" | "glide" | "smooth" | "snappy" | "linear";
export type ZoomDepth = 1 | 2 | 3 | 4 | 5 | 6;

export interface ZoomFocus {
	cx: number; // normalized horizontal center (0-1)
	cy: number; // normalized vertical center (0-1)
}

export interface ZoomRegion {
	id: string;
	startMs: number;
	endMs: number;
	depth: ZoomDepth;
	focus: ZoomFocus;
}

export const ZOOM_DEPTH_SCALES: Record<ZoomDepth, number> = {
	1: 1.25,
	2: 1.5,
	3: 1.8,
	4: 2.2,
	5: 3.5,
	6: 5.0,
};

export function normalizeZoomRegion(region: any, defaultDepth: ZoomDepth): ZoomRegion | null {
	if (!region || typeof region.id !== "string") return null;

	const rawStart = isFiniteNumber(region.startMs) ? Math.round(region.startMs) : 0;
	const rawEnd = isFiniteNumber(region.endMs) ? Math.round(region.endMs) : rawStart + 1000;
	const startMs = Math.max(0, Math.min(rawStart, rawEnd));
	const endMs = Math.max(startMs + 1, rawEnd);

	return {
		id: region.id,
		startMs,
		endMs,
		depth: [1, 2, 3, 4, 5, 6].includes(region.depth) ? region.depth : defaultDepth,
		focus: {
			cx: clamp(isFiniteNumber(region.focus?.cx) ? region.focus.cx : 0.5, 0, 1),
			cy: clamp(isFiniteNumber(region.focus?.cy) ? region.focus.cy : 0.5, 0, 1),
		},
	};
}

export function normalizeZoomTransitionEasing(
	value: unknown,
	fallback: ZoomTransitionEasing,
): ZoomTransitionEasing {
	return value === "recordly" ||
		value === "glide" ||
		value === "smooth" ||
		value === "snappy" ||
		value === "linear"
		? (value as ZoomTransitionEasing)
		: fallback;
}

export function clampFocusToDepth(focus: ZoomFocus, depth: ZoomDepth): ZoomFocus {
	const scale = ZOOM_DEPTH_SCALES[depth];
	const marginX = 1 / (2 * scale);
	const marginY = 1 / (2 * scale);

	return {
		cx: clamp(focus.cx, marginX, 1 - marginX),
		cy: clamp(focus.cy, marginY, 1 - marginY),
	};
}
