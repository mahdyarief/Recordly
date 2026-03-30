import { useCallback, useRef, useState } from "react";
import { cloneStructured } from "../../../shared/lib/clone";
import { useEditorContext } from "../context/EditorContext";

export interface EditorHistorySnapshot {
	wallpaper: string;
	shadowIntensity: number;
	backgroundBlur: number;
	zoomMotionBlur: number;
	connectZooms: boolean;
	zoomInDurationMs: number;
	zoomInOverlapMs: number;
	zoomOutDurationMs: number;
	connectedZoomGapMs: number;
	connectedZoomDurationMs: number;
	zoomInEasing: any;
	zoomOutEasing: any;
	connectedZoomEasing: any;
	showCursor: boolean;
	loopCursor: boolean;
	cursorStyle: any;
	cursorSize: number;
	cursorSmoothing: number;
	cursorMotionBlur: number;
	cursorClickBounce: number;
	cursorClickBounceDuration: number;
	cursorSway: number;
	borderRadius: number;
	padding: number;
	cropRegion: any;
	zoomRegions: any[];
	trimRegions: any[];
	speedRegions: any[];
	annotationRegions: any[];
	audioRegions: any[];
	autoCaptions: any[];
	autoCaptionSettings: any;
	webcam: any;
	aspectRatio: any;
	exportQuality: any;
	exportFormat: any;
	gifFrameRate: any;
	gifLoop: boolean;
	gifSizePreset: any;
	masterAudioMuted: boolean;
	masterAudioSoloed: boolean;
	masterAudioVolume: number;
	audioTrackVolume: number;
}

export function useHistoryActions() {
	const { state, updateState, setHasUnsavedChanges } = useEditorContext();

	const historyPastRef = useRef<EditorHistorySnapshot[]>([]);
	const historyFutureRef = useRef<EditorHistorySnapshot[]>([]);
	const historyCurrentRef = useRef<EditorHistorySnapshot | null>(null);
	const applyingHistoryRef = useRef(false);
	const [historyVersion, setHistoryVersion] = useState(0);

	const syncHistoryButtons = useCallback(() => {
		setHistoryVersion((version) => version + 1);
	}, []);

	const cloneSnapshot = useCallback((snapshot: EditorHistorySnapshot): EditorHistorySnapshot => {
		return cloneStructured(snapshot);
	}, []);

	const undo = useCallback(() => {
		if (applyingHistoryRef.current) return;
		if (historyPastRef.current.length === 0) return;

		const current = historyCurrentRef.current;
		const previous = historyPastRef.current.pop();

		if (current && previous) {
			applyingHistoryRef.current = true;
			historyFutureRef.current.push(cloneSnapshot(current));
			historyCurrentRef.current = cloneSnapshot(previous);
			updateState(previous);
			syncHistoryButtons();
			setTimeout(() => {
				applyingHistoryRef.current = false;
			}, 10);
		}
	}, [updateState, cloneSnapshot, syncHistoryButtons]);

	const redo = useCallback(() => {
		if (applyingHistoryRef.current) return;
		if (historyFutureRef.current.length === 0) return;

		const current = historyCurrentRef.current;
		const next = historyFutureRef.current.pop();

		if (current && next) {
			applyingHistoryRef.current = true;
			historyPastRef.current.push(cloneSnapshot(current));
			historyCurrentRef.current = cloneSnapshot(next);
			updateState(next);
			syncHistoryButtons();
			setTimeout(() => {
				applyingHistoryRef.current = false;
			}, 10);
		}
	}, [updateState, cloneSnapshot, syncHistoryButtons]);

	const commitSnapshot = useCallback(() => {
		if (applyingHistoryRef.current) return;

		const current = cloneSnapshot(state as unknown as EditorHistorySnapshot);
		if (historyCurrentRef.current) {
			// Compare with current to avoid redundant snapshots
			// ... actual comparison or just push
			historyPastRef.current.push(cloneSnapshot(historyCurrentRef.current));
			if (historyPastRef.current.length > 100) {
				historyPastRef.current.shift();
			}
			historyFutureRef.current = [];
		}
		historyCurrentRef.current = current;
		syncHistoryButtons();
		setHasUnsavedChanges(true);
	}, [state, cloneSnapshot, syncHistoryButtons, setHasUnsavedChanges]);

	const resetHistory = useCallback(
		(initialState: EditorHistorySnapshot) => {
			historyPastRef.current = [];
			historyFutureRef.current = [];
			historyCurrentRef.current = cloneSnapshot(initialState);
			syncHistoryButtons();
		},
		[cloneSnapshot, syncHistoryButtons],
	);

	return {
		undo,
		redo,
		commitSnapshot,
		resetHistory,
		canUndo: historyPastRef.current.length > 0,
		canRedo: historyFutureRef.current.length > 0,
		historyVersion,
	};
}
