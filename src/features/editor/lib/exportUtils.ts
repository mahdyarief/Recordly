/**
 * Utilities for video export and dimension calculations.
 */
export function calculateGifOutputDimensions(
	sw: number,
	sh: number,
	preset: string,
): { width: number; height: number } {
	const presets: Record<string, number | null> = {
		medium: 480,
		large: 720,
		original: null,
	};
	const tw = presets[preset];
	if (!tw || sw <= tw) {
		return { width: sw, height: sh };
	}
	const scale = tw / sw;
	return { width: tw, height: Math.round(sh * scale) };
}
