import { type ReactNode, useEffect } from "react";
import { useI18n } from "@/shared/adapters/I18nProvider";
import { loadAllCustomFonts } from "@/shared/lib/customFonts";

interface WindowShellProps {
	windowType: string;
	children: ReactNode;
}

export function WindowShell({ windowType, children }: WindowShellProps) {
	const { t } = useI18n();

	useEffect(() => {
		const isMacOS = /mac/i.test(navigator.platform);

		// Common transparent window types
		const isTransparent = [
			"hud-overlay",
			"source-selector",
			"countdown",
			windowType === "update-toast" && isMacOS ? "update-toast" : "",
		].includes(windowType);

		if (isTransparent) {
			document.body.style.background = "transparent";
			document.documentElement.style.background = "transparent";
			document.getElementById("root")?.style.setProperty("background", "transparent");
		}

		// Types that need visible overflow (for shadows or floating elements)
		if (windowType === "hud-overlay" || windowType === "update-toast") {
			document.documentElement.style.overflow = "visible";
			document.body.style.overflow = "visible";
			document.getElementById("root")?.style.setProperty("overflow", "visible");
		}

		// Only load custom user fonts in the Editor
		if (windowType === "editor") {
			loadAllCustomFonts().catch((error: Error) => {
				console.error("Failed to load custom fonts:", error);
			});
		}
	}, [windowType]);

	useEffect(() => {
		const baseTitle = t("app.name", "Recordly");
		const editorTitle = t("app.editorTitle", "Recordly Editor");
		document.title = windowType === "editor" ? editorTitle : baseTitle;
	}, [windowType, t]);

	const isTransparent = ["hud-overlay", "source-selector", "countdown"].includes(windowType);

	return (
		<div className={`h-full w-full ${isTransparent ? "pointer-events-none" : ""}`}>{children}</div>
	);
}
