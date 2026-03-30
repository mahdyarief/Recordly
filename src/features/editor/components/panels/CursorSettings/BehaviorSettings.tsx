import { SliderControl } from "@/features/editor/components/SliderControl";
import {
	fromCursorSwaySliderValue,
	toCursorSwaySliderValue,
} from "@/features/editor/components/VideoEditor/videoPlayback/cursorSway";
import {
	DEFAULT_CURSOR_CLICK_BOUNCE,
	DEFAULT_CURSOR_CLICK_BOUNCE_DURATION,
	DEFAULT_CURSOR_MOTION_BLUR,
	DEFAULT_CURSOR_SIZE,
	DEFAULT_CURSOR_SMOOTHING,
	DEFAULT_CURSOR_SWAY,
} from "@/features/editor/types";
import { useScopedT } from "@/shared/adapters/I18nProvider";

interface BehaviorSettingsProps {
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
}

export function BehaviorSettings({
	cursorSize,
	onCursorSizeChange,
	cursorSmoothing,
	onCursorSmoothingChange,
	cursorMotionBlur,
	onCursorMotionBlurChange,
	cursorClickBounce,
	onCursorClickBounceChange,
	cursorClickBounceDuration,
	onCursorClickBounceDurationChange,
	cursorSway,
	onCursorSwayChange,
}: BehaviorSettingsProps) {
	const tSettings = useScopedT("settings");

	return (
		<div className="flex flex-col gap-1.5 pt-1">
			<SliderControl
				label={tSettings("effects.cursorSize")}
				value={cursorSize}
				defaultValue={DEFAULT_CURSOR_SIZE}
				min={0.5}
				max={10}
				step={0.05}
				onChange={(v) => onCursorSizeChange?.(v)}
				formatValue={(v) => `${v.toFixed(2)}×`}
				parseInput={(text) => parseFloat(text.replace(/×$/, ""))}
			/>
			<SliderControl
				label={tSettings("effects.cursorSmoothing")}
				value={cursorSmoothing}
				defaultValue={DEFAULT_CURSOR_SMOOTHING}
				min={0}
				max={2}
				step={0.01}
				onChange={(v) => onCursorSmoothingChange?.(v)}
				formatValue={(v) => (v <= 0 ? tSettings("effects.off") : v.toFixed(2))}
				parseInput={(text) => parseFloat(text)}
			/>
			<SliderControl
				label={tSettings("effects.cursorMotionBlur")}
				value={cursorMotionBlur}
				defaultValue={DEFAULT_CURSOR_MOTION_BLUR}
				min={0}
				max={2}
				step={0.05}
				onChange={(v) => onCursorMotionBlurChange?.(v)}
				formatValue={(v) => `${v.toFixed(2)}×`}
				parseInput={(text) => parseFloat(text.replace(/×$/, ""))}
			/>
			<SliderControl
				label={tSettings("effects.cursorClickBounce")}
				value={cursorClickBounce}
				defaultValue={DEFAULT_CURSOR_CLICK_BOUNCE}
				min={0}
				max={5}
				step={0.05}
				onChange={(v) => onCursorClickBounceChange?.(v)}
				formatValue={(v) => `${v.toFixed(2)}×`}
				parseInput={(text) => parseFloat(text.replace(/×$/, ""))}
			/>
			<SliderControl
				label={tSettings("effects.cursorClickBounceDuration", "Bounce Speed")}
				value={cursorClickBounceDuration}
				defaultValue={DEFAULT_CURSOR_CLICK_BOUNCE_DURATION}
				min={60}
				max={500}
				step={5}
				onChange={(v) => onCursorClickBounceDurationChange?.(v)}
				formatValue={(v) => `${Math.round(v)} ms`}
				parseInput={(text) => parseFloat(text.replace(/ms$/i, "").trim())}
			/>
			<SliderControl
				label={tSettings("effects.cursorSway")}
				value={toCursorSwaySliderValue(cursorSway)}
				defaultValue={toCursorSwaySliderValue(DEFAULT_CURSOR_SWAY)}
				min={0}
				max={toCursorSwaySliderValue(2)}
				step={toCursorSwaySliderValue(0.05)}
				onChange={(v) => onCursorSwayChange?.(fromCursorSwaySliderValue(v))}
				formatValue={(v) => (v <= 0 ? tSettings("effects.off") : `${v.toFixed(2)}×`)}
				parseInput={(text) => {
					const normalized = text.trim().toLowerCase();
					if (normalized === "off") return 0;
					return parseFloat(text.replace(/×$/, ""));
				}}
			/>
		</div>
	);
}
