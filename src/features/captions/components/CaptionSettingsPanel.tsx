import React from "react";
import {
	AutoCaptionSettings,
	DEFAULT_AUTO_CAPTION_SETTINGS,
} from "@/features/captions/domain/entities/AutoCaptionSettings";
import { CaptionCue } from "@/features/captions/domain/entities/CaptionCue";
import { AppearanceSettings } from "./CaptionSettings/AppearanceSettings";
import { CaptionHeader } from "./CaptionSettings/CaptionHeader";
import { CueEditor } from "./CaptionSettings/CueEditor";
import { GenerationControls } from "./CaptionSettings/GenerationControls";
import { ModelSelection } from "./CaptionSettings/ModelSelection";

export interface CaptionSettingsPanelProps {
	autoCaptions: CaptionCue[];
	onAutoCaptionsChange?: (captions: CaptionCue[]) => void;
	autoCaptionProgress?: number;
	autoCaptionSettings: AutoCaptionSettings;
	onAutoCaptionSettingsChange?: (settings: AutoCaptionSettings) => void;
	whisperModelPath?: string | null;
	whisperModelDownloadStatus?: "idle" | "downloading" | "downloaded" | "error";
	whisperModelDownloadProgress?: number;
	isGeneratingCaptions?: boolean;
	onPickWhisperModel?: () => void;
	onGenerateAutoCaptions?: () => void;
	onClearAutoCaptions?: () => void;
	onDownloadWhisperModel?: () => void;
	onDeleteWhisperModel?: () => void;
	selectedCaptionId?: string | null;
	onSelectCaption?: (id: string | null) => void;
	onSeek?: (time: number) => void;
	timeSelection?: { startMs: number; endMs: number } | null;
}

export const CaptionSettingsPanel: React.FC<CaptionSettingsPanelProps> = (props) => {
	const updateSettings = (partial: Partial<AutoCaptionSettings>) => {
		props.onAutoCaptionSettingsChange?.({ ...props.autoCaptionSettings, ...partial });
	};

	return (
		<section className="flex flex-col gap-2">
			<CaptionHeader
				enabled={props.autoCaptionSettings.enabled}
				onEnabledChange={(enabled) => updateSettings({ enabled })}
				onReset={() => props.onAutoCaptionSettingsChange?.(DEFAULT_AUTO_CAPTION_SETTINGS)}
			/>

			<div className="rounded-lg bg-white/[0.03] px-2.5 py-2 space-y-4">
				<ModelSelection
					settings={props.autoCaptionSettings}
					onUpdate={updateSettings}
					whisperModelPath={props.whisperModelPath}
					onPickWhisperModel={props.onPickWhisperModel}
				/>
				<GenerationControls
					settings={props.autoCaptionSettings}
					onUpdate={updateSettings}
					whisperModelPath={props.whisperModelPath}
					whisperModelDownloadStatus={props.whisperModelDownloadStatus}
					whisperModelDownloadProgress={props.whisperModelDownloadProgress}
					isGeneratingCaptions={props.isGeneratingCaptions}
					onGenerateAutoCaptions={props.onGenerateAutoCaptions}
					onClearAutoCaptions={props.onClearAutoCaptions}
					onDownloadWhisperModel={props.onDownloadWhisperModel}
					onDeleteWhisperModel={props.onDeleteWhisperModel}
					timeSelection={props.timeSelection}
					captionCount={props.autoCaptions.length}
					progress={props.autoCaptionProgress || 0}
				/>
				{props.autoCaptions.length > 0 && (
					<CueEditor
						selectedId={props.selectedCaptionId || null}
						captions={props.autoCaptions}
						onChange={
							props.onAutoCaptionsChange ||
							(() => {
								/* no-op if handler missing */
							})
						}
						onSelect={
							props.onSelectCaption ||
							(() => {
								/* no-op if handler missing */
							})
						}
						onSeek={props.onSeek}
					/>
				)}
			</div>

			<AppearanceSettings settings={props.autoCaptionSettings} onUpdate={updateSettings} />
		</section>
	);
};
