import { type AudioRegion } from "@/features/editor/types";
import { Slider } from "@/shared/components/ui/slider";

interface FadeControlsProps {
	audio: AudioRegion;
	onFadeInMsChange: (ms: number) => void;
	onFadeOutMsChange: (ms: number) => void;
}

function formatFadeTime(ms: number): string {
	if (!ms || ms === 0) return "Off";
	if (ms < 1000) return `${ms}ms`;
	return `${(ms / 1000).toFixed(1)}s`;
}

export function FadeControls({ audio, onFadeInMsChange, onFadeOutMsChange }: FadeControlsProps) {
	const clipDurationMs = audio.endMs - audio.startMs;
	const maxFadeMs = Math.max(0, Math.floor(clipDurationMs / 2));

	return (
		<div className="rounded-xl bg-white/[0.03] border border-white/5 px-3 py-3 space-y-4 hover:bg-white/[0.05] transition-all duration-300">
			<span className="text-[11px] font-semibold text-slate-300 uppercase tracking-widest opacity-80 pl-1">
				Fades
			</span>

			<div className="grid grid-cols-2 gap-x-6 gap-y-4 pt-1">
				<div className="space-y-3">
					<div className="flex items-center justify-between px-1">
						<span className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">
							Fade In
						</span>
						<span className="text-[10px] tabular-nums text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
							{formatFadeTime(audio.fadeInMs || 0)}
						</span>
					</div>
					<Slider
						value={[audio.fadeInMs || 0]}
						onValueChange={([v]) => onFadeInMsChange(v)}
						min={0}
						max={maxFadeMs}
						step={50}
						className="w-full"
					/>
				</div>

				<div className="space-y-3 border-l border-white/10 pl-4">
					<div className="flex items-center justify-between px-1">
						<span className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">
							Fade Out
						</span>
						<span className="text-[10px] tabular-nums text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
							{formatFadeTime(audio.fadeOutMs || 0)}
						</span>
					</div>
					<Slider
						value={[audio.fadeOutMs || 0]}
						onValueChange={([v]) => onFadeOutMsChange(v)}
						min={0}
						max={maxFadeMs}
						step={50}
						className="w-full"
					/>
				</div>
			</div>
		</div>
	);
}
