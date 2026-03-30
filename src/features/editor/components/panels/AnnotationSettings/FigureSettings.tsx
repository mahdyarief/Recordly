import Block from "@uiw/react-color-block";
import { ChevronDown } from "lucide-react";
import { type AnnotationRegion, type FigureData } from "@/features/editor/types";
import { useScopedT } from "@/shared/adapters/I18nProvider";
import { Button } from "@/shared/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { Slider } from "@/shared/components/ui/slider";
import { cn } from "@/shared/lib/utils";
import { getArrowComponent } from "../ArrowSvgs";
import { ARROW_DIRECTIONS, COLOR_PALETTE } from "./constants";

interface FigureSettingsProps {
	annotation: AnnotationRegion;
	onFigureDataChange: (figureData: FigureData) => void;
}

export function FigureSettings({ annotation, onFigureDataChange }: FigureSettingsProps) {
	const t = useScopedT("editor");

	return (
		<div className="space-y-4">
			<div>
				<label className="text-xs font-medium text-slate-200 mb-3 block">
					{t("annotations.arrowDirection")}
				</label>
				<div className="grid grid-cols-4 gap-2">
					{ARROW_DIRECTIONS.map((direction) => {
						const ArrowComponent = getArrowComponent(direction);
						const isActive = annotation.figureData?.arrowDirection === direction;
						return (
							<button
								key={direction}
								type="button"
								onClick={() => {
									const newFigureData: FigureData = {
										...annotation.figureData!,
										arrowDirection: direction,
									};
									onFigureDataChange(newFigureData);
								}}
								className={cn(
									"h-16 rounded-lg border flex items-center justify-center transition-all p-2",
									isActive
										? "bg-primary border-primary"
										: "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20",
								)}
							>
								{ArrowComponent && (
									<ArrowComponent color={isActive ? "#ffffff" : "#94a3b8"} strokeWidth={3} />
								)}
							</button>
						);
					})}
				</div>
			</div>

			<div>
				<label className="text-xs font-medium text-slate-200 mb-2 block">
					{t("annotations.strokeWidth", undefined, {
						width: annotation.figureData?.strokeWidth || 4,
					})}
				</label>
				<Slider
					value={[annotation.figureData?.strokeWidth || 4]}
					onValueChange={([value]) => {
						const newFigureData: FigureData = {
							...annotation.figureData!,
							strokeWidth: value,
						};
						onFigureDataChange(newFigureData);
					}}
					min={1}
					max={6}
					step={1}
					className="w-full"
				/>
			</div>

			<div>
				<label className="text-xs font-medium text-slate-200 mb-2 block">
					{t("annotations.arrowColor")}
				</label>
				<Popover>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							className="w-full h-10 justify-start gap-2 bg-white/5 border-white/10 hover:bg-white/10"
						>
							<div
								className="w-5 h-5 rounded-full border border-white/20"
								style={{ backgroundColor: annotation.figureData?.color || "#2563EB" }}
							/>
							<span className="text-xs text-slate-300 truncate flex-1 text-left">
								{annotation.figureData?.color || "#2563EB"}
							</span>
							<ChevronDown className="h-3 w-3 opacity-50" />
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-[260px] p-3 bg-popover border border-white/10 rounded-xl shadow-xl">
						<Block
							color={annotation.figureData?.color || "#2563EB"}
							colors={COLOR_PALETTE}
							onChange={(color) => {
								const newFigureData: FigureData = {
									...annotation.figureData!,
									color: color.hex,
								};
								onFigureDataChange(newFigureData);
							}}
							style={{
								borderRadius: "8px",
							}}
						/>
					</PopoverContent>
				</Popover>
			</div>
		</div>
	);
}
