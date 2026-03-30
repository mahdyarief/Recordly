import { AspectRatio, getAspectRatioValue } from "@/shared/lib/aspectRatio";
import { ExportQuality, GIF_SIZE_PRESETS, GifSizePreset } from "../domain/entities/ExportSettings";

export function calculateMp4SourceDimensions(
	sourceWidth: number,
	sourceHeight: number,
	aspectRatio: AspectRatio,
): { width: number; height: number } {
	const safeSourceWidth = Math.max(2, Math.floor(sourceWidth / 2) * 2);
	const safeSourceHeight = Math.max(2, Math.floor(sourceHeight / 2) * 2);
	const sourceAspectRatio = safeSourceHeight > 0 ? safeSourceWidth / safeSourceHeight : 16 / 9;
	const aspectRatioValue = getAspectRatioValue(aspectRatio, sourceAspectRatio);

	if (aspectRatio === "native") {
		return { width: safeSourceWidth, height: safeSourceHeight };
	}

	if (aspectRatioValue === 1) {
		const baseDimension = Math.max(
			2,
			Math.floor(Math.min(safeSourceWidth, safeSourceHeight) / 2) * 2,
		);
		return { width: baseDimension, height: baseDimension };
	}

	if (aspectRatioValue > 1) {
		const baseWidth = safeSourceWidth;
		for (let width = baseWidth; width >= 100; width -= 2) {
			const height = Math.round(width / aspectRatioValue);
			if (height % 2 === 0 && Math.abs(width / height - aspectRatioValue) < 0.0001) {
				return { width, height };
			}
		}

		return {
			width: baseWidth,
			height: Math.max(2, Math.floor(baseWidth / aspectRatioValue / 2) * 2),
		};
	}

	const baseHeight = safeSourceHeight;
	for (let height = baseHeight; height >= 100; height -= 2) {
		const width = Math.round(height * aspectRatioValue);
		if (width % 2 === 0 && Math.abs(width / height - aspectRatioValue) < 0.0001) {
			return { width, height };
		}
	}

	return {
		height: baseHeight,
		width: Math.max(2, Math.floor((baseHeight * aspectRatioValue) / 2) * 2),
	};
}

export function calculateMp4ExportDimensions(
	baseWidth: number,
	baseHeight: number,
	quality: ExportQuality,
): { width: number; height: number } {
	if (quality === "source") {
		return {
			width: Math.max(2, Math.floor(baseWidth / 2) * 2),
			height: Math.max(2, Math.floor(baseHeight / 2) * 2),
		};
	}

	const qualityScale = quality === "medium" ? 0.6 : quality === "good" ? 0.75 : 0.9;
	return {
		width: Math.max(2, Math.floor((baseWidth * qualityScale) / 2) * 2),
		height: Math.max(2, Math.floor((baseHeight * qualityScale) / 2) * 2),
	};
}

export function getSourceQualityBitrate(width: number, height: number): number {
	const totalPixels = width * height;
	if (totalPixels > 2560 * 1440) {
		return 80_000_000;
	}
	if (totalPixels > 1920 * 1080) {
		return 50_000_000;
	}
	return 30_000_000;
}

export function getErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}

	if (typeof error === "string") {
		return error.replace(/^Error:\s*/i, "");
	}

	return "Something went wrong";
}

export function calculateGifOutputDimensions(
	sourceWidth: number,
	sourceHeight: number,
	preset: GifSizePreset,
	presets: typeof GIF_SIZE_PRESETS,
): { width: number; height: number } {
	if (preset === "original") {
		return { width: sourceWidth, height: sourceHeight };
	}
	const targetHeight = presets[preset].maxHeight;
	const scale = targetHeight / sourceHeight;
	return {
		width: Math.round(sourceWidth * scale),
		height: targetHeight,
	};
}
