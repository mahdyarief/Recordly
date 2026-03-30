import { SliderControl } from "@/features/editor/components/SliderControl";
import {
	DEFAULT_WEBCAM_CORNER_RADIUS,
	DEFAULT_WEBCAM_SHADOW,
	type WebcamOverlaySettings,
} from "@/features/editor/types";
import { useScopedT } from "@/shared/adapters/I18nProvider";

interface AppearanceSettingsProps {
	webcam: WebcamOverlaySettings | undefined;
	updateWebcam: (updates: Partial<WebcamOverlaySettings>) => void;
}

export function AppearanceSettings({ webcam, updateWebcam }: AppearanceSettingsProps) {
	const tSettings = useScopedT("settings");

	return (
		<div className="flex flex-col gap-1.5 pt-1.5">
			<SliderControl
				label={tSettings("effects.webcamRoundness")}
				value={webcam?.cornerRadius ?? DEFAULT_WEBCAM_CORNER_RADIUS}
				defaultValue={DEFAULT_WEBCAM_CORNER_RADIUS}
				min={0}
				max={160}
				step={1}
				onChange={(v) => updateWebcam({ cornerRadius: v })}
				formatValue={(v) => `${Math.round(v)}px`}
				parseInput={(text) => parseFloat(text.replace(/px$/, ""))}
			/>
			<SliderControl
				label={tSettings("effects.webcamShadow")}
				value={webcam?.shadow ?? DEFAULT_WEBCAM_SHADOW}
				defaultValue={DEFAULT_WEBCAM_SHADOW}
				min={0}
				max={1}
				step={0.01}
				onChange={(v) => updateWebcam({ shadow: v })}
				formatValue={(v) => `${Math.round(v * 100)}%`}
				parseInput={(text) => parseFloat(text.replace(/%$/, "")) / 100}
			/>
		</div>
	);
}
