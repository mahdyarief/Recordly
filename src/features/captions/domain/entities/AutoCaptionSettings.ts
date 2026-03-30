export type AutoCaptionAnimation = "none" | "fade" | "rise" | "pop";
export type WhisperModel = "tiny" | "base" | "small" | "medium" | "large" | "custom";

export interface AutoCaptionSettings {
	enabled: boolean;
	language: string;
	selectedModel: WhisperModel;
	fontFamily: string;
	fontSize: number;
	bottomOffset: number;
	maxWidth: number;
	maxRows: number;
	animationStyle: AutoCaptionAnimation;
	boxRadius: number;
	textColor: string;
	inactiveTextColor: string;
	backgroundOpacity: number;
	generationRange: "full" | "selected";
}

export const DEFAULT_AUTO_CAPTION_SETTINGS: AutoCaptionSettings = {
	enabled: false,
	language: "auto",
	selectedModel: "base",
	fontFamily: "Inter, sans-serif",
	fontSize: 32,
	bottomOffset: 12,
	maxWidth: 90,
	maxRows: 2,
	animationStyle: "pop",
	boxRadius: 8,
	textColor: "#FFFFFF",
	inactiveTextColor: "rgba(255,255,255,0.5)",
	backgroundOpacity: 0.65,
	generationRange: "full",
};

export const WHISPER_MODEL_OPTIONS: { value: WhisperModel; label: string; size: string }[] = [
	{ value: "tiny", label: "Tiny", size: "75 MB" },
	{ value: "base", label: "Base", size: "142 MB" },
	{ value: "small", label: "Small", size: "466 MB" },
	{ value: "medium", label: "Medium", size: "1.5 GB" },
	{ value: "large", label: "Large (v3)", size: "2.9 GB" },
	{ value: "custom", label: "Custom", size: "Local File" },
];

export const CAPTION_LANGUAGE_OPTIONS = [
	{ value: "auto", label: "Auto Detect" },
	{ value: "en", label: "English" },
	{ value: "es", label: "Spanish" },
	{ value: "fr", label: "French" },
	{ value: "de", label: "German" },
	{ value: "it", label: "Italian" },
	{ value: "pt", label: "Portuguese" },
	{ value: "zh", label: "Chinese" },
	{ value: "ja", label: "Japanese" },
	{ value: "ko", label: "Korean" },
	{ value: "id", label: "Indonesian" },
] as const;
