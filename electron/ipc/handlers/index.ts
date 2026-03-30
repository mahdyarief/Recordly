import { BrowserWindow } from "electron";
import { registerCaptionHandlers } from "./captions";
import { registerCountdownHandlers } from "./countdown";
import { registerMediaHandlers } from "./media";
import { registerProjectHandlers } from "./projects";
import {
	killWindowsCaptureProcess,
	registerRecordingHandlers,
	stopWindowBoundsCapture,
} from "./recording";
import { registerSettingsHandlers } from "./settings";
import { getSelectedSourceId, registerSourceHandlers } from "./sources";

/**
 * Main registration function for all IPC handlers.
 * This is called from the Electron main process.
 */
export function registerAllHandlers(
	createEditorWindow: () => void,
	createSourceSelectorWindow: () => BrowserWindow,
	_getMainWindow: () => BrowserWindow | null,
	getSourceSelectorWindow: () => BrowserWindow | null,
	onRecordingStateChange?: (recording: boolean, sourceName: string) => void,
) {
	// 1. Sources & Selection
	registerSourceHandlers(
		getSourceSelectorWindow,
		createSourceSelectorWindow,
		createEditorWindow,
		stopWindowBoundsCapture,
	);

	// 2. Recording
	registerRecordingHandlers(onRecordingStateChange);

	// 3. Projects
	registerProjectHandlers();

	// 4. Media & Sessions
	registerMediaHandlers();

	// 5. Captions & AI
	registerCaptionHandlers();

	// 6. Settings & Utility
	registerSettingsHandlers();

	// 7. Countdown
	registerCountdownHandlers();
}

export { getSelectedSourceId, killWindowsCaptureProcess };
