import { Music, Plus } from "lucide-react";
import Item from "../Item";
import KeyframeMarkers from "../KeyframeMarkers";

interface TimelineTracksProps {
	props: any;
}

export function TimelineTracks({ props }: TimelineTracksProps) {
	const {
		keyframes,
		selectedKeyframeId,
		setSelectedKeyframeId,
		handleKeyframeMove,
		videoDuration,
		timelineItems,
		handleSelectZoom,
		handleSelectTrim,
		handleSelectAnnotation,
		handleSelectSpeed,
		handleSelectAudio,
		handleSelectCaption,
		handleAddAudio,
		selectedZoomId,
		selectedTrimId,
		selectedAnnotationId,
		selectedSpeedId,
		selectedAudioId,
		selectedCaptionId,
	} = props;

	const filterItemsByRow = (rowId: string) =>
		timelineItems.filter((item: any) => item.rowId === rowId);

	return (
		<div className="flex-1 min-h-0 relative overflow-y-auto custom-scrollbar">
			<div className="flex flex-col min-w-max pb-8">
				{/* Specific Track Rows */}
				<div className="h-12 border-b border-white/5 flex items-center px-4 gap-4">
					<div className="w-24 text-[10px] font-bold text-slate-500 uppercase">Zooms</div>
					<div className="flex-1 h-8 bg-white/5 rounded border border-white/10 relative">
						{filterItemsByRow("row-zoom").map((item: any) => (
							<Item
								key={item.id}
								id={item.id}
								span={item.span}
								rowId={item.rowId}
								variant="zoom"
								isSelected={item.id === selectedZoomId}
								onSelect={() => handleSelectZoom(item.id)}
							>
								{item.label}
							</Item>
						))}
					</div>
				</div>

				<div className="h-12 border-b border-white/5 flex items-center px-4 gap-4">
					<div className="w-24 text-[10px] font-bold text-slate-500 uppercase">Trims</div>
					<div className="flex-1 h-8 bg-white/5 rounded border border-white/10 relative">
						{filterItemsByRow("row-trim").map((item: any) => (
							<Item
								key={item.id}
								id={item.id}
								span={item.span}
								rowId={item.rowId}
								variant="trim"
								isSelected={item.id === selectedTrimId}
								onSelect={() => handleSelectTrim(item.id)}
							>
								{item.label}
							</Item>
						))}
					</div>
				</div>

				<div className="h-12 border-b border-white/5 flex items-center px-4 gap-4">
					<div className="w-24 text-[10px] font-bold text-slate-500 uppercase">Keyframes</div>
					<div className="flex-1 h-8 bg-white/5 rounded border border-white/10 relative">
						<KeyframeMarkers
							keyframes={keyframes}
							selectedKeyframeId={selectedKeyframeId}
							setSelectedKeyframeId={setSelectedKeyframeId}
							onKeyframeMove={handleKeyframeMove}
							videoDurationMs={videoDuration * 1000}
							timelineRef={{ current: null } as any}
						/>
					</div>
				</div>

				<div className="h-12 border-b border-white/5 flex items-center px-4 gap-4">
					<div className="w-24 text-[10px] font-bold text-slate-500 uppercase">Annotations</div>
					<div className="flex-1 h-8 bg-white/5 rounded border border-white/10 relative">
						{filterItemsByRow("row-annotation").map((item: any) => (
							<Item
								key={item.id}
								id={item.id}
								span={item.span}
								rowId={item.rowId}
								variant="annotation"
								isSelected={item.id === selectedAnnotationId}
								onSelect={() => handleSelectAnnotation(item.id)}
							>
								{item.label}
							</Item>
						))}
					</div>
				</div>

				<div className="h-12 border-b border-white/5 flex items-center px-4 gap-4">
					<div className="w-24 text-[10px] font-bold text-slate-500 uppercase">Speed</div>
					<div className="flex-1 h-8 bg-white/5 rounded border border-white/10 relative">
						{filterItemsByRow("row-speed").map((item: any) => (
							<Item
								key={item.id}
								id={item.id}
								span={item.span}
								rowId={item.rowId}
								variant="speed"
								isSelected={item.id === selectedSpeedId}
								onSelect={() => handleSelectSpeed(item.id)}
							>
								{item.label}
							</Item>
						))}
					</div>
				</div>

				<div className="border-b border-white/5">
					<div className="h-12 flex items-center px-4 gap-4 bg-white/[0.02]">
						<div className="w-24 flex items-center gap-2">
							<Music className="w-3 h-3 text-slate-400" />
							<span className="text-[10px] font-bold text-slate-500 uppercase">Audio</span>
						</div>
						<div className="flex-1 flex items-center h-8 relative">
							{filterItemsByRow("row-audio").map((item: any) => (
								<Item
									key={item.id}
									id={item.id}
									span={item.span}
									rowId={item.rowId}
									variant="audio"
									isSelected={item.id === selectedAudioId}
									onSelect={() => handleSelectAudio(item.id)}
								>
									{item.label}
								</Item>
							))}
							<button
								onClick={() => {
									const input = document.createElement("input");
									input.type = "file";
									input.accept = "audio/*";
									input.onchange = (e) => {
										const file = (e.target as HTMLInputElement).files?.[0];
										if (file) handleAddAudio(file);
									};
									input.click();
								}}
								className="ml-auto w-6 h-6 rounded bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
							>
								<Plus className="w-3 h-3 text-slate-400" />
							</button>
						</div>
					</div>
				</div>

				<div className="h-12 border-b border-white/5 flex items-center px-4 gap-4">
					<div className="w-24 text-[10px] font-bold text-slate-500 uppercase">Captions</div>
					<div className="flex-1 h-8 bg-white/5 rounded border border-white/10 relative">
						{filterItemsByRow("row-caption").map((item: any) => (
							<Item
								key={item.id}
								id={item.id}
								span={item.span}
								rowId={item.rowId}
								variant="caption"
								isSelected={item.id === selectedCaptionId}
								onSelect={() => handleSelectCaption(item.id)}
							>
								{item.label}
							</Item>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
