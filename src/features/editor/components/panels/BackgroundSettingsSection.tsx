import { Image as ImageIcon, Plus, Undo2, X } from "lucide-react";
import { type RefObject } from "react";
import { useScopedT } from "@/shared/adapters/I18nProvider";
import { Button } from "@/shared/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { cn } from "@/shared/lib/utils";
import { SliderControl } from "../SliderControl";
import { type BackgroundTab } from "../VideoEditor/types";

interface BackgroundSettingsSectionProps {
	backgroundBlur: number;
	initialBackgroundBlur: number;
	onBackgroundBlurChange?: (amount: number) => void;
	resetBackgroundSection: () => void;
	backgroundTab: BackgroundTab;
	setBackgroundTab: (tab: BackgroundTab) => void;
	fileInputRef: RefObject<HTMLInputElement>;
	handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
	customImages: string[];
	getWallpaperTileState: (candidateValue: string, previewPath?: string) => boolean;
	onWallpaperChange: (path: string) => void;
	handleRemoveCustomImage: (imageUrl: string, event: React.MouseEvent) => void;
	renderWallpaperImageTile: (
		imageUrl: string,
		isSelected: boolean,
		props?: {
			key?: string;
			ariaLabel?: string;
			title?: string;
			onClick?: () => void;
			children?: React.ReactNode;
		},
	) => React.ReactNode;
	wallpaperTileClass: (isSelected: boolean) => string;
	builtInWallpaperPaths: string[];
	wallpaperPreviewPaths: string[];
	visibleColorPalette: string[];
	selectedColor: string;
	customColorInputRef: RefObject<HTMLInputElement>;
	setSelectedColor: (color: string) => void;
	gradient: string;
	setGradient: (gradient: string) => void;
	GRADIENTS: string[];
	wallpaper: string;
}

export function BackgroundSettingsSection({
	backgroundBlur,
	initialBackgroundBlur,
	onBackgroundBlurChange,
	resetBackgroundSection,
	backgroundTab,
	setBackgroundTab,
	fileInputRef,
	handleImageUpload,
	customImages,
	getWallpaperTileState,
	onWallpaperChange,
	handleRemoveCustomImage,
	renderWallpaperImageTile,
	wallpaperTileClass,
	builtInWallpaperPaths,
	wallpaperPreviewPaths,
	visibleColorPalette,
	selectedColor,
	customColorInputRef,
	setSelectedColor,
	gradient,
	setGradient,
	GRADIENTS,
	wallpaper,
}: BackgroundSettingsSectionProps) {
	const tSettings = useScopedT("settings");

	return (
		<section className="flex flex-col gap-5 border-b border-white/5 pb-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
						<Plus className="w-3.5 h-3.5" />
					</div>
					<h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
						{tSettings("background.title", "Background")}
					</h3>
				</div>
				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7 text-slate-500 hover:text-white hover:bg-white/5"
					onClick={resetBackgroundSection}
				>
					<Undo2 className="h-3.5 w-3.5" />
				</Button>
			</div>

			<SliderControl
				label={tSettings("background.blur", "Blur")}
				value={backgroundBlur}
				defaultValue={initialBackgroundBlur}
				min={0}
				max={50}
				step={1}
				onChange={onBackgroundBlurChange || (() => {})}
				formatValue={(v) => `${v}px`}
				parseInput={(t) => parseInt(t.replace(/px$/, ""))}
			/>

			<div className="space-y-4">
				<Tabs
					value={backgroundTab}
					onValueChange={(v) => setBackgroundTab(v as BackgroundTab)}
					className="w-full"
				>
					<TabsList className="grid w-full grid-cols-3 bg-white/[0.03] p-1 h-9 rounded-xl border border-white/5">
						<TabsTrigger
							value="image"
							className="rounded-lg text-[11px] font-semibold data-[state=active]:bg-white/10 data-[state=active]:text-white"
						>
							{tSettings("background.tabs.image", "Image")}
						</TabsTrigger>
						<TabsTrigger
							value="color"
							className="rounded-lg text-[11px] font-semibold data-[state=active]:bg-white/10 data-[state=active]:text-white"
						>
							{tSettings("background.tabs.color", "Color")}
						</TabsTrigger>
						<TabsTrigger
							value="gradient"
							className="rounded-lg text-[11px] font-semibold data-[state=active]:bg-white/10 data-[state=active]:text-white"
						>
							{tSettings("background.tabs.gradient", "Gradient")}
						</TabsTrigger>
					</TabsList>
				</Tabs>

				<div className="min-h-[140px]">
					{backgroundTab === "image" && (
						<div className="grid grid-cols-4 gap-2.5">
							<input
								type="file"
								ref={fileInputRef}
								onChange={handleImageUpload}
								accept="image/jpeg,image/jpg"
								className="hidden"
							/>
							<button
								type="button"
								onClick={() => fileInputRef.current?.click()}
								className="group relative flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-[10px] border border-dashed border-white/15 bg-white/[0.02] transition-all hover:border-primary/40 hover:bg-primary/5 active:scale-95"
							>
								<div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
									<ImageIcon className="h-4 w-4" />
								</div>
								<span className="text-[9px] font-bold uppercase tracking-tight text-slate-500 group-hover:text-primary/80">
									{tSettings("background.upload", "Upload")}
								</span>
							</button>

							{customImages.map((imageUrl) =>
								renderWallpaperImageTile(imageUrl, getWallpaperTileState(imageUrl), {
									key: imageUrl,
									onClick: () => onWallpaperChange(imageUrl),
									children: (
										<button
											type="button"
											onClick={(e) => handleRemoveCustomImage(imageUrl, e)}
											className="absolute top-1 right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-red-500 group-hover:opacity-100"
										>
											<X className="h-3 w-3" />
										</button>
									),
								}),
							)}

							{builtInWallpaperPaths.map((publicPath, index) =>
								renderWallpaperImageTile(
									wallpaperPreviewPaths[index] || publicPath,
									getWallpaperTileState(publicPath, wallpaperPreviewPaths[index]),
									{
										key: publicPath,
										onClick: () => onWallpaperChange(publicPath),
									},
								),
							)}
						</div>
					)}

					{backgroundTab === "color" && (
						<div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-300">
							<div className="grid grid-cols-5 gap-2.5">
								{visibleColorPalette.map((color) => {
									const isSelected = selectedColor === color && isHexWallpaper(wallpaper);
									return (
										<button
											key={color}
											className={cn(
												"group relative aspect-square w-full rounded-lg border transition-all hover:scale-105 active:scale-95",
												isSelected
													? "border-white ring-2 ring-primary/40 ring-offset-2 ring-offset-[#161619]"
													: "border-white/10",
											)}
											style={{ backgroundColor: color }}
											onClick={() => {
												setSelectedColor(color);
												onWallpaperChange(color);
											}}
										/>
									);
								})}
								<button
									className={cn(
										"group relative flex aspect-square w-full items-center justify-center rounded-lg border border-dashed border-white/20 bg-white/[0.03] transition-all hover:border-primary/40 hover:bg-primary/5 active:scale-95",
										!visibleColorPalette.includes(selectedColor) && isHexWallpaper(wallpaper)
											? "border-primary bg-primary/10 ring-2 ring-primary/40"
											: "",
									)}
									onClick={() => customColorInputRef.current?.click()}
								>
									<div className="h-4 w-4 rounded-full bg-gradient-to-tr from-red-500 via-green-500 to-blue-500 shadow-sm" />
									<input
										type="color"
										ref={customColorInputRef}
										className="absolute inset-0 opacity-0 cursor-pointer"
										value={selectedColor}
										onChange={(e) => {
											setSelectedColor(e.target.value);
											onWallpaperChange(e.target.value);
										}}
									/>
								</button>
							</div>
						</div>
					)}

					{backgroundTab === "gradient" && (
						<div className="grid grid-cols-4 gap-2.5 animate-in fade-in slide-in-from-top-1 duration-300">
							{GRADIENTS.map((g) => {
								const isSelected = gradient === g && wallpaper === g;
								return (
									<button
										key={g}
										className={wallpaperTileClass(isSelected)}
										onClick={() => {
											setGradient(g);
											onWallpaperChange(g);
										}}
									>
										<div className="absolute inset-[1px] rounded-[8px]" style={{ background: g }} />
									</button>
								);
							})}
						</div>
					)}
				</div>
			</div>
		</section>
	);
}

