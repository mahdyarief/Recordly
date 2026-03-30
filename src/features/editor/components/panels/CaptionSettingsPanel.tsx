import { AppearanceSettings } from "@/features/captions/components/CaptionSettings/AppearanceSettings";
import { CaptionHeader } from "@/features/captions/components/CaptionSettings/CaptionHeader";
import { GenerationControls } from "@/features/captions/components/CaptionSettings/GenerationControls";
import { ModelSelection } from "@/features/captions/components/CaptionSettings/ModelSelection";
import { useScopedT } from "@/shared/adapters/I18nProvider";

interface CaptionSettingsPanelProps {
	props: any;
}

export function CaptionSettingsPanel({ props }: CaptionSettingsPanelProps) {
	const {
		autoCaptions = [],
		autoCaptionSettings,
		onAutoCaptionSettingsChange,
		whisperModelPath,
		whisperModelDownloadStatus,
		whisperModelDownloadProgress,
		isGeneratingCaptions,
		autoCaptionProgress,
		onGenerateAutoCaptions,
		onClearAutoCaptions,
		onDownloadWhisperModel,
		onDeleteWhisperModel,
		onPickWhisperModel,
		timeSelection,
	} = props;

	const tSettings = useScopedT("settings");

	return (
		<div className="flex flex-col gap-6 animate-in fade-in slide-in-from-top-1">
			<CaptionHeader
				enabled={autoCaptionSettings?.enabled ?? false}
				onEnabledChange={(enabled) =>
					onAutoCaptionSettingsChange?.({ ...autoCaptionSettings, enabled })
				}
				onReset={() => onAutoCaptionSettingsChange?.({})}
			/>

			{autoCaptionSettings?.enabled && (
				<div className="space-y-6">
					<section className="space-y-3">
						<ModelSelection
							settings={autoCaptionSettings}
							onUpdate={(partial) =>
								onAutoCaptionSettingsChange?.({ ...autoCaptionSettings, ...partial })
							}
							whisperModelPath={whisperModelPath}
							onPickWhisperModel={onPickWhisperModel}
						/>
						<GenerationControls
							settings={autoCaptionSettings}
							onUpdate={(partial) =>
								onAutoCaptionSettingsChange?.({ ...autoCaptionSettings, ...partial })
							}
							whisperModelPath={whisperModelPath}
							whisperModelDownloadStatus={whisperModelDownloadStatus}
							whisperModelDownloadProgress={whisperModelDownloadProgress}
							isGeneratingCaptions={isGeneratingCaptions}
							onGenerateAutoCaptions={onGenerateAutoCaptions}
							onClearAutoCaptions={onClearAutoCaptions}
							onDownloadWhisperModel={onDownloadWhisperModel}
							onDeleteWhisperModel={onDeleteWhisperModel}
							timeSelection={timeSelection}
							captionCount={autoCaptions.length}
							progress={autoCaptionProgress || 0}
						/>
					</section>

					<section className="space-y-3 pt-2 border-t border-white/5">
						<p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
							{tSettings("captions.appearance", "Appearance")}
						</p>
						<AppearanceSettings
							settings={autoCaptionSettings}
							onUpdate={(partial) =>
								onAutoCaptionSettingsChange?.({ ...autoCaptionSettings, ...partial })
							}
						/>
					</section>
				</div>
			)}
		</div>
	);
}
