import { SliderControl } from "@/features/editor/components/SliderControl";
import { useI18n, useScopedT } from "@/shared/adapters/I18nProvider";
import { Switch } from "@/shared/components/ui/switch";

interface FrameSettingsProps {
	shadowIntensity: number;
	initialShadowIntensity: number;
	onShadowChange: ((intensity: number) => void) | undefined;
	borderRadius: number;
	initialBorderRadius: number;
	onBorderRadiusChange: ((radius: number) => void) | undefined;
	padding: number;
	initialPadding: number;
	onPaddingChange: ((padding: number) => void) | undefined;
	removeBackgroundEnabled: boolean;
	handleRemoveBackgroundToggle: (checked: boolean) => void;
	resetFrameSection: () => void;
}

export function FrameSettings({
	shadowIntensity,
	initialShadowIntensity,
	onShadowChange,
	borderRadius,
	initialBorderRadius,
	onBorderRadiusChange,
	padding,
	initialPadding,
	onPaddingChange,
	removeBackgroundEnabled,
	handleRemoveBackgroundToggle,
	resetFrameSection,
}: FrameSettingsProps) {
	const tSettings = useScopedT("settings");
	const { t } = useI18n();

	return (
		<section className="flex flex-col gap-2">
			<div className="flex items-center justify-between gap-3">
				<p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
					{tSettings("sections.frame", "Frame")}
				</p>
				<button
					type="button"
					onClick={resetFrameSection}
					className="text-[10px] text-primary transition-opacity hover:opacity-80"
				>
					{t("common.actions.reset", "Reset")}
				</button>
			</div>
			<div className="flex flex-col gap-1.5">
				<SliderControl
					label={tSettings("effects.shadow")}
					value={shadowIntensity}
					defaultValue={initialShadowIntensity}
					min={0}
					max={1}
					step={0.01}
					onChange={(v) => onShadowChange?.(v)}
					formatValue={(v) => `${Math.round(v * 100)}%`}
					parseInput={(text) => parseFloat(text.replace(/%$/, "")) / 100}
				/>
				<SliderControl
					label={tSettings("effects.radius", "Radius")}
					value={borderRadius}
					defaultValue={initialBorderRadius}
					min={0}
					max={50}
					step={0.5}
					onChange={(v) => onBorderRadiusChange?.(v)}
					formatValue={(v) => `${v}px`}
					parseInput={(text) => parseFloat(text.replace(/px$/, ""))}
				/>
				<SliderControl
					label={tSettings("effects.padding")}
					value={padding}
					defaultValue={initialPadding}
					min={0}
					max={100}
					step={1}
					onChange={(v) => onPaddingChange?.(v)}
					formatValue={(v) => `${v}%`}
					parseInput={(text) => parseFloat(text.replace(/%$/, ""))}
				/>
				<div className="flex items-center justify-between rounded-lg bg-white/[0.03] px-2.5 py-1.5">
					<span className="text-[10px] text-slate-400">
						{tSettings("effects.removeBackground")}
					</span>
					<Switch
						checked={removeBackgroundEnabled}
						onCheckedChange={handleRemoveBackgroundToggle}
						className="scale-75"
					/>
				</div>
			</div>
		</section>
	);
}
