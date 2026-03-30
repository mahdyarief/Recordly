import { Trash2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import type { AudioRegion } from "@/features/editor/types";
import { Button } from "@/shared/components/ui/button";
import { generateWaveform } from "@/shared/lib/audioWaveform";
import { cn } from "@/shared/lib/utils";
import { AudioHeader } from "./AudioSettings/AudioHeader";
import { FadeControls } from "./AudioSettings/FadeControls";
import { VolumeControls } from "./AudioSettings/VolumeControls";

interface AudioSettingsPanelProps {
	audio: AudioRegion;
	onVolumeChange: (volume: number) => void;
	onMutedChange: (muted: boolean) => void;
	onSoloedChange: (soloed: boolean) => void;
	onFadeInMsChange: (ms: number) => void;
	onFadeOutMsChange: (ms: number) => void;
	onDelete: () => void;
}

export function AudioSettingsPanel({
	audio,
	onVolumeChange,
	onMutedChange,
	onSoloedChange,
	onFadeInMsChange,
	onFadeOutMsChange,
	onDelete,
}: AudioSettingsPanelProps) {
	const [waveform, setWaveform] = useState<number[] | null>(null);
	const isMaster = audio.id === "master";

	useEffect(() => {
		let active = true;
		if (audio.audioPath) {
			generateWaveform(audio.audioPath, 120).then((result) => {
				if (active) setWaveform(result);
			});
		}
		return () => {
			active = false;
		};
	}, [audio.audioPath]);

	const handleMuteToggle = () => {
		const nextMuted = !audio.muted;
		onMutedChange(nextMuted);
		if (nextMuted && audio.soloed) onSoloedChange(false);
	};

	const handleSoloToggle = () => {
		const nextSoloed = !audio.soloed;
		onSoloedChange(nextSoloed);
		if (nextSoloed && audio.muted) onMutedChange(false);
	};

	return (
		<section className="flex flex-col gap-4 pb-4">
			<AudioHeader audio={audio} />

			{!isMaster && waveform && (
				<div className="h-10 bg-white/[0.03] rounded-xl border border-white/5 flex items-center overflow-hidden relative shadow-inner">
					<div className="absolute inset-0 flex items-center pointer-events-none px-2">
						<svg
							width="100%"
							height="100%"
							viewBox={`0 0 ${waveform.length} 100`}
							preserveAspectRatio="none"
							className="text-primary opacity-40 group-hover:opacity-60 transition-opacity"
						>
							{waveform.map((peak, i) => (
								<rect
									key={i}
									x={i}
									y={50 - peak * 50}
									width={0.8}
									height={peak * 100}
									fill="currentColor"
									rx={0.2}
								/>
							))}
						</svg>
					</div>
				</div>
			)}

			{!isMaster && (
				<div className="grid grid-cols-2 gap-3 pb-1">
					<button
						type="button"
						onClick={handleMuteToggle}
						className={cn(
							"flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[11px] font-bold uppercase tracking-widest transition-all shadow-sm",
							audio.muted
								? "bg-red-500/15 border-red-500/30 text-red-500"
								: "bg-white/[0.03] border-white/5 text-slate-500 hover:bg-white/[0.08] hover:text-slate-300",
						)}
					>
						<VolumeX className="w-3.5 h-3.5" />
						<span>Mute</span>
					</button>
					<button
						type="button"
						onClick={handleSoloToggle}
						className={cn(
							"flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[11px] font-bold uppercase tracking-widest transition-all shadow-sm",
							audio.soloed
								? "bg-amber-500/15 border-amber-500/30 text-amber-500"
								: "bg-white/[0.03] border-white/5 text-slate-500 hover:bg-white/[0.08] hover:text-slate-300",
						)}
					>
						<span className="w-3.5 text-center">S</span>
						<span>Solo</span>
					</button>
				</div>
			)}

			<VolumeControls audio={audio} onVolumeChange={onVolumeChange} />

			{!isMaster && (
				<FadeControls
					audio={audio}
					onFadeInMsChange={onFadeInMsChange}
					onFadeOutMsChange={onFadeOutMsChange}
				/>
			)}

			{!isMaster && (
				<Button
					onClick={onDelete}
					variant="ghost"
					size="sm"
					className="w-full gap-2 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all mt-1 duration-300"
				>
					<Trash2 className="w-3.5 h-3.5" />
					Remove Audio Stream
				</Button>
			)}
		</section>
	);
}
