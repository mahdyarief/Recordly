export interface DesktopSource {
	id: string;
	name: string;
	thumbnail: string | null;
	display_id: string;
	appIcon: string | null;
	sourceType?: "screen" | "window";
	appName?: string;
	windowTitle?: string;
}

export type UpdateStatus = {
	status: "idle" | "checking" | "up-to-date" | "available" | "downloading" | "ready" | "error";
	currentVersion: string;
	availableVersion: string | null;
	detail?: string;
};

export type ActiveDropdown = "none" | "sources" | "more" | "mic" | "countdown" | "webcam";
