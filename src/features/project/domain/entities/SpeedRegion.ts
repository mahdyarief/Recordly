import { isFiniteNumber } from "@/shared/lib/math";

export type PlaybackSpeed = 0.25 | 0.5 | 0.75 | 1.25 | 1.5 | 1.75 | 2;

export interface SpeedRegion {
	id: string;
	startMs: number;
	endMs: number;
	speed: PlaybackSpeed;
}

export const SPEED_OPTIONS: Array<{ speed: PlaybackSpeed; label: string }> = [
	{ speed: 0.25, label: "0.25×" },
	{ speed: 0.5, label: "0.5×" },
	{ speed: 0.75, label: "0.75×" },
	{ speed: 1.25, label: "1.25×" },
	{ speed: 1.5, label: "1.5×" },
	{ speed: 1.75, label: "1.75×" },
	{ speed: 2, label: "2×" },
];

export function normalizeSpeedRegion(region: any, defaultSpeed: PlaybackSpeed): SpeedRegion | null {
	if (!region || typeof region.id !== "string") return null;

	const rawStart = isFiniteNumber(region.startMs) ? Math.round(region.startMs) : 0;
	const rawEnd = isFiniteNumber(region.endMs) ? Math.round(region.endMs) : rawStart + 1000;
	const startMs = Math.max(0, Math.min(rawStart, rawEnd));
	const endMs = Math.max(startMs + 1, rawEnd);

	const speed =
		region.speed === 0.25 ||
		region.speed === 0.5 ||
		region.speed === 0.75 ||
		region.speed === 1.25 ||
		region.speed === 1.5 ||
		region.speed === 1.75 ||
		region.speed === 2
			? (region.speed as PlaybackSpeed)
			: defaultSpeed;

	return {
		id: region.id,
		startMs,
		endMs,
		speed,
	};
}