export const BackgroundSettingsSectionConstants = {
	GRADIENTS: [
		"linear-gradient( 111.6deg,  rgba(114,167,232,1) 9.4%, rgba(253,129,82,1) 43.9%, rgba(253,129,82,1) 54.8%, rgba(249,202,86,1) 86.3% )",
		"linear-gradient(120deg, #d4fc79 0%, #96e6a1 100%)",
		"radial-gradient( circle farthest-corner at 3.2% 49.6%,  rgba(80,12,139,0.87) 0%, rgba(161,10,144,0.72) 83.6% )",
		"linear-gradient( 111.6deg,  rgba(0,56,68,1) 0%, rgba(163,217,185,1) 51.5%, rgba(231, 148, 6, 1) 88.6% )",
		"linear-gradient( 107.7deg,  rgba(235,230,44,0.55) 8.4%, rgba(252,152,15,1) 90.3% )",
		"linear-gradient( 91deg,  rgba(72,154,78,1) 5.2%, rgba(251,206,70,1) 95.9% )",
		"radial-gradient( circle farthest-corner at 10% 20%,  rgba(2,37,78,1) 0%, rgba(4,56,126,1) 19.7%, rgba(85,245,221,1) 100.2% )",
		"linear-gradient( 109.6deg,  rgba(15,2,2,1) 11.2%, rgba(36,163,190,1) 91.1% )",
		"linear-gradient(135deg, #FBC8B4, #2447B1)",
		"linear-gradient(109.6deg, #F635A6, #36D860)",
		"linear-gradient(90deg, #FF0101, #4DFF01)",
		"linear-gradient(315deg, #EC0101, #5044A9)",
		"linear-gradient(45deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%)",
		"linear-gradient(to top, #a18cd1 0%, #fbc2eb 100%)",
		"linear-gradient(to right, #ff8177 0%, #ff867a 0%, #ff8c7f 21%, #f99185 52%, #cf556c 78%, #b12a5b 100%)",
		"linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)",
		"linear-gradient(to right, #4facfe 0%, #00f2fe 100%)",
		"linear-gradient(to top, #fcc5e4 0%, #fda34b 15%, #ff7882 35%, #c8699e 52%, #7046aa 71%, #0c1db8 87%, #020f75 100%)",
		"linear-gradient(to right, #fa709a 0%, #fee140 100%)",
		"linear-gradient(to top, #30cfd0 0%, #330867 100%)",
		"linear-gradient(to top, #c471f5 0%, #fa71cd 100%)",
		"linear-gradient(to right, #f78ca0 0%, #f9748f 19%, #fd868c 60%, #fe9a8b 100%)",
		"linear-gradient(to top, #48c6ef 0%, #6f86d6 100%)",
		"linear-gradient(to right, #0acffe 0%, #495aff 100%)",
	],
};

export function isHexWallpaper(value: string): boolean {
	return /^#(?:[0-9a-f]{3}){1,2}$/i.test(value);
}
