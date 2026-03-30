import { ChevronDown, Clock, Crop, Layout, MousePointer2, Scissors } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { ASPECT_RATIOS, getAspectRatioLabel } from "@/shared/lib/aspectRatio";
import { cn } from "@/shared/lib/utils";

export function TimelineToolbar({ props }: { props: any }) {
	const {
		timelineMode,
		onTimelineModeChange,
		timeSelection,
		onOpenCropEditor,
		aspectRatio,
		onAspectRatioChange,
		customAspectWidth,
		setCustomAspectWidth,
		customAspectHeight,
		setCustomAspectHeight,
		applyCustomAspectRatio,
		isCropped,
	} = props;

	return (
		<div className="flex items-center justify-between px-4 py-2.5 bg-[#121214] border-b border-white/5 select-none">
			<div className="flex items-center gap-1.5 p-1 bg-white/[0.03] rounded-xl border border-white/5">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => onTimelineModeChange("select")}
					className={cn(
						"h-8 px-3 rounded-lg transition-all duration-200 gap-2",
						timelineMode === "select"
							? "bg-[#2563EB] text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]"
							: "text-slate-400 hover:text-slate-200 hover:bg-white/5",
					)}
				>
					<MousePointer2 className="w-3.5 h-3.5" />
					<span className="text-xs font-semibold uppercase tracking-wider">Select</span>
				</Button>
				<Button
					variant="ghost"
					size="sm"
					onClick={() => onTimelineModeChange("cut")}
					className={cn(
						"h-8 px-3 rounded-lg transition-all duration-200 gap-2",
						timelineMode === "cut"
							? "bg-[#EF4444] text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]"
							: "text-slate-400 hover:text-slate-200 hover:bg-white/5",
					)}
				>
					<Scissors className="w-3.5 h-3.5" />
					<span className="text-xs font-semibold uppercase tracking-wider">Cut</span>
				</Button>
			</div>

			<div className="flex items-center gap-4">
				<div className="h-4 w-px bg-white/5" />

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="sm"
							className="h-8 pr-2 pl-3 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-slate-300 gap-2"
						>
							<div className="flex items-center gap-2">
								<Layout className="w-3.5 h-3.5 text-primary/70" />
								<span className="text-xs font-bold tracking-tight">
									{getAspectRatioLabel(aspectRatio)}
								</span>
							</div>
							<ChevronDown className="w-3 h-3 opacity-40" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="end"
						className="w-56 bg-[#09090b] border-white/10 p-1.5 shadow-2xl rounded-xl"
					>
						<div className="px-2 py-1.5 mb-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
							Aspect Ratio
						</div>
						{ASPECT_RATIOS.map((ratio) => (
							<DropdownMenuItem
								key={ratio}
								onClick={() => onAspectRatioChange(ratio)}
								className={cn(
									"flex items-center justify-between px-2 py-2 rounded-lg cursor-pointer transition-colors",
									aspectRatio === ratio
										? "bg-primary/10 text-primary"
										: "text-slate-400 hover:bg-white/5 hover:text-slate-200",
								)}
							>
								<div className="flex items-center gap-2.5">
									<Layout className="w-3.5 h-3.5" />
									<span className="text-xs font-medium">{ratio}</span>
								</div>
								{aspectRatio === ratio && (
									<div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(37,99,235,0.8)]" />
								)}
							</DropdownMenuItem>
						))}

						<div className="my-1.5 h-px bg-white/5" />

						<div className="px-2 py-2 space-y-2.5">
							<div className="flex items-center gap-2">
								<div className="flex-1 space-y-1">
									<label className="text-[10px] text-slate-500 font-bold uppercase pl-0.5">
										Width
									</label>
									<input
										type="number"
										value={customAspectWidth}
										onChange={(e) => setCustomAspectWidth(Number(e.target.value))}
										className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-primary/50 transition-colors"
										placeholder="W"
									/>
								</div>
								<div className="pt-4 text-slate-600">×</div>
								<div className="flex-1 space-y-1">
									<label className="text-[10px] text-slate-500 font-bold uppercase pl-0.5">
										Height
									</label>
									<input
										type="number"
										value={customAspectHeight}
										onChange={(e) => setCustomAspectHeight(Number(e.target.value))}
										className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-primary/50 transition-colors"
										placeholder="H"
									/>
								</div>
							</div>
							<Button
								size="sm"
								onClick={applyCustomAspectRatio}
								className="w-full h-7 text-[10px] uppercase font-bold tracking-wider rounded-md"
							>
								Apply Custom
							</Button>
						</div>
					</DropdownMenuContent>
				</DropdownMenu>

				<Button
					variant="ghost"
					size="sm"
					onClick={onOpenCropEditor}
					className={cn(
						"h-8 px-3 rounded-lg transition-all border gap-2",
						isCropped
							? "bg-primary/10 border-primary/30 text-primary shadow-[0_0_15px_rgba(37,99,235,0.15)] hover:bg-primary/20"
							: "bg-white/[0.03] border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10",
					)}
				>
					<Crop className="w-3.5 h-3.5" />
					<span className="text-xs font-bold tracking-tight">Crop</span>
				</Button>

				{timeSelection && (
					<>
						<div className="h-4 w-px bg-white/5" />
						<div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 rounded-xl">
							<Clock className="w-3 h-3 text-primary" />
							<span className="text-[10px] font-bold text-primary tracking-tight">
								{((timeSelection.endMs - timeSelection.startMs) / 1000).toFixed(2)}s selected
							</span>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
