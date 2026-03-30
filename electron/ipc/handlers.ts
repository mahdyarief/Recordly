import {
	getSelectedSourceId,
	killWindowsCaptureProcess,
	registerAllHandlers,
} from "./handlers/index";

/**
 * Legacy entry point for IPC handlers.
 * New code should prefer importing from ./handlers/index or individual domain modules.
 */
export {
	registerAllHandlers as registerIpcHandlers,
	getSelectedSourceId,
	killWindowsCaptureProcess,
};
