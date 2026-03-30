import { TutorialHelp } from "../../../TutorialHelp";

interface TimelineFooterProps {
	panLabel: string;
	zoomLabel: string;
}

export function TimelineFooter({ panLabel, zoomLabel }: TimelineFooterProps) {
	return (
		<div className="px-3 py-1 bg-[#121214] border-t border-white/5 flex items-center justify-between">
			<div className="flex items-center gap-4 text-[10px] text-slate-500 font-medium tracking-tight">
				<div className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
					<kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded-md text-primary font-sans shadow-inner">
						{panLabel}
					</kbd>
					<span className="uppercase">Pan</span>
				</div>
				<div className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
					<kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded-md text-primary font-sans shadow-inner">
						{zoomLabel}
					</kbd>
					<span className="uppercase">Zoom</span>
				</div>
			</div>
			<TutorialHelp />
		</div>
	);
}
