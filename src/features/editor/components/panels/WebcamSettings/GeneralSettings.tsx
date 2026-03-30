import { SliderControl } from "@/features/editor/components/SliderControl";
import type { WebcamOverlaySettings } from "@/features/editor/types";
import { DEFAULT_WEBCAM_REACT_TO_ZOOM, DEFAULT_WEBCAM_SIZE } from "@/features/editor/types";
import { useScopedT } from "@/shared/adapters/I18nProvider";
import { Switch } from "@/shared/components/ui/switch";

interface GeneralSettingsProps {
	webcam: WebcamOverlaySettings | undefined;
	updateWebcam: (updates: Partial<WebcamOverlaySettings>) => void;
}

export function GeneralSettings({ webcam, updateWebcam }: GeneralSettingsProps) {
	const tSettings = useScopedT("settings");

	return (
		<div className="flex flex-col gap-1.5">
			<div className="flex items-center justify-between rounded-lg bg-white/[0.03] px-2.5 py-1.5">
				<span className="text-[10px] text-slate-400">{tSettings("effects.show", "Show")}</span>
				<Switch
					checked={webcam?.enabled ?? false}
					onCheckedChange={(enabled) => updateWebcam({ enabled })}
					className="data-[state=checked]:bg-primary scale-75"
				/>
			</div>
			<div className="flex items-center justify-between rounded-lg bg-white/[0.03] px-2.5 py-1.5">
				<span className="text-[10px] text-slate-400">{tSettings("effects.webcamReactToZoom")}</span>
				<Switch
					checked={webcam?.reactToZoom ?? DEFAULT_WEBCAM_REACT_TO_ZOOM}
					onCheckedChange={(reactToZoom) => updateWebcam({ reactToZoom })}
					className="data-[state=checked]:bg-primary scale-75"
				/>
			</div>
			<SliderControl
				label={tSettings("effects.webcamSize")}
				value={webcam?.size ?? DEFAULT_WEBCAM_SIZE}
				defaultValue={DEFAULT_WEBCAM_SIZE}
				min={10}
				max={100}
				step={1}
				onChange={(v) => updateWebcam({ size: v })}
				formatValue={(v) => `${Math.round(v)}%`}
				parseInput={(text) => parseFloat(text.replace(/%$/, ""))}
			/>
		</div>
	);
}
