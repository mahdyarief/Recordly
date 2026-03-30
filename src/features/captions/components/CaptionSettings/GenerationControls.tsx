import { motion } from "motion/react";
import React from "react";
import { useScopedT } from "@/shared/adapters/I18nProvider";
import { Button } from "@/shared/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/shared/components/ui/toggle-group";
import { AutoCaptionSettings } from "../../domain/entities/AutoCaptionSettings";

interface GenerationControlsProps {
	settings: AutoCaptionSettings;
	onUpdate: (partial: Partial<AutoCaptionSettings>) => void;
	whisperModelPath?: string | null;
	whisperModelDownloadStatus?: "idle" | "downloading" | "downloaded" | "error";
	whisperModelDownloadProgress?: number;
	isGeneratingCaptions?: boolean;
	onGenerateAutoCaptions?: () => void;
	onClearAutoCaptions?: () => void;
	onDownloadWhisperModel?: () => void;
	onDeleteWhisperModel?: () => void;
	timeSelection?: { startMs: number; endMs: number } | null;
	captionCount: number;
	progress: number;
}

export const GenerationControls: React.FC<GenerationControlsProps> = ({
	settings,
	onUpdate,
	whisperModelPath,
	whisperModelDownloadStatus,
	whisperModelDownloadProgress = 0,
	isGeneratingCaptions,
	onGenerateAutoCaptions,
	onClearAutoCaptions,
	onDownloadWhisperModel,
	onDeleteWhisperModel,
	timeSelection,
	captionCount,
	progress,
}) => {
	const tSettings = useScopedT("settings");

	return (
		<div className="space-y-3 pt-1">
			<div className="grid grid-cols-2 gap-2">
				{whisperModelDownloadStatus === "downloading" ? (
					<Button
						disabled
						className="h-10 w-full rounded-xl bg-white/10 px-4 text-sm font-medium text-slate-200"
					>
						{tSettings("captions.downloading", "Downloading...")}{" "}
						{Math.round(whisperModelDownloadProgress)}%
					</Button>
				) : whisperModelPath ? (
					<Button
						variant="outline"
						onClick={onDeleteWhisperModel}
						className="h-10 w-full rounded-xl border-white/10 bg-white/5 px-4 text-sm text-slate-200 hover:bg-white/10 hover:text-white"
					>
						{tSettings("captions.deleteModel", "Delete Model")}
					</Button>
				) : settings.selectedModel !== "custom" ? (
					<Button
						onClick={onDownloadWhisperModel}
						className="h-10 w-full rounded-xl bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 shadow-[0_4px_12px_rgba(var(--brand-accent-rgb),0.2)]"
					>
						{tSettings("captions.downloadModel", "Download Model")}
					</Button>
				) : (
					<div className="flex h-10 w-full items-center justify-center rounded-xl bg-white/5 px-4 text-[10px] text-slate-500 italic">
						{tSettings("captions.noLocalModel", "No local model selected")}
					</div>
				)}
				<Button
					onClick={onClearAutoCaptions}
					disabled={captionCount === 0}
					className="h-10 w-full rounded-xl border-white/10 bg-white/5 px-4 text-sm text-slate-200 hover:bg-white/10 hover:text-white disabled:opacity-50"
				>
					{tSettings("captions.clearFull", "Clear Captions")}
				</Button>
			</div>

			<div className="flex flex-col gap-1.5 px-1">
				<p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
					{tSettings("captions.generationRange", "Generation Range")}
				</p>
				<ToggleGroup
					type="single"
					value={settings?.generationRange || "full"}
					onValueChange={(val: string | null) => {
						if (val) onUpdate({ generationRange: val as "full" | "selected" });
					}}
					className="justify-start gap-1"
				>
					<ToggleGroupItem
						value="full"
						className="h-7 cursor-pointer rounded-lg border border-white/5 bg-white/5 px-2.5 text-[10px] data-[state=on]:border-primary/50 data-[state=on]:bg-primary/20 data-[state=on]:text-primary"
					>
						{tSettings("captions.fullVideo", "Full Video")}
					</ToggleGroupItem>
					<ToggleGroupItem
						value="selected"
						className="h-7 cursor-pointer rounded-lg border border-white/5 bg-white/5 px-2.5 text-[10px] data-[state=on]:border-primary/50 data-[state=on]:bg-primary/20 data-[state=on]:text-primary"
					>
						{tSettings("captions.selectedTimeline", "Selected Timeline")}{" "}
						{timeSelection
							? `(${(timeSelection.startMs / 1000).toFixed(1)}s - ${(timeSelection.endMs / 1000).toFixed(1)}s)`
							: ""}
					</ToggleGroupItem>
				</ToggleGroup>
			</div>

			<Button
				onClick={onGenerateAutoCaptions}
				disabled={isGeneratingCaptions}
				className="relative h-10 w-full overflow-hidden rounded-xl bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 disabled:bg-primary/50"
			>
				{isGeneratingCaptions && (
					<motion.div
						className="absolute inset-y-0 left-0 bg-white/20"
						initial={{ width: 0 }}
						animate={{ width: `${progress}%` }}
						transition={{ duration: 0.3 }}
					/>
				)}
				<span className="relative z-10">
					{isGeneratingCaptions
						? `${tSettings("captions.generating", "Generating...")} (${progress}%)`
						: tSettings("captions.generateAutoCaptions", "Generate Captions")}
				</span>
			</Button>

			{whisperModelDownloadStatus === "downloading" ? (
				<div className="h-2 overflow-hidden rounded-full bg-white/5">
					<div
						className="h-full rounded-full bg-primary transition-all"
						style={{ width: `${whisperModelDownloadProgress}%` }}
					/>
				</div>
			) : null}
		</div>
	);
};
