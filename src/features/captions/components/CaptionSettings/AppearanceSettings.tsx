import React from "react";
import { SliderControl } from "@/features/editor/components/SliderControl";
import { useScopedT } from "@/shared/adapters/I18nProvider";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";
import {
	AutoCaptionAnimation,
	AutoCaptionSettings,
	DEFAULT_AUTO_CAPTION_SETTINGS,
} from "../../domain/entities/AutoCaptionSettings";

const CAPTION_ANIMATION_OPTIONS: Array<{ value: AutoCaptionAnimation; label: string }> = [
	{ value: "none", label: "Off" },
	{ value: "fade", label: "Fade" },
	{ value: "rise", label: "Rise" },
	{ value: "pop", label: "Pop" },
];

interface AppearanceSettingsProps {
	settings: AutoCaptionSettings;
	onUpdate: (partial: Partial<AutoCaptionSettings>) => void;
}

export const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({ settings, onUpdate }) => {
	const tSettings = useScopedT("settings");

	return (
		<div className="flex flex-col gap-1.5">
			<div className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.03] px-2.5 py-2">
				<div className="text-[10px] text-slate-400">
					{tSettings("captions.animation", "Animation")}
				</div>
				<Select
					value={settings.animationStyle}
					onValueChange={(value) => onUpdate({ animationStyle: value as AutoCaptionAnimation })}
				>
					<SelectTrigger className="h-9 w-[160px] rounded-xl border-white/10 bg-white/5 text-sm text-slate-200 hover:bg-white/10">
						<SelectValue />
					</SelectTrigger>
					<SelectContent className="border-white/10 bg-[#1a1a1f] text-slate-200">
						{CAPTION_ANIMATION_OPTIONS.map((o) => (
							<SelectItem key={o.value} value={o.value}>
								{o.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<label className="flex items-center justify-between rounded-lg bg-white/[0.03] px-2.5 py-2">
				<span className="text-[10px] text-slate-400">
					{tSettings("captions.textColor", "Text color")}
				</span>
				<input
					type="color"
					value={settings.textColor}
					onChange={(e) => onUpdate({ textColor: e.target.value })}
					className="h-7 w-10 rounded border border-white/10 bg-transparent"
				/>
			</label>

			<div className="mb-1 text-sm font-medium text-slate-200 mt-2">
				{tSettings("captions.fontSettings", "Font Settings")}
			</div>

			<SliderControl
				label={tSettings("captions.fontSize", "Font size")}
				value={settings.fontSize}
				defaultValue={DEFAULT_AUTO_CAPTION_SETTINGS.fontSize}
				min={16}
				max={72}
				step={1}
				onChange={(value) => onUpdate({ fontSize: value })}
				formatValue={(v) => `${Math.round(v)}px`}
				parseInput={(t) => parseFloat(t.replace(/px$/, ""))}
			/>
			<SliderControl
				label={tSettings("captions.rowCount", "Rows")}
				value={settings.maxRows}
				defaultValue={DEFAULT_AUTO_CAPTION_SETTINGS.maxRows}
				min={1}
				max={4}
				step={1}
				onChange={(v) => onUpdate({ maxRows: Math.round(v) })}
				formatValue={(v) => `${Math.round(v)}`}
				parseInput={(t) => parseFloat(t)}
			/>
			<SliderControl
				label={tSettings("captions.bottomOffset", "Bottom offset")}
				value={settings.bottomOffset}
				defaultValue={DEFAULT_AUTO_CAPTION_SETTINGS.bottomOffset}
				min={0}
				max={30}
				step={1}
				onChange={(v) => onUpdate({ bottomOffset: v })}
				formatValue={(v) => `${Math.round(v)}%`}
				parseInput={(t) => parseFloat(t.replace(/%$/, ""))}
			/>
			<SliderControl
				label={tSettings("captions.maxWidth", "Max width")}
				value={settings.maxWidth}
				defaultValue={DEFAULT_AUTO_CAPTION_SETTINGS.maxWidth}
				min={40}
				max={95}
				step={1}
				onChange={(v) => onUpdate({ maxWidth: v })}
				formatValue={(v) => `${Math.round(v)}%`}
				parseInput={(t) => parseFloat(t.replace(/%$/, ""))}
			/>
			<SliderControl
				label={tSettings("captions.boxRadius", "Box radius")}
				value={settings.boxRadius}
				defaultValue={DEFAULT_AUTO_CAPTION_SETTINGS.boxRadius}
				min={0}
				max={40}
				step={0.5}
				onChange={(v) => onUpdate({ boxRadius: v })}
				formatValue={(v) => `${Number.isInteger(v) ? v.toFixed(0) : v.toFixed(1)}px`}
				parseInput={(t) => parseFloat(t.replace(/px$/, ""))}
			/>
			<SliderControl
				label={tSettings("captions.backgroundOpacity", "Background opacity")}
				value={settings.backgroundOpacity}
				defaultValue={DEFAULT_AUTO_CAPTION_SETTINGS.backgroundOpacity}
				min={0}
				max={1}
				step={0.01}
				onChange={(v) => onUpdate({ backgroundOpacity: v })}
				formatValue={(v) => `${Math.round(v * 100)}%`}
				parseInput={(t) => parseFloat(t.replace(/%$/, "")) / 100}
			/>
		</div>
	);
};
