import React from "react";
import { useScopedT } from "@/shared/adapters/I18nProvider";
import { Button } from "@/shared/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";
import {
	AutoCaptionSettings,
	CAPTION_LANGUAGE_OPTIONS,
	WHISPER_MODEL_OPTIONS,
	WhisperModel,
} from "../../domain/entities/AutoCaptionSettings";

interface ModelSelectionProps {
	settings: AutoCaptionSettings;
	onUpdate: (partial: Partial<AutoCaptionSettings>) => void;
	whisperModelPath?: string | null;
	onPickWhisperModel?: () => void;
}

export const ModelSelection: React.FC<ModelSelectionProps> = ({
	settings,
	onUpdate,
	whisperModelPath,
	onPickWhisperModel,
}) => {
	const tSettings = useScopedT("settings");

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between gap-3 px-1">
				<div className="text-sm font-medium text-slate-200">
					{tSettings("captions.language", "Language")}
				</div>
				<Select
					value={settings.language || "auto"}
					onValueChange={(language: string) => onUpdate({ language })}
				>
					<SelectTrigger className="h-10 w-[180px] rounded-xl border-white/10 bg-white/5 text-sm text-slate-200 hover:bg-white/10">
						<SelectValue />
					</SelectTrigger>
					<SelectContent className="border-white/10 bg-popover text-slate-200">
						<SelectItem value="auto">{tSettings("captions.autoDetect", "Auto Detect")}</SelectItem>
						{CAPTION_LANGUAGE_OPTIONS.slice(1).map((o) => (
							<SelectItem key={o.value} value={o.value}>
								{o.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="flex items-center justify-between gap-3 px-1">
				<div className="text-sm font-medium text-slate-200">
					{tSettings("captions.model", "Model")}
				</div>
				<Select
					value={settings.selectedModel || "small"}
					onValueChange={(value: string) => onUpdate({ selectedModel: value as WhisperModel })}
				>
					<SelectTrigger className="h-10 w-[180px] rounded-xl border-white/10 bg-white/5 text-sm text-slate-200 hover:bg-white/10">
						<SelectValue />
					</SelectTrigger>
					<SelectContent className="border-white/10 bg-popover text-slate-200">
						{WHISPER_MODEL_OPTIONS.map((o) => (
							<SelectItem key={o.value} value={o.value}>
								<div className="flex items-center justify-between w-full gap-4">
									<span>{o.label}</span>
									<span className="text-[10px] text-slate-500">{o.size}</span>
								</div>
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{settings.selectedModel === "custom" && (
				<div className="px-1">
					<Button
						type="button"
						onClick={onPickWhisperModel}
						className="h-10 w-full rounded-xl border-white/10 bg-white/5 px-4 text-sm text-slate-200 hover:bg-white/10 hover:text-white"
					>
						{tSettings("captions.selectModel", "Select Model")}
					</Button>
					{whisperModelPath && (
						<p className="mt-1 truncate px-1 text-[10px] text-slate-500 italic">
							{whisperModelPath.split(/[\\/]/).pop()}
						</p>
					)}
				</div>
			)}
		</div>
	);
};
