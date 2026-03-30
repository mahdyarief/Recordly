import { SliderControl } from "@/features/editor/components/SliderControl";
import {
	DEFAULT_WEBCAM_MARGIN,
	DEFAULT_WEBCAM_POSITION_PRESET,
	DEFAULT_WEBCAM_POSITION_X,
	DEFAULT_WEBCAM_POSITION_Y,
	type WebcamOverlaySettings,
	type WebcamPositionPreset,
} from "@/features/editor/types";
import { useScopedT } from "@/shared/adapters/I18nProvider";
import { Button } from "@/shared/components/ui/button";
import { Switch } from "@/shared/components/ui/switch";
import { cn } from "@/shared/lib/utils";

const WEBCAM_POSITION_PRESETS: Array<{
	preset: Exclude<WebcamPositionPreset, "custom">;
	label: string;
}> = [
	{ preset: "top-left", label: "↖" },
	{ preset: "top-center", label: "↑" },
	{ preset: "top-right", label: "↗" },
	{ preset: "center-left", label: "←" },
	{ preset: "center", label: "•" },
	{ preset: "center-right", label: "→" },
	{ preset: "bottom-left", label: "↙" },
	{ preset: "bottom-center", label: "↓" },
	{ preset: "bottom-right", label: "↘" },
];

interface PositionSettingsProps {
	webcam: WebcamOverlaySettings | undefined;
	updateWebcam: (updates: Partial<WebcamOverlaySettings>) => void;
	applyWebcamPositionPreset: (preset: WebcamPositionPreset) => void;
}

export function PositionSettings({
	webcam,
	updateWebcam,
	applyWebcamPositionPreset,
}: PositionSettingsProps) {
	const tSettings = useScopedT("settings");
	const webcamPositionPreset = webcam?.positionPreset ?? DEFAULT_WEBCAM_POSITION_PRESET;
	const webcamPositionX = webcam?.positionX ?? DEFAULT_WEBCAM_POSITION_X;
	const webcamPositionY = webcam?.positionY ?? DEFAULT_WEBCAM_POSITION_Y;

	return (
		<div className="flex flex-col gap-1.5">
			<div className="rounded-lg bg-white/[0.03] px-2.5 py-2 transition-all hover:bg-white/[0.05]">
				<div className="mb-2 text-[10px] text-slate-400 font-medium tracking-wide">
					{tSettings("effects.webcamPosition", "Position")}
				</div>
				<div className="grid grid-cols-3 gap-1.5">
					{WEBCAM_POSITION_PRESETS.map((option) => {
						const isActive = webcamPositionPreset === option.preset;
						return (
							<Button
								key={option.preset}
								type="button"
								onClick={() => applyWebcamPositionPreset(option.preset)}
								className={cn(
									"h-8 rounded-lg border px-0 text-sm font-semibold transition-all shadow-sm",
									isActive
										? "border-primary bg-primary text-white"
										: "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10",
								)}
							>
								{option.label}
							</Button>
						);
					})}
				</div>
				<div className="mt-2 flex items-center justify-between rounded-lg bg-black/10 px-2.5 py-1.5 border border-white/5">
					<span className="text-[10px] text-slate-400">
						{tSettings("effects.webcamCustomPosition", "Custom position")}
					</span>
					<Switch
						checked={webcamPositionPreset === "custom"}
						onCheckedChange={(checked) =>
							applyWebcamPositionPreset(checked ? "custom" : DEFAULT_WEBCAM_POSITION_PRESET)
						}
						className="data-[state=checked]:bg-primary scale-75"
					/>
				</div>
			</div>

			{webcamPositionPreset === "custom" && (
				<div className="flex flex-col gap-1 anim-fade-in">
					<SliderControl
						label={tSettings("effects.webcamHorizontal", "Horizontal")}
						value={webcamPositionX * 100}
						defaultValue={DEFAULT_WEBCAM_POSITION_X * 100}
						min={0}
						max={100}
						step={1}
						onChange={(v) => updateWebcam({ positionPreset: "custom", positionX: v / 100 })}
						formatValue={(v) => `${Math.round(v)}%`}
						parseInput={(text) => parseFloat(text.replace(/%$/, ""))}
					/>
					<SliderControl
						label={tSettings("effects.webcamVertical", "Vertical")}
						value={webcamPositionY * 100}
						defaultValue={DEFAULT_WEBCAM_POSITION_Y * 100}
						min={0}
						max={100}
						step={1}
						onChange={(v) => updateWebcam({ positionPreset: "custom", positionY: v / 100 })}
						formatValue={(v) => `${Math.round(v)}%`}
						parseInput={(text) => parseFloat(text.replace(/%$/, ""))}
					/>
				</div>
			)}

			<SliderControl
				label={tSettings("effects.webcamMargin", "Margin")}
				value={webcam?.margin ?? DEFAULT_WEBCAM_MARGIN}
				defaultValue={DEFAULT_WEBCAM_MARGIN}
				min={0}
				max={96}
				step={1}
				onChange={(v) => updateWebcam({ margin: v })}
				formatValue={(v) => `${Math.round(v)}px`}
				parseInput={(text) => parseFloat(text.replace(/px$/, ""))}
			/>
		</div>
	);
}
