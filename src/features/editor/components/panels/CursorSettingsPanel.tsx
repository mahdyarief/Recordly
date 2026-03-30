import React from "react";
import type { CursorStyle } from "@/features/editor/types";
import { useI18n, useScopedT } from "@/shared/adapters/I18nProvider";
import { Switch } from "@/shared/components/ui/switch";
import { BehaviorSettings } from "./CursorSettings/BehaviorSettings";
import { StyleSelector } from "./CursorSettings/StyleSelector";

function SectionLabel({ children }: { children: React.ReactNode }) {
	return (
		<p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{children}</p>
	);
}

interface CursorSettingsPanelProps {
	showCursor: boolean;
	onShowCursorChange: (enabled: boolean) => void;
	loopCursor: boolean;
	onLoopCursorChange: (enabled: boolean) => void;
	cursorStyle: CursorStyle;
	onCursorStyleChange: (style: CursorStyle) => void;
	cursorSize: number;
	onCursorSizeChange: (size: number) => void;
	cursorSmoothing: number;
	onCursorSmoothingChange: (smoothing: number) => void;
	cursorMotionBlur: number;
	onCursorMotionBlurChange: (amount: number) => void;
	cursorClickBounce: number;
	onCursorClickBounceChange: (amount: number) => void;
	cursorClickBounceDuration: number;
	onCursorClickBounceDurationChange: (duration: number) => void;
	cursorSway: number;
	onCursorSwayChange: (amount: number) => void;
	resetCursorSection: () => void;
	cursorPreviewUrls: Partial<Record<"tahoe" | "figma" | "mono", string>>;
}

export function CursorSettingsPanel(props: CursorSettingsPanelProps) {
	const tSettings = useScopedT("settings");
	const { t } = useI18n();

	return (
		<section className="flex flex-col gap-3">
			<div className="flex items-center justify-between gap-3 px-0.5">
				<div className="flex items-center gap-3">
					<SectionLabel>{tSettings("sections.cursor", "Cursor")}</SectionLabel>
					<button
						type="button"
						onClick={props.resetCursorSection}
						className="text-[10px] text-primary transition-opacity hover:opacity-80"
					>
						{t("common.actions.reset", "Reset")}
					</button>
				</div>
				<div className="flex items-center gap-3">
					<label className="flex items-center gap-2 text-[10px] text-slate-400">
						<span>{tSettings("effects.showCursor")}</span>
						<Switch
							checked={props.showCursor}
							onCheckedChange={props.onShowCursorChange}
							className="data-[state=checked]:bg-primary scale-75"
						/>
					</label>
					<label className="flex items-center gap-2 text-[10px] text-slate-400">
						<span>{tSettings("effects.loopCursor")}</span>
						<Switch
							checked={props.loopCursor}
							onCheckedChange={props.onLoopCursorChange}
							className="data-[state=checked]:bg-primary scale-75"
						/>
					</label>
				</div>
			</div>

			<div className="flex flex-col gap-4 rounded-xl bg-white/[0.02] p-2.5">
				<StyleSelector
					cursorStyle={props.cursorStyle}
					onCursorStyleChange={props.onCursorStyleChange}
					cursorPreviewUrls={props.cursorPreviewUrls}
				/>

				<BehaviorSettings
					cursorSize={props.cursorSize}
					onCursorSizeChange={props.onCursorSizeChange}
					cursorSmoothing={props.cursorSmoothing}
					onCursorSmoothingChange={props.onCursorSmoothingChange}
					cursorMotionBlur={props.cursorMotionBlur}
					onCursorMotionBlurChange={props.onCursorMotionBlurChange}
					cursorClickBounce={props.cursorClickBounce}
					onCursorClickBounceChange={props.onCursorClickBounceChange}
					cursorClickBounceDuration={props.cursorClickBounceDuration}
					onCursorClickBounceDurationChange={props.onCursorClickBounceDurationChange}
					cursorSway={props.cursorSway}
					onCursorSwayChange={props.onCursorSwayChange}
				/>
			</div>
		</section>
	);
}
