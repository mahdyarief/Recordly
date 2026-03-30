import type { CursorStyle } from "@/features/editor/types";
import { useScopedT } from "@/shared/adapters/I18nProvider";
import { ToggleGroup, ToggleGroupItem } from "@/shared/components/ui/toggle-group";
import { cn } from "@/shared/lib/utils";
import { CursorStylePreview } from "../../CursorStylePreview";
import { CURSOR_STYLE_OPTIONS } from "./constants";

interface StyleSelectorProps {
	cursorStyle: CursorStyle;
	onCursorStyleChange: (style: CursorStyle) => void;
	cursorPreviewUrls: Partial<Record<"tahoe" | "figma" | "mono", string>>;
}

export function StyleSelector({
	cursorStyle,
	onCursorStyleChange,
	cursorPreviewUrls,
}: StyleSelectorProps) {
	const tSettings = useScopedT("settings");

	return (
		<div className="space-y-1.5">
			<ToggleGroup
				type="single"
				value={cursorStyle}
				onValueChange={(value) => {
					if (value) {
						onCursorStyleChange?.(value as CursorStyle);
					}
				}}
				className="grid grid-cols-4 gap-2"
				aria-label={tSettings("effects.cursorStyle", "Cursor Style")}
			>
				{CURSOR_STYLE_OPTIONS.map((option) => (
					<ToggleGroupItem
						key={option.value}
						value={option.value}
						title={option.label}
						aria-label={option.label}
						className={cn(
							"group aspect-square h-auto min-w-0 rounded-[10px] border border-white/10 bg-white/[0.03] p-3 text-left text-slate-200 shadow-none transition-all hover:border-white/20 hover:bg-white/[0.06]",
							"data-[state=on]:border-primary/70 data-[state=on]:bg-primary/12 data-[state=on]:text-white",
						)}
					>
						<div className="flex h-full flex-col items-center justify-between gap-3">
							<div className="flex min-h-0 flex-1 items-center justify-center rounded-lg px-2 py-1.5">
								<CursorStylePreview style={option.value} previewUrls={cursorPreviewUrls} />
							</div>
						</div>
					</ToggleGroupItem>
				))}
			</ToggleGroup>
		</div>
	);
}
