import { Trash2 } from "lucide-react";
import { PlaybackSpeed, SPEED_OPTIONS } from "@/features/editor/types";
import { useScopedT } from "@/shared/adapters/I18nProvider";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";

interface SpeedSettingsSectionProps {
	selectedSpeedId: string | null;
	selectedSpeedValue: PlaybackSpeed | null;
	onSpeedChange: (speed: PlaybackSpeed) => void;
	onSpeedDelete: (id: string) => void;
}

export function SpeedSettingsSection({
	selectedSpeedId,
	selectedSpeedValue,
	onSpeedChange,
	onSpeedDelete,
}: SpeedSettingsSectionProps) {
	const tSettings = useScopedT("settings");

	return (
		<div className="mt-4">
			<div className="mb-3 flex items-center justify-between">
				<span className="text-sm font-medium text-slate-200">
					{tSettings("speed.playbackSpeed")}
				</span>
				{selectedSpeedId && selectedSpeedValue && (
					<span className="rounded-full bg-[#d97706]/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[#d97706]">
						{SPEED_OPTIONS.find((o) => o.speed === selectedSpeedValue)?.label ??
							`${selectedSpeedValue}×`}
					</span>
				)}
			</div>
			<div className="grid grid-cols-7 gap-1.5">
				{SPEED_OPTIONS.map((option) => {
					const isActive = selectedSpeedValue === option.speed;
					return (
						<Button
							key={option.speed}
							type="button"
							disabled={!selectedSpeedId}
							onClick={() => onSpeedChange?.(option.speed)}
							className={cn(
								"h-auto w-full rounded-lg border px-1 py-2 text-center shadow-sm transition-all duration-200 ease-out",
								selectedSpeedId ? "opacity-100 cursor-pointer" : "opacity-40 cursor-not-allowed",
								isActive
									? "border-[#d97706] bg-[#d97706] text-white"
									: "border-white/5 bg-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10 hover:text-slate-200",
							)}
						>
							<span className="text-xs font-semibold">{option.label}</span>
						</Button>
					);
				})}
			</div>
			{!selectedSpeedId && (
				<p className="mt-2 text-center text-[10px] text-slate-500">
					{tSettings("speed.selectRegion")}
				</p>
			)}
			{selectedSpeedId && (
				<Button
					onClick={() => selectedSpeedId && onSpeedDelete?.(selectedSpeedId)}
					variant="destructive"
					size="sm"
					className="mt-2 h-8 w-full gap-2 border border-red-500/20 bg-red-500/10 text-xs text-red-400 transition-all hover:border-red-500/30 hover:bg-red-500/20"
				>
					<Trash2 className="h-3 w-3" />
					{tSettings("speed.deleteRegion")}
				</Button>
			)}
		</div>
	);
}
