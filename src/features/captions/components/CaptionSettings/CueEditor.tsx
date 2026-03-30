import { MessageSquare, Trash2 } from "lucide-react";
import React from "react";
import { CaptionCue } from "@/features/captions/domain/entities/CaptionCue";

interface CueEditorProps {
	selectedId: string | null;
	captions: CaptionCue[];
	onChange: (captions: CaptionCue[]) => void;
	onSelect: (id: string | null) => void;
	onSeek?: (time: number) => void;
}

export const CueEditor: React.FC<CueEditorProps> = ({
	selectedId,
	captions,
	onChange,
	onSelect,
	onSeek,
}) => {
	const index = captions.findIndex((c) => c.id === selectedId);
	const cue = captions[index];

	return (
		<div className="mt-4 flex flex-col gap-2">
			<div className="flex items-center justify-between px-1">
				<span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
					{selectedId ? "Edit Selected Cue" : "Select Cue on Timeline"}
				</span>
			</div>

			<div className="rounded-xl border border-white/5 bg-black/20 p-2">
				{cue ? (
					<div className="flex flex-col gap-2">
						<div className="flex items-center justify-between">
							<button
								type="button"
								onClick={() => onSeek?.(cue.startMs / 1000)}
								className="text-[10px] font-medium text-slate-500 hover:text-[#2563EB]"
							>
								{(cue.startMs / 1000).toFixed(2)}s – {(cue.endMs / 1000).toFixed(2)}s
							</button>
							<button
								type="button"
								onClick={() => {
									const next = [...captions];
									next.splice(index, 1);
									onChange(next);
									onSelect(null);
								}}
								className="text-slate-500 hover:text-red-400 p-1"
							>
								<Trash2 className="h-4 w-4" />
							</button>
						</div>
						<textarea
							value={cue.text}
							onChange={(e) => {
								const next = [...captions];
								next[index] = { ...cue, text: e.target.value };
								onChange(next);
							}}
							rows={2}
							autoFocus
							className="w-full resize-none rounded-lg border-none bg-white/5 p-2 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
						/>
					</div>
				) : (
					<div className="flex flex-col items-center justify-center py-6 px-4 text-center">
						<div className="mb-2 rounded-full bg-white/5 p-2.5">
							<MessageSquare className="h-4 w-4 text-slate-600" />
						</div>
						<p className="text-[11px] text-slate-500 leading-relaxed max-w-[160px]">
							Select a caption block on the timeline to edit its text and timing
						</p>
					</div>
				)}
			</div>
		</div>
	);
};
