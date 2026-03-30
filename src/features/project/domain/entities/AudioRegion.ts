import { clamp, isFiniteNumber } from "@/shared/lib/math";

export interface AudioRegion {
	id: string;
	startMs: number;
	endMs: number;
	audioPath: string;
	volume: number;
	muted?: boolean;
	soloed?: boolean;
	fadeInMs?: number;
	fadeOutMs?: number;
}

export function normalizeAudioRegion(region: any): AudioRegion | null {
	if (!region || typeof region.id !== "string") return null;

	const rawStart = isFiniteNumber(region.startMs) ? Math.round(region.startMs) : 0;
	const rawEnd = isFiniteNumber(region.endMs) ? Math.round(region.endMs) : rawStart + 1000;
	const startMs = Math.max(0, Math.min(rawStart, rawEnd));
	const endMs = Math.max(startMs + 1, rawEnd);

	return {
		id: region.id,
		startMs,
		endMs,
		audioPath: typeof region.audioPath === "string" ? region.audioPath : "",
		volume: isFiniteNumber(region.volume) ? clamp(region.volume, 0, 2) : 1,
		muted: typeof region.muted === "boolean" ? region.muted : false,
		soloed: typeof region.soloed === "boolean" ? region.soloed : false,
		fadeInMs: isFiniteNumber(region.fadeInMs) ? clamp(region.fadeInMs, 0, 10000) : 0,
		fadeOutMs: isFiniteNumber(region.fadeOutMs) ? clamp(region.fadeOutMs, 0, 10000) : 0,
	};
}
