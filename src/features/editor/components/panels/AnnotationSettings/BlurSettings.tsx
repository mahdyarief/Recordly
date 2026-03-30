import { type AnnotationRegion } from "@/features/editor/types";
import { useScopedT } from "@/shared/adapters/I18nProvider";
import { Slider } from "@/shared/components/ui/slider";

interface BlurSettingsProps {
	annotation: AnnotationRegion;
	onBlurIntensityChange: (intensity: number) => void;
}

export function BlurSettings({ annotation, onBlurIntensityChange }: BlurSettingsProps) {
	const t = useScopedT("editor");

	return (
		<div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 shadow-sm">
			<div className="flex items-center justify-between mb-4">
				<label className="text-xs font-semibold text-slate-200 uppercase tracking-widest opacity-80">
					{t("annotations.blurIntensity", "Intensity")}
				</label>
				<span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
					{annotation.blurIntensity ?? 12}px
				</span>
			</div>
			<Slider
				value={[annotation.blurIntensity ?? 12]}
				onValueChange={([value]) => {
					onBlurIntensityChange(value);
				}}
				min={1}
				max={100}
				step={1}
				className="w-full"
			/>
			<p className="text-[10px] text-slate-500 mt-4 leading-relaxed font-medium">
				{t(
					"annotations.blurDescription",
					"Obscure sensitive information by blurring the underlying video content.",
				)}
			</p>
		</div>
	);
}
