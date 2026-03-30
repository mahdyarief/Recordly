import amongusCursorUrl from "@/assets/cursors/amongus/default.png";
import tahoeCursorUrl from "@/assets/cursors/Cursor=Default.svg";
import chooperCursorUrl from "@/assets/cursors/chooper/default.png";
import lavenderCursorUrl from "@/assets/cursors/lavender/default.png";
import minimalCursorUrl from "@/assets/cursors/Minimal Cursor.svg";
import parchedCursorUrl from "@/assets/cursors/parched/default.png";
import turtleCursorUrl from "@/assets/cursors/turtle/default.png";
import type { CursorStyle } from "@/features/editor/types";

interface CursorStylePreviewProps {
	style: CursorStyle;
	previewUrls: Partial<Record<"tahoe" | "figma" | "mono", string>>;
}

export function CursorStylePreview({ style, previewUrls }: CursorStylePreviewProps) {
	if (style === "tahoe") {
		return (
			<img
				src={previewUrls.tahoe ?? tahoeCursorUrl}
				alt=""
				className="h-7 w-7 object-contain drop-shadow-[0_8px_12px_rgba(15,23,42,0.18)]"
				draggable={false}
			/>
		);
	}

	if (style === "figma") {
		return (
			<img
				src={previewUrls.figma ?? minimalCursorUrl}
				alt=""
				className="h-7 w-7 object-contain"
				draggable={false}
			/>
		);
	}

	if (style === "dot") {
		return (
			<span className="h-[14px] w-[14px] rounded-full border-[2.5px] border-slate-900 bg-white shadow-[0_8px_12px_rgba(15,23,42,0.16)]" />
		);
	}

	if (style === "lavender") {
		return (
			<img src={lavenderCursorUrl} alt="" className="h-7 w-7 object-contain" draggable={false} />
		);
	}

	if (style === "parched") {
		return (
			<img src={parchedCursorUrl} alt="" className="h-7 w-7 object-contain" draggable={false} />
		);
	}

	if (style === "chooper") {
		return (
			<img src={chooperCursorUrl} alt="" className="h-7 w-7 object-contain" draggable={false} />
		);
	}

	if (style === "amongus") {
		return (
			<img src={amongusCursorUrl} alt="" className="h-7 w-7 object-contain" draggable={false} />
		);
	}

	if (style === "turtle") {
		return (
			<img src={turtleCursorUrl} alt="" className="h-7 w-7 object-contain" draggable={false} />
		);
	}

	return (
		<img
			src={previewUrls.mono ?? tahoeCursorUrl}
			alt=""
			className="h-7 w-7 object-contain"
			draggable={false}
		/>
	);
}
