import { clamp, isFiniteNumber } from "@/shared/lib/math";

export interface CaptionCue {
	id: string;
	startMs: number;
	endMs: number;
	text: string;
	words?: CaptionCueWord[];
}

export interface CaptionCueWord {
	text: string;
	startMs: number;
	endMs: number;
	leadingSpace?: boolean;
}

export function normalizeCaptionCue(cue: unknown): CaptionCue | null {
	if (!cue || typeof cue !== "object" || !("id" in cue) || typeof cue.id !== "string") {
		return null;
	}

	const c = cue as Record<string, unknown>;
	const rawStart = isFiniteNumber(c.startMs) ? Math.round(c.startMs as number) : 0;
	const rawEnd = isFiniteNumber(c.endMs) ? Math.round(c.endMs as number) : rawStart + 1000;
	const startMs = Math.max(0, Math.min(rawStart, rawEnd));
	const endMs = Math.max(startMs + 1, rawEnd);

	const words: CaptionCueWord[] | undefined = Array.isArray(c.words)
		? c.words
				.filter((word: unknown): word is CaptionCueWord => {
					if (!word || typeof word !== "object") return false;
					const w = word as Record<string, unknown>;
					return typeof w.text === "string" && isFiniteNumber(w.startMs) && isFiniteNumber(w.endMs);
				})
				.map((word: CaptionCueWord) => {
					const rawWordStart = isFiniteNumber(word.startMs) ? Math.round(word.startMs) : startMs;
					const rawWordEnd = isFiniteNumber(word.endMs) ? Math.round(word.endMs) : rawWordStart + 1;
					const normalizedWordStart = clamp(rawWordStart, startMs, endMs - 1);
					const normalizedWordEnd = clamp(rawWordEnd, normalizedWordStart + 1, endMs);

					return {
						text: word.text.trim(),
						startMs: normalizedWordStart,
						endMs: normalizedWordEnd,
						...(word.leadingSpace ? { leadingSpace: true } : {}),
					};
				})
				.filter((word: CaptionCueWord) => word.text.length > 0)
		: undefined;

	return {
		id: c.id as string,
		startMs,
		endMs,
		text: typeof c.text === "string" ? (c.text as string).trim() : "",
		...(words && words.length > 0 ? { words } : {}),
	};
}
