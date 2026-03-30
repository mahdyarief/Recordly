import { isFiniteNumber } from "@/shared/lib/math";

export interface TrimRegion {
	id: string;
	startMs: number;
	endMs: number;
}

export function normalizeTrimRegion(region: any): TrimRegion | null {
	if (!region || typeof region.id !== "string") return null;

	const rawStart = isFiniteNumber(region.startMs) ? Math.round(region.startMs) : 0;
	const rawEnd = isFiniteNumber(region.endMs) ? Math.round(region.endMs) : rawStart + 1000;
	const startMs = Math.max(0, Math.min(rawStart, rawEnd));
	const endMs = Math.max(startMs + 1, rawEnd);

	return {
		id: region.id,
		startMs,
		endMs,
	};
}
