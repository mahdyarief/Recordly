import { lazy, Suspense, useEffect, useState } from "react";

const VideoEditor = lazy(() =>
	import("@/features/editor").then((m) => ({ default: m.VideoEditor })),
);
const ShortcutsConfigDialog = lazy(() =>
	import("@/features/editor/components/ShortcutsConfigDialog").then((m) => ({
		default: m.ShortcutsConfigDialog,
	})),
);
const LaunchWindow = lazy(() =>
	import("@/features/recording/components/LaunchWindow").then((m) => ({ default: m.LaunchWindow })),
);
const SourceSelector = lazy(() =>
	import("@/features/recording/components/SourceSelector").then((m) => ({
		default: m.SourceSelector,
	})),
);
const CountdownOverlay = lazy(() =>
	import("@/features/recording/components/CountdownOverlay").then((m) => ({
		default: m.CountdownOverlay,
	})),
);
const UpdateToastWindow = lazy(() =>
	import("@/features/recording/components/UpdateToastWindow").then((m) => ({
		default: m.UpdateToastWindow,
	})),
);

import { ShortcutsProvider } from "@/shared/adapters/ShortcutsProvider";
import { SplashScreen } from "@/shared/components/shell/SplashScreen";
import { WindowShell } from "@/shared/components/shell/WindowShell";
import { Toaster } from "@/shared/components/ui/sonner";

export default function App() {
	const [windowType, setWindowType] = useState<string | null>(null);

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		setWindowType(params.get("windowType") || "loading");
	}, []);

	const renderContent = () => {
		switch (windowType) {
			case "hud-overlay":
				return (
					<>
						<LaunchWindow />
						<Toaster theme="dark" />
					</>
				);
			case "source-selector":
				return <SourceSelector />;
			case "countdown":
				return <CountdownOverlay />;
			case "update-toast":
				return <UpdateToastWindow />;
			case "editor":
				return (
					<ShortcutsProvider>
						<VideoEditor />
						<ShortcutsConfigDialog />
					</ShortcutsProvider>
				);
			case "loading":
			default:
				return <SplashScreen />;
		}
	};

	if (!windowType) return null;

	return (
		<WindowShell windowType={windowType}>
			<Suspense fallback={<SplashScreen />}>{renderContent()}</Suspense>
		</WindowShell>
	);
}
