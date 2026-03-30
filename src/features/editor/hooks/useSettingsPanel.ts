import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
	getWebcamPositionForPreset,
	resolveWebcamCorner,
} from "@/features/editor/lib/webcamOverlay";
import {
	loadEditorPreferences,
	saveEditorPreferences,
} from "@/features/project/domain/services/editorPreferences";
import { useI18n, useScopedT } from "@/shared/adapters/I18nProvider";
import { getAssetPath, getRenderableAssetUrl } from "@/shared/lib/assetPath";
import {
	BUILT_IN_WALLPAPERS,
	type BuiltInWallpaper,
	getAvailableWallpapers,
} from "@/shared/lib/wallpapers";
import {
	BackgroundSettingsSectionConstants,
	isHexWallpaper,
} from "../components/panels/BackgroundSettingsSection";
import type {
	BackgroundTab,
	EditorEffectSection,
	WebcamOverlaySettings,
	WebcamPositionPreset,
} from "../components/VideoEditor/types";
import {
	DEFAULT_CROP_REGION,
	DEFAULT_CURSOR_CLICK_BOUNCE_DURATION,
} from "../components/VideoEditor/types";
import { useCursorPreviews } from "./useCursorPreviews";

function getBackgroundTabForWallpaper(value: string): BackgroundTab {
	if (BackgroundSettingsSectionConstants.GRADIENTS.includes(value)) return "gradient";
	if (isHexWallpaper(value)) return "color";
	return "image";
}

