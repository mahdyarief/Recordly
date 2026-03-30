import { Trash2 } from "lucide-react";
import { ZoomDepth } from "@/features/editor/types";
import { useScopedT } from "@/shared/adapters/I18nProvider";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";

export const ZOOM_DEPTH_OPTIONS: Array<{ depth: ZoomDepth; label: string }> = [
	{ depth: 1, label: "1.25×" },
	{ depth: 2, label: "1.5×" },
	{ depth: 3, label: "1.8×" },
	{ depth: 4, label: "2.2×" },
	{ depth: 5, label: "3.5×" },
	{ depth: 6, label: "5×" },
];

interface ZoomLevelSettingsSectionProps {
	zoomEnabled: boolean;
	selectedZoomDepth: ZoomDepth | null;
	onZoomDepthChange: (depth: ZoomDepth) => void;
	onZoomDelete: (id: string) => void;
	selectedZoomId: string | null;
	// Optional trim delete integration
	trimEnabled?: boolean;
	selectedTrimId?: string | null;
	onTrimDelete?: (id: string) => void;
}

export function ZoomLevelSettingsSection({
	zoomEnabled,
	selectedZoomDepth,
	onZoomDepthChange,
	onZoomDelete,
	selectedZoomId,
	trimEnabled,
	selectedTrimId,
	onTrimDelete,
}: ZoomLevelSettingsSectionProps) {
	const tSettings = useScopedT("settings");

	return (
		<div className="mb-4">
			<div className="mb-3 flex items-center justify-between">
				<span className="text-sm font-medium text-slate-200">{tSettings("zoom.level")}</span>
				<div className="flex items-center gap-2">
					{zoomEnabled && selectedZoomDepth && (
						<span className="rounded-full bg-[#2563EB]/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[#2563EB]">
							{ZOOM_DEPTH_OPTIONS.find((o) => o.depth === selectedZoomDepth)?.label}
						</span>
					)}
				</div>
			</div>
			<div className="grid grid-cols-6 gap-1.5">
				{ZOOM_DEPTH_OPTIONS.map((option) => {
					const isActive = selectedZoomDepth === option.depth;
					return (
						<Button
							key={option.depth}
							type="button"
							disabled={!zoomEnabled}
							onClick={() => onZoomDepthChange?.(option.depth)}
							className={cn(
								"h-auto w-full rounded-lg border px-1 py-2 text-center shadow-sm transition-all duration-200 ease-out",
								zoomEnabled ? "opacity-100 cursor-pointer" : "opacity-40 cursor-not-allowed",
								isActive
									? "border-[#2563EB] bg-[#2563EB] text-white"
									: "border-white/5 bg-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10 hover:text-slate-200",
							)}
						>
							<span className="text-xs font-semibold">{option.label}</span>
						</Button>
					);
				})}
			</div>
			{!zoomEnabled && (
				<p className="mt-2 text-center text-[10px] text-slate-500">
					{tSettings("zoom.selectRegion")}
				</p>
			)}
			{zoomEnabled && (
				<Button
					onClick={() => selectedZoomId && onZoomDelete?.(selectedZoomId)}
					variant="destructive"
					size="sm"
					className="mt-2 h-8 w-full gap-2 border border-red-500/20 bg-red-500/10 text-xs text-red-400 transition-all hover:border-red-500/30 hover:bg-red-500/20"
				>
					<Trash2 className="h-3 w-3" />
					{tSettings("zoom.deleteZoom")}
				</Button>
			)}
			{trimEnabled && (
				<Button
					onClick={() => selectedTrimId && onTrimDelete?.(selectedTrimId)}
					variant="destructive"
					size="sm"
					className="mt-2 h-8 w-full gap-2 border border-red-500/20 bg-red-500/10 text-xs text-red-400 transition-all hover:border-red-500/30 hover:bg-red-500/20"
				>
					<Trash2 className="h-3 w-3" />
					{tSettings("trim.deleteRegion")}
				</Button>
			)}
		</div>
	);
}
