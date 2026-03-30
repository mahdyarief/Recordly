import { cn } from "@/shared/lib/utils";

interface SliderControlProps {
	label: string;
	value: number;
	defaultValue: number;
	min: number;
	max: number;
	step: number;
	onChange: (value: number) => void;
	formatValue: (value: number) => string;
	parseInput: (text: string) => number | null;
}

export function SliderControl({
	label,
	value,
	defaultValue: _defaultValue,
	min,
	max,
	step,
	onChange,
	formatValue,
	parseInput: _parseInput,
}: SliderControlProps) {
	const pct = Math.min(100, Math.max(0, ((value - min) / (max - min || 1)) * 100));

	return (
		<div className="relative flex h-10 w-full select-none items-center overflow-hidden rounded-xl bg-black/60 px-1.5 transition-all hover:bg-black/70 group border border-white/[0.03] hover:border-white/[0.08]">
			<div
				className="absolute inset-y-[3px] left-[3px] right-auto rounded-[10px] bg-white/[0.08] shadow-[0_4px_10px_0_rgba(0,0,0,0.18)] transition-all duration-300 ease-out"
				style={{
					width: pct > 0 ? `max(calc(${pct}% - 6px), 2.1rem)` : 0,
				}}
			/>
			<div
				className={cn(
					"pointer-events-none absolute bottom-[18%] top-[18%] z-10 w-[2px] rounded-full transition-all duration-300 ease-out",
					"bg-white/90 shadow-[0_0_12px_rgba(var(--brand-accent-rgb),0.4)]",
				)}
				style={{
					left: `calc(${pct}% - 8px)`,
					opacity: pct > 0 ? 1 : 0,
				}}
			/>
			<span className="pointer-events-none relative z-10 flex-1 pl-3 text-[12px] font-medium text-slate-300 group-hover:text-slate-200 transition-colors">
				{label}
			</span>
			<span className="pointer-events-none relative z-10 pr-3 text-[12px] font-semibold tabular-nums text-primary brightness-125 transition-all">
				{formatValue(value)}
			</span>
			<input
				type="range"
				min={min}
				max={max}
				step={step}
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
				className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0 z-20"
			/>
		</div>
	);
}