export function useSettingsPanel(props: any) {
	const {
		panelMode = "editor",
		activeEffectSection: activeEffectSectionProp,
		wallpaper,
		onWallpaperChange,
		selectedZoomId,
		onZoomDelete,
		shadowIntensity = 0.67,
		onShadowChange,
		backgroundBlur = 0,
		onBackgroundBlurChange,
		onZoomMotionBlurChange,
		onShowCursorChange,
		onLoopCursorChange,
		onCursorStyleChange,
		onCursorSizeChange,
		onCursorSmoothingChange,
		onCursorMotionBlurChange,
		onCursorClickBounceChange,
		onCursorClickBounceDurationChange,
		onCursorSwayChange,
		borderRadius = 12.5,
		onBorderRadiusChange,
		webcam,
		onWebcamChange,
		padding = 50,
		onPaddingChange,
		onCropChange,
		onAspectRatioChange,
		selectedAnnotationId,
		annotationRegions = [],
	} = props;

	const tSettings = useScopedT("settings");
	const { t, locale } = useI18n();

	const isBackgroundPanel = panelMode === "background";
	const initialEditorPreferences = useMemo(() => loadEditorPreferences(), []);
	const [builtInWallpapers, setBuiltInWallpapers] =
		useState<BuiltInWallpaper[]>(BUILT_IN_WALLPAPERS);
	const [wallpaperPreviewPaths, setWallpaperPreviewPaths] = useState<Record<string, string>>({});
	const [customImages, setCustomImages] = useState<string[]>(
		initialEditorPreferences.customWallpapers,
	);

	const removeBackgroundStateRef = useRef<{ aspectRatio: any; padding: number } | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const customColorInputRef = useRef<HTMLInputElement>(null);

	const builtInWallpaperPaths = useMemo(
		() => builtInWallpapers.map((wp) => wp.publicPath),
		[builtInWallpapers],
	);

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const available = await getAvailableWallpapers();
				const mapping: Record<string, string> = {};
				await Promise.all(
					available.map(async (wp) => {
						mapping[wp.publicPath] = await getRenderableAssetUrl(
							await getAssetPath(wp.relativePath),
						);
					}),
				);
				if (mounted) {
					setBuiltInWallpapers(available);
					setWallpaperPreviewPaths(mapping);
				}
			} catch {
				if (mounted) setBuiltInWallpapers(BUILT_IN_WALLPAPERS);
			}
		})();
		return () => {
			mounted = false;
		};
	}, []);

	const colorPalette = [
		"#FF0000",
		"#FFD700",
		"#00FF00",
		"#FFFFFF",
		"#0000FF",
		"#FF6B00",
		"#9B59B6",
		"#E91E63",
		"#00BCD4",
		"#FF5722",
		"#8BC34A",
		"#FFC107",
		"#2563EB",
		"#000000",
		"#607D8B",
		"#795548",
	];
	const [selectedColor, setSelectedColor] = useState(
		isHexWallpaper(wallpaper) ? wallpaper : "#ADADAD",
	);
	const [gradient, setGradient] = useState<string>(
		BackgroundSettingsSectionConstants.GRADIENTS.includes(wallpaper)
			? wallpaper
			: BackgroundSettingsSectionConstants.GRADIENTS[0],
	);
	const [backgroundTab, setBackgroundTab] = useState<BackgroundTab>(() =>
		getBackgroundTabForWallpaper(wallpaper),
	);

	const removeBackgroundEnabled = props.aspectRatio === "native" && props.padding === 0;
	const [internalActiveEffectSection] = useState<EditorEffectSection>("scene");
	const activeEffectSection = activeEffectSectionProp ?? internalActiveEffectSection;
	const cursorPreviewUrls = useCursorPreviews();

	useEffect(() => {
		setBackgroundTab(getBackgroundTabForWallpaper(wallpaper));
		if (isHexWallpaper(wallpaper)) setSelectedColor(wallpaper);
		if (BackgroundSettingsSectionConstants.GRADIENTS.includes(wallpaper)) setGradient(wallpaper);
		if (wallpaper.startsWith("data:image") && !customImages.includes(wallpaper))
			setCustomImages((prev) => [wallpaper, ...prev]);
	}, [customImages, wallpaper]);

	useEffect(() => {
		saveEditorPreferences({ customWallpapers: customImages });
	}, [customImages]);

	const handleRemoveBackgroundToggle = (checked: boolean) => {
		if (checked) {
			removeBackgroundStateRef.current = { aspectRatio: props.aspectRatio, padding: props.padding };
			onAspectRatioChange?.("native");
			onPaddingChange?.(0);
		} else if (removeBackgroundStateRef.current) {
			onAspectRatioChange?.(removeBackgroundStateRef.current.aspectRatio);
			onPaddingChange?.(removeBackgroundStateRef.current.padding);
			removeBackgroundStateRef.current = null;
		}
	};

	const handleDeleteClick = () => {
		if (selectedZoomId && onZoomDelete) onZoomDelete(selectedZoomId);
	};

	const crop = props.cropRegion ?? { x: 0, y: 0, width: 1, height: 1 };
	const isCropped =
		crop.y > 0 || crop.x > 0 || 1 - crop.y - crop.height > 0 || 1 - crop.x - crop.width > 0;

	const setCropInset = (side: "top" | "bottom" | "left" | "right", pct: number) => {
		if (!onCropChange) return;
		const v = pct / 100;
		let { x, y, width, height } = crop;
		if (side === "top") {
			y = Math.min(v, 1 - y - height + v);
			height = Math.max(0.05, height - (y - crop.y));
		}
		if (side === "left") {
			x = Math.min(v, 1 - x - width + v);
			width = Math.max(0.05, width - (x - crop.x));
		}
		if (side === "bottom") height = Math.max(0.05, 1 - crop.y - v);
		if (side === "right") width = Math.max(0.05, 1 - crop.x - v);
		onCropChange({ x, y, width, height });
	};

	const resetBackgroundSection = () =>
		onBackgroundBlurChange?.(initialEditorPreferences.backgroundBlur);
	const resetZoomSection = () => onZoomMotionBlurChange?.(initialEditorPreferences.zoomMotionBlur);
	const resetCursorSection = () => {
		onShowCursorChange?.(initialEditorPreferences.showCursor);
		onLoopCursorChange?.(initialEditorPreferences.loopCursor);
		onCursorStyleChange?.(initialEditorPreferences.cursorStyle);
		onCursorSizeChange?.(initialEditorPreferences.cursorSize);
		onCursorSmoothingChange?.(initialEditorPreferences.cursorSmoothing);
		onCursorMotionBlurChange?.(initialEditorPreferences.cursorMotionBlur);
		onCursorClickBounceChange?.(initialEditorPreferences.cursorClickBounce);
		onCursorClickBounceDurationChange?.(DEFAULT_CURSOR_CLICK_BOUNCE_DURATION);
		onCursorSwayChange?.(initialEditorPreferences.cursorSway);
	};
	const resetFrameSection = () => {
		onShadowChange?.(initialEditorPreferences.shadowIntensity);
		onBorderRadiusChange?.(initialEditorPreferences.borderRadius);
		onPaddingChange?.(initialEditorPreferences.padding);
		onAspectRatioChange?.(initialEditorPreferences.aspectRatio);
		removeBackgroundStateRef.current = null;
	};
	const resetWebcamSection = () => onWebcamChange?.({ ...initialEditorPreferences.webcam });
	const resetCropSection = () => onCropChange?.(DEFAULT_CROP_REGION);

	const updateWebcam = (patch: Partial<WebcamOverlaySettings>) => {
		if (webcam && onWebcamChange) onWebcamChange({ ...webcam, ...patch });
	};

	const applyWebcamPositionPreset = (preset: WebcamPositionPreset) => {
		if (!webcam) return;
		if (preset === "custom") {
			updateWebcam({ positionPreset: "custom" });
			return;
		}
		const pos = getWebcamPositionForPreset(preset);
		updateWebcam({
			positionPreset: preset,
			positionX: pos.x,
			positionY: pos.y,
			corner: resolveWebcamCorner(preset, webcam.corner),
		});
	};

	const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = event.target.files;
		if (!files?.length) return;
		const file = files[0];
		if (!["image/jpeg", "image/jpg"].includes(file.type)) {
			toast.error(tSettings("background.uploadError"), {
				description: tSettings("background.uploadErrorDescription"),
			});
			event.target.value = "";
			return;
		}
		const reader = new FileReader();
		reader.onload = (e) => {
			const dataUrl = e.target?.result as string;
			if (dataUrl) {
				setCustomImages((prev) => [...prev, dataUrl]);
				onWallpaperChange(dataUrl);
				toast.success(tSettings("background.uploadSuccess"));
			}
		};
		reader.readAsDataURL(file);
		event.target.value = "";
	};

	const handleRemoveCustomImage = (imageUrl: string, event: React.MouseEvent) => {
		event.stopPropagation();
		setCustomImages((prev) => prev.filter((img) => img !== imageUrl));
		if (wallpaper === imageUrl) onWallpaperChange(builtInWallpaperPaths[0] || "");
	};

	const getWallpaperTileState = (path: string) => (wallpaper === path ? "selected" : "none");

	return {
		...props,
		t,
		locale,
		tSettings,
		isBackgroundPanel,
		initialEditorPreferences,
		builtInWallpaperPaths,
		wallpaperPreviewPaths,
		customImages,
		selectedColor,
		setSelectedColor,
		gradient,
		setGradient,
		backgroundTab,
		setBackgroundTab,
		removeBackgroundEnabled,
		activeEffectSection,
		cursorPreviewUrls,
		handleRemoveBackgroundToggle,
		handleDeleteClick,
		isCropped,
		setCropInset,
		resetBackgroundSection,
		resetZoomSection,
		resetCursorSection,
		resetFrameSection,
		resetWebcamSection,
		resetCropSection,
		updateWebcam,
		applyWebcamPositionPreset,
		handleImageUpload,
		handleRemoveCustomImage,
		getWallpaperTileState,
		fileInputRef,
		customColorInputRef,
		GRADIENTS: BackgroundSettingsSectionConstants.GRADIENTS,
		visibleColorPalette: colorPalette.slice(0, 15),
		zoomEnabled: Boolean(selectedZoomId),
		selectedAnnotation: selectedAnnotationId
			? annotationRegions.find((a: any) => a.id === selectedAnnotationId)
			: null,
		shadowIntensity,
		backgroundBlur,
		borderRadius,
		padding,
	};
}
