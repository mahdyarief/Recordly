import { useTimelineContext } from "dnd-timeline";
import { useMemo } from "react";
import { cn } from "@/shared/lib/utils";

const TARGET_MARKER_COUNT = 12;

const SCALE_CANDIDATES = [
	{ intervalSeconds: 0.05, gridSeconds: 0.01 },
	{ intervalSeconds: 0.1, gridSeconds: 0.02 },
	{ intervalSeconds: 0.25, gridSeconds: 0.05 },
	{ intervalSeconds: 0.5, gridSeconds: 0.1 },
	{ intervalSeconds: 1, gridSeconds: 0.25 },
	{ intervalSeconds: 2, gridSeconds: 0.5 },
	{ intervalSeconds: 5, gridSeconds: 1 },
	{ intervalSeconds: 10, gridSeconds: 2 },
	{ intervalSeconds: 15, gridSeconds: 3 },
	{ intervalSeconds: 30, gridSeconds: 5 },
	{ intervalSeconds: 60, gridSeconds: 10 },
	{ intervalSeconds: 120, gridSeconds: 20 },
	{ intervalSeconds: 300, gridSeconds: 30 },
	{ intervalSeconds: 600, gridSeconds: 60 },
	{ intervalSeconds: 900, gridSeconds: 120 },
	{ intervalSeconds: 1800, gridSeconds: 180 },
	{ intervalSeconds: 3600, gridSeconds: 300 },
];

function calculateAxisScale(visibleRangeMs: number): { intervalMs: number; gridMs: number } {
	const visibleSeconds = visibleRangeMs / 1000;
	const candidate =
		SCALE_CANDIDATES.find((c) => {
			if (visibleSeconds <= 0) return true;
			return visibleSeconds / c.intervalSeconds <= TARGET_MARKER_COUNT;
		}) ?? SCALE_CANDIDATES[SCALE_CANDIDATES.length - 1];

	return {
		intervalMs: Math.round(candidate.intervalSeconds * 1000),
		gridMs: Math.round(candidate.gridSeconds * 1000),
	};
}

function formatTimeLabel(milliseconds: number, intervalMs: number) {
	const totalSeconds = milliseconds / 1000;
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	const fractionalDigits = intervalMs < 250 ? 2 : intervalMs < 1000 ? 1 : 0;

	if (hours > 0)
		return `${hours}:${minutes.toString().padStart(2, "0")}:${Math.floor(seconds).toString().padStart(2, "0")}`;
	if (fractionalDigits > 0) {
		const [whole, fraction] = seconds.toFixed(fractionalDigits).split(".");
		return `${minutes}:${whole.padStart(2, "0")}.${fraction}`;
	}
	return `${minutes}:${Math.floor(seconds).toString().padStart(2, "0")}`;
}

export function TimelineAxis({
	videoDurationMs,
	currentTimeMs,
}: {
	videoDurationMs: number;
	currentTimeMs: number;
}) {
	const { sidebarWidth = 0, direction, range, valueToPixels } = useTimelineContext();
	const sideProperty = direction === "rtl" ? "right" : "left";

	const { intervalMs } = useMemo(
		() => calculateAxisScale(range.end - range.start),
		[range.end, range.start],
	);

	const markers = useMemo(() => {
		if (intervalMs <= 0) return { markers: [], minorTicks: [] };
		const maxTime = videoDurationMs > 0 ? videoDurationMs : range.end;
		const visibleStart = Math.max(0, Math.min(range.start, maxTime));
		const visibleEnd = Math.min(range.end, maxTime);
		const markerTimes = new Set<number>();
		const firstMarker = Math.ceil(visibleStart / intervalMs) * intervalMs;

		for (let time = firstMarker; time <= maxTime; time += intervalMs) {
			if (time >= visibleStart && time <= visibleEnd) markerTimes.add(Math.round(time));
		}
		if (visibleStart <= maxTime) markerTimes.add(Math.round(visibleStart));
		if (videoDurationMs > 0) markerTimes.add(Math.round(videoDurationMs));

		const sorted = Array.from(markerTimes)
			.filter((t) => t <= maxTime)
			.sort((a, b) => a - b);
		const minorTicks = [];
		const minorInterval = intervalMs / 5;
		for (let time = firstMarker; time <= maxTime; time += minorInterval) {
			if (time >= visibleStart && time <= visibleEnd && Math.abs(time % intervalMs) >= 1)
				minorTicks.push(time);
		}
		return {
			markers: sorted.map((t) => ({ time: t, label: formatTimeLabel(t, intervalMs) })),
			minorTicks,
		};
	}, [intervalMs, range.end, range.start, videoDurationMs]);

	return (
		<div
			className="h-8 bg-[#161619] border-b border-white/10 relative overflow-hidden select-none cursor-pointer"
			style={{ [sideProperty === "right" ? "marginRight" : "marginLeft"]: `${sidebarWidth}px` }}
			onMouseDown={(e) => (e.currentTarget.parentElement as any)?.__handleMouseDown?.(e)}
			onClick={(e) => (e.currentTarget.parentElement as any)?.__handleTimelineClick?.(e)}
		>
			{markers.minorTicks.map((time) => (
				<div
					key={`minor-${time}`}
					className="absolute bottom-0 h-1 w-[1px] bg-white/5"
					style={{ [sideProperty]: `${valueToPixels(time - range.start)}px` }}
				/>
			))}
			{markers.markers.map((marker) => (
				<div
					key={marker.time}
					className="absolute bottom-0 h-full flex flex-row items-end"
					style={{ [sideProperty]: `${valueToPixels(marker.time - range.start)}px` }}
				>
					<div className="flex flex-col items-center pb-1">
						<div className="h-2 w-[1px] bg-white/20 mb-1" />
						<span
							className={cn(
								"text-[10px] font-medium tabular-nums tracking-tight",
								marker.time === currentTimeMs ? "text-[#2563EB]" : "text-slate-500",
							)}
						>
							{marker.label}
						</span>
					</div>
				</div>
			))}
		</div>
	);
}
