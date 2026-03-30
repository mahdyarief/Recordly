import { Volume2 } from "lucide-react";
import { type AudioRegion } from "@/features/editor/types";
import { Slider } from "@/shared/components/ui/slider";
import { cn } from "@/shared/lib/utils";

interface VolumeControlsProps {
	audio: AudioRegion;
	onVolumeChange: (volume: number) => void;
}

export function VolumeControls({ audio, onVolumeChange }: VolumeControlsProps) {
	const volumePercentage = Math.round(audio.volume * 100);

	return (
		<div className="rounded-xl bg-white/[0.03] border border-white/5 px-3 py-3 space-y-4 hover:bg-white/[0.05] transition-all duration-300">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0 opacity-80">
						<Volume2 className="w-3.5 h-3.5" />
					</div>
					<span className="text-[11px] font-semibold text-slate-300 uppercase tracking-widest opacity-80">
						Volume
					</span>
				</div>
				<span
					className={cn(
						"text-[11px] tabular-nums font-bold px-2 py-0.5 rounded-md border",
						volumePercentage > 100
							? "text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-[0_0_8px_rgba(251,191,36,0.1)]"
							: "text-primary bg-primary/10 border-primary/20",
					)}
				>
					{volumePercentage}%
				</span>
			</div>

			<div className="px-1">
				<Slider
					value={[audio.volume * 100]}
					onValueChange={([value]) => onVolumeChange(value / 100)}
					min={0}
					max={200}
					step={1}
					className="w-full"
				/>
			</div>

			{volumePercentage > 100 && (
				<div className="flex items-start gap-2 bg-amber-500/5 p-2 rounded-lg border border-amber-500/10 anim-fade-in">
					<p className="text-[10px] text-amber-500/80 leading-relaxed font-medium italic">
						Note: Amplification above 100% may cause audible clipping in some clips.
					</p>
				</div>
			)}
		</div>
	);
}
