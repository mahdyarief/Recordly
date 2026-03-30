import type { WebcamOverlaySettings, WebcamPositionPreset } from "@/features/editor/types";
import { useI18n, useScopedT } from "@/shared/adapters/I18nProvider";
import { AppearanceSettings } from "./WebcamSettings/AppearanceSettings";
import { FootageSettings } from "./WebcamSettings/FootageSettings";
import { GeneralSettings } from "./WebcamSettings/GeneralSettings";
import { PositionSettings } from "./WebcamSettings/PositionSettings";

function SectionHeader({ title, onReset }: { title: string; onReset: () => void }) {
	const { t } = useI18n();
	return (
		<div className="flex items-center justify-between gap-3 mb-1">
			<p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{title}</p>
			<button
				type="button"
				onClick={onReset}
				className="text-[10px] font-semibold text-primary transition-all hover:opacity-80 hover:underline"
			>
				{t("common.actions.reset", "Reset")}
			</button>
		</div>
	);
}

interface WebcamSettingsPanelProps {
	webcam: WebcamOverlaySettings | undefined;
	updateWebcam: (updates: Partial<WebcamOverlaySettings>) => void;
	applyWebcamPositionPreset: (preset: WebcamPositionPreset) => void;
	onUploadWebcam: (() => void) | undefined;
	onClearWebcam: (() => void) | undefined;
	resetWebcamSection: () => void;
}

/**
 * Panel for configuring webcam overlay settings.
 * Decomposed into specialized components for better maintainability.
 */
export function WebcamSettingsPanel({
	webcam,
	updateWebcam,
	applyWebcamPositionPreset,
	onUploadWebcam,
	onClearWebcam,
	resetWebcamSection,
}: WebcamSettingsPanelProps) {
	const tSettings = useScopedT("settings");

	return (
		<section className="flex flex-col gap-3 group">
			<SectionHeader title={tSettings("sections.webcam", "Webcam")} onReset={resetWebcamSection} />

			<div className="flex flex-col gap-4">
				<GeneralSettings webcam={webcam} updateWebcam={updateWebcam} />

				<PositionSettings
					webcam={webcam}
					updateWebcam={updateWebcam}
					applyWebcamPositionPreset={applyWebcamPositionPreset}
				/>

				<AppearanceSettings webcam={webcam} updateWebcam={updateWebcam} />

				<FootageSettings
					webcam={webcam}
					onUploadWebcam={onUploadWebcam}
					onClearWebcam={onClearWebcam}
				/>
			</div>
		</section>
	);
}
