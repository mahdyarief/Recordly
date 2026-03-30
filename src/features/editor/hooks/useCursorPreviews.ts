import { useEffect, useState } from "react";
import tahoeCursorUrl from "@/assets/cursors/Cursor=Default.svg";
import minimalCursorUrl from "@/assets/cursors/Minimal Cursor.svg";
import {
	UPLOADED_CURSOR_SAMPLE_SIZE,
	uploadedCursorAssets,
} from "../components/VideoEditor/videoPlayback/uploadedCursorAssets";
import { createInvertedPreview, createTrimmedSvgPreview } from "../lib/cursorMath";

export function useCursorPreviews() {
	const [cursorPreviewUrls, setCursorPreviewUrls] = useState<
		Partial<Record<"tahoe" | "figma" | "mono", string>>
	>({});

	useEffect(() => {
		let cancelled = false;

		void (async () => {
			try {
				const tahoeAsset = uploadedCursorAssets.arrow;
				const tahoePreview = tahoeAsset
					? await createTrimmedSvgPreview(
							tahoeAsset.url,
							UPLOADED_CURSOR_SAMPLE_SIZE,
							tahoeAsset.trim,
						)
					: tahoeCursorUrl;
				const minimalPreview = await createTrimmedSvgPreview(minimalCursorUrl, 512);
				const invertedPreview = await createInvertedPreview(tahoePreview);

				if (!cancelled) {
					setCursorPreviewUrls({
						tahoe: tahoePreview,
						figma: minimalPreview,
						mono: invertedPreview,
					});
				}
			} catch {
				if (!cancelled) {
					setCursorPreviewUrls({
						tahoe: tahoeCursorUrl,
						figma: minimalCursorUrl,
						mono: tahoeCursorUrl,
					});
				}
			}
		})();

		return () => {
			cancelled = true;
		};
	}, []);

	return cursorPreviewUrls;
}
