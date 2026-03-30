import { Music } from "lucide-react";
import { type AudioRegion } from "@/features/editor/types";

interface AudioHeaderProps {
	audio: AudioRegion;
}

export function AudioHeader({ audio }: AudioHeaderProps) {
	const isMaster = audio.id === "master";

	return (
		<div className="flex items-center justify-between gap-3 pb-3 border-b border-white/5 animate-in fade-in slide-in-from-top-2 duration-500">
			<div className="flex items-center gap-3">
				<div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0 shadow-[0_0_12px_rgba(var(--brand-accent-rgb),0.15)] ring-1 ring-primary/20">
					<Music className="w-4 h-4" />
				</div>
				<div className="min-w-0">
					<p className="text-[13px] font-bold text-slate-100 leading-none tracking-tight">
						{isMaster ? "Original Sound" : "Audio Region"}
					</p>
					{!isMaster && (
						<p className="text-[10px] text-slate-500 mt-1.5 truncate max-w-[180px] font-medium italic opacity-70">
							{audio.audioPath.split(/[\\/]/).pop()}
						</p>
					)}
					{isMaster && (
						<p className="text-[10px] text-slate-500 mt-1.5 font-medium opacity-70">
							Balance and gain for the primary video stream
						</p>
					)}
				</div>
			</div>
			<div className="flex flex-col items-end gap-1">
				<span className="text-[9px] uppercase tracking-widest font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20 shadow-[0_2px_8px_rgba(var(--brand-accent-rgb),0.1)]">
					Active
				</span>
			</div>
		</div>
	);
}
