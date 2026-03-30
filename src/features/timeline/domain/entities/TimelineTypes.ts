export interface ZoomFocus {
	cx: number;
	cy: number;
}

export type InteractionType =
	| "move"
	| "click"
	| "double-click"
	| "right-click"
	| "middle-click"
	| "mouseup"
	| "mousedown"
	| "scroll"
	| "drag"
	| "contextmenu";

export interface CursorTelemetryPoint {
	timeMs: number;
	cx: number;
	cy: number;
	interactionType?: InteractionType;
	cursorType?:
		| "arrow"
		| "text"
		| "pointer"
		| "crosshair"
		| "open-hand"
		| "closed-hand"
		| "resize-ew"
		| "resize-ns"
		| "not-allowed";
}

export type TimelineMode = "move" | "select";

export interface TimeSelection {
	startMs: number;
	endMs: number;
}
