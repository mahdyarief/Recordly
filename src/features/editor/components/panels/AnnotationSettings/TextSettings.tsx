import Block from "@uiw/react-color-block";
import {
	AlignCenter,
	AlignLeft,
	AlignRight,
	Bold,
	ChevronDown,
	Italic,
	Underline,
} from "lucide-react";
import { useMemo } from "react";
import { type AnnotationRegion } from "@/features/editor/types";
import { useScopedT } from "@/shared/adapters/I18nProvider";
import { Button } from "@/shared/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/shared/components/ui/toggle-group";
import { type CustomFont } from "@/shared/lib/customFonts";
import { AddCustomFontDialog } from "../AddCustomFontDialog";
import { COLOR_PALETTE, FONT_FAMILY_VALUES, FONT_SIZES } from "./constants";

interface TextSettingsProps {
	annotation: AnnotationRegion;
	onContentChange: (content: string) => void;
	onStyleChange: (style: Partial<AnnotationRegion["style"]>) => void;
	customFonts: CustomFont[];
	onCustomFontsChange: () => void;
}

export function TextSettings({
	annotation,
	onContentChange,
	onStyleChange,
	customFonts,
	onCustomFontsChange,
}: TextSettingsProps) {
	const t = useScopedT("editor");

	const fontFamilies = useMemo(
		() => FONT_FAMILY_VALUES.map((f) => ({ value: f.value, label: t(f.labelKey) })),
		[t],
	);

	return (
		<div className="space-y-4">
			<div>
				<label className="text-xs font-medium text-slate-200 mb-2 block">
					{t("annotations.textContent")}
				</label>
				<textarea
					value={annotation.textContent || annotation.content}
					onChange={(e) => onContentChange(e.target.value)}
					placeholder={t("annotations.textPlaceholder")}
					rows={5}
					className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-200 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
				/>
			</div>

			<div className="space-y-4">
				<div className="grid grid-cols-2 gap-2">
					<div>
						<label className="text-xs font-medium text-slate-200 mb-2 block">
							{t("annotations.fontStyle")}
						</label>
						<Select
							value={annotation.style.fontFamily}
							onValueChange={(value) => onStyleChange({ fontFamily: value })}
						>
							<SelectTrigger className="w-full bg-white/5 border-white/10 text-slate-200 h-9 text-xs">
								<SelectValue placeholder={t("annotations.selectStyle")} />
							</SelectTrigger>
							<SelectContent className="bg-popover border-white/10 text-slate-200 max-h-[300px]">
								{fontFamilies.map((font) => (
									<SelectItem
										key={font.value}
										value={font.value}
										style={{ fontFamily: font.value }}
									>
										{font.label}
									</SelectItem>
								))}
								{customFonts.length > 0 && (
									<>
										<div className="px-2 py-1.5 text-[10px] font-medium text-slate-400 uppercase tracking-wider">
											Custom Fonts
										</div>
										{customFonts.map((font) => (
											<SelectItem
												key={font.id}
												value={font.fontFamily}
												style={{ fontFamily: font.fontFamily }}
											>
												{font.name}
											</SelectItem>
										))}
									</>
								)}
							</SelectContent>
						</Select>
					</div>
					<div>
						<label className="text-xs font-medium text-slate-200 mb-2 block">
							{t("annotations.size")}
						</label>
						<Select
							value={annotation.style.fontSize.toString()}
							onValueChange={(value) => onStyleChange({ fontSize: parseInt(value) })}
						>
							<SelectTrigger className="w-full bg-white/5 border-white/10 text-slate-200 h-9 text-xs">
								<SelectValue placeholder={t("annotations.size")} />
							</SelectTrigger>
							<SelectContent className="bg-popover border-white/10 text-slate-200 max-h-[200px]">
								{FONT_SIZES.map((size) => (
									<SelectItem key={size} value={size.toString()}>
										{size}px
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				<div>
					<AddCustomFontDialog
						onFontAdded={(font) => {
							onCustomFontsChange();
							onStyleChange({ fontFamily: font.fontFamily });
						}}
					/>
				</div>

				<div className="flex items-center justify-between gap-2">
					<ToggleGroup
						type="multiple"
						className="justify-start bg-white/5 p-1 rounded-lg border border-white/5"
					>
						<ToggleGroupItem
							value="bold"
							aria-label={t("annotations.toggleBold")}
							data-state={annotation.style.fontWeight === "bold" ? "on" : "off"}
							onClick={() =>
								onStyleChange({
									fontWeight: annotation.style.fontWeight === "bold" ? "normal" : "bold",
								})
							}
							className="h-8 w-8 data-[state=on]:bg-primary data-[state=on]:text-white text-slate-400 hover:bg-white/5 hover:text-slate-200"
						>
							<Bold className="h-4 w-4" />
						</ToggleGroupItem>
						<ToggleGroupItem
							value="italic"
							aria-label={t("annotations.toggleItalic")}
							data-state={annotation.style.fontStyle === "italic" ? "on" : "off"}
							onClick={() =>
								onStyleChange({
									fontStyle: annotation.style.fontStyle === "italic" ? "normal" : "italic",
								})
							}
							className="h-8 w-8 data-[state=on]:bg-primary data-[state=on]:text-white text-slate-400 hover:bg-white/5 hover:text-slate-200"
						>
							<Italic className="h-4 w-4" />
						</ToggleGroupItem>
						<ToggleGroupItem
							value="underline"
							aria-label={t("annotations.toggleUnderline")}
							data-state={annotation.style.textDecoration === "underline" ? "on" : "off"}
							onClick={() =>
								onStyleChange({
									textDecoration:
										annotation.style.textDecoration === "underline" ? "none" : "underline",
								})
							}
							className="h-8 w-8 data-[state=on]:bg-primary data-[state=on]:text-white text-slate-400 hover:bg-white/5 hover:text-slate-200"
						>
							<Underline className="h-4 w-4" />
						</ToggleGroupItem>
					</ToggleGroup>

					<ToggleGroup
						type="single"
						value={annotation.style.textAlign}
						className="justify-start bg-white/5 p-1 rounded-lg border border-white/5"
					>
						<ToggleGroupItem
							value="left"
							aria-label={t("annotations.alignLeft")}
							onClick={() => onStyleChange({ textAlign: "left" })}
							className="h-8 w-8 data-[state=on]:bg-primary data-[state=on]:text-white text-slate-400 hover:bg-white/5 hover:text-slate-200"
						>
							<AlignLeft className="h-4 w-4" />
						</ToggleGroupItem>
						<ToggleGroupItem
							value="center"
							aria-label={t("annotations.alignCenter")}
							onClick={() => onStyleChange({ textAlign: "center" })}
							className="h-8 w-8 data-[state=on]:bg-primary data-[state=on]:text-white text-slate-400 hover:bg-white/5 hover:text-slate-200"
						>
							<AlignCenter className="h-4 w-4" />
						</ToggleGroupItem>
						<ToggleGroupItem
							value="right"
							aria-label={t("annotations.alignRight")}
							onClick={() => onStyleChange({ textAlign: "right" })}
							className="h-8 w-8 data-[state=on]:bg-primary data-[state=on]:text-white text-slate-400 hover:bg-white/5 hover:text-slate-200"
						>
							<AlignRight className="h-4 w-4" />
						</ToggleGroupItem>
					</ToggleGroup>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div>
						<label className="text-xs font-medium text-slate-200 mb-2 block">
							{t("annotations.textColor")}
						</label>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									className="w-full h-9 justify-start gap-2 bg-white/5 border-white/10 hover:bg-white/10 px-2"
								>
									<div
										className="w-4 h-4 rounded-full border border-white/20"
										style={{ backgroundColor: annotation.style.color }}
									/>
									<span className="text-xs text-slate-300 truncate flex-1 text-left">
										{annotation.style.color}
									</span>
									<ChevronDown className="h-3 w-3 opacity-50" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-[260px] p-3 bg-popover border border-white/10 rounded-xl shadow-xl">
								<Block
									color={annotation.style.color}
									colors={COLOR_PALETTE}
									onChange={(color) => {
										onStyleChange({ color: color.hex });
									}}
									style={{
										borderRadius: "8px",
									}}
								/>
							</PopoverContent>
						</Popover>
					</div>
					<div>
						<label className="text-xs font-medium text-slate-200 mb-2 block">
							{t("annotations.background")}
						</label>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									className="w-full h-9 justify-start gap-2 bg-white/5 border-white/10 hover:bg-white/10 px-2"
								>
									<div className="w-4 h-4 rounded-full border border-white/20 relative overflow-hidden">
										<div className="absolute inset-0 checkerboard-bg opacity-50" />
										<div
											className="absolute inset-0"
											style={{ backgroundColor: annotation.style.backgroundColor }}
										/>
									</div>
									<span className="text-xs text-slate-300 truncate flex-1 text-left">
										{annotation.style.backgroundColor === "transparent"
											? t("annotations.none")
											: "Color"}
									</span>
									<ChevronDown className="h-3 w-3 opacity-50" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-[260px] p-3 bg-popover border border-white/10 rounded-xl shadow-xl">
								<Block
									color={
										annotation.style.backgroundColor === "transparent"
											? "#000000"
											: annotation.style.backgroundColor
									}
									colors={COLOR_PALETTE}
									onChange={(color) => {
										onStyleChange({ backgroundColor: color.hex });
									}}
									style={{
										borderRadius: "8px",
									}}
								/>
								<Button
									variant="ghost"
									size="sm"
									className="w-full mt-2 text-xs h-7 hover:bg-white/5 text-slate-400"
									onClick={() => {
										onStyleChange({ backgroundColor: "transparent" });
									}}
								>
									{t("annotations.clearBackground")}
								</Button>
							</PopoverContent>
						</Popover>
					</div>
				</div>
			</div>
		</div>
	);
}
