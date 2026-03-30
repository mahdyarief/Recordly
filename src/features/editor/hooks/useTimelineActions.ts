import type { Span } from "dnd-timeline";
import { useCallback } from "react";
import {
	type AnnotationType,
	type PlaybackSpeed,
	type ZoomDepth,
	type ZoomFocus,
} from "../components/VideoEditor/types";
import { useEditorContext } from "../context/EditorContext";

export function useTimelineActions() {
	const {
		state,
		updateState,
		selectedZoomId,
		setSelectedZoomId,
		selectedTrimId,
		setSelectedTrimId,
		selectedSpeedId,
		setSelectedSpeedId,
		selectedAudioId,
		setSelectedAudioId,
		selectedAnnotationId,
		setSelectedAnnotationId,
		setSelectedCaptionId,
		setAutoSuggestZoomsTrigger,
		setActiveEffectSection,
	} = useEditorContext();

	const { zoomRegions, trimRegions, speedRegions, audioRegions, annotationRegions, autoCaptions } =
		state;

	// Zoom Handlers
	const handleSelectZoom = useCallback(
		(id: string | null) => setSelectedZoomId(id),
		[setSelectedZoomId],
	);

	const handleZoomAdded = useCallback(
		(span: Span) => {
			const newZoom = {
				id: `zoom-${Date.now()}`,
				startMs: span.start,
				endMs: span.end,
				depth: 1.5 as ZoomDepth,
				focus: { cx: 0.5, cy: 0.5 },
			};
			updateState({ zoomRegions: [...zoomRegions, newZoom] });
			setSelectedZoomId(newZoom.id);
		},
		[zoomRegions, updateState, setSelectedZoomId],
	);

	const handleZoomSpanChange = useCallback(
		(id: string, span: Span) => {
			updateState({
				zoomRegions: zoomRegions.map((z) =>
					z.id === id ? { ...z, startMs: span.start, endMs: span.end } : z,
				),
			});
		},
		[zoomRegions, updateState],
	);

	const handleZoomDelete = useCallback(
		(id: string) => {
			updateState({ zoomRegions: zoomRegions.filter((z) => z.id !== id) });
			if (selectedZoomId === id) setSelectedZoomId(null);
		},
		[zoomRegions, selectedZoomId, updateState, setSelectedZoomId],
	);

	const handleZoomDepthChange = useCallback(
		(depth: number) => {
			if (!selectedZoomId) return;
			updateState({
				zoomRegions: zoomRegions.map((z) =>
					z.id === selectedZoomId ? { ...z, depth: depth as ZoomDepth } : z,
				),
			});
		},
		[zoomRegions, selectedZoomId, updateState],
	);

	const handleZoomFocusChange = useCallback(
		(id: string, focus: ZoomFocus) => {
			updateState({
				zoomRegions: zoomRegions.map((z) => (z.id === id ? { ...z, focus } : z)),
			});
		},
		[zoomRegions, updateState],
	);

	const handleZoomSuggested = useCallback(
		(span: Span, focus: ZoomFocus) => {
			const newZoom = {
				id: `zoom-suggested-${Date.now()}`,
				startMs: span.start,
				endMs: span.end,
				depth: 1.5 as ZoomDepth,
				focus,
			};
			updateState({ zoomRegions: [...zoomRegions, newZoom] });
		},
		[zoomRegions, updateState],
	);

	// Trim Handlers
	const handleSelectTrim = useCallback(
		(id: string | null) => setSelectedTrimId(id),
		[setSelectedTrimId],
	);

	const handleTrimAdded = useCallback(
		(span: Span) => {
			const newTrim = {
				id: `trim-${Date.now()}`,
				startMs: span.start,
				endMs: span.end,
			};
			updateState({ trimRegions: [...trimRegions, newTrim] });
			setSelectedTrimId(newTrim.id);
		},
		[trimRegions, updateState, setSelectedTrimId],
	);

	const handleTrimSpanChange = useCallback(
		(id: string, span: Span) => {
			updateState({
				trimRegions: trimRegions.map((t) =>
					t.id === id ? { ...t, startMs: span.start, endMs: span.end } : t,
				),
			});
		},
		[trimRegions, updateState],
	);

	const handleTrimDelete = useCallback(
		(id: string) => {
			updateState({ trimRegions: trimRegions.filter((t) => t.id !== id) });
			if (selectedTrimId === id) setSelectedTrimId(null);
		},
		[trimRegions, selectedTrimId, updateState, setSelectedTrimId],
	);

	// Speed Handlers
	const handleSelectSpeed = useCallback(
		(id: string | null) => setSelectedSpeedId(id),
		[setSelectedSpeedId],
	);

	const handleSpeedAdded = useCallback(
		(span: Span) => {
			const newSpeed = {
				id: `speed-${Date.now()}`,
				startMs: span.start,
				endMs: span.end,
				speed: 1.5 as PlaybackSpeed,
			};
			updateState({ speedRegions: [...speedRegions, newSpeed] });
			setSelectedSpeedId(newSpeed.id);
		},
		[speedRegions, updateState, setSelectedSpeedId],
	);

	const handleSpeedSpanChange = useCallback(
		(id: string, span: Span) => {
			updateState({
				speedRegions: speedRegions.map((s) =>
					s.id === id ? { ...s, startMs: span.start, endMs: span.end } : s,
				),
			});
		},
		[speedRegions, updateState],
	);

	const handleSpeedDelete = useCallback(
		(id: string) => {
			updateState({ speedRegions: speedRegions.filter((s) => s.id !== id) });
			if (selectedSpeedId === id) setSelectedSpeedId(null);
		},
		[speedRegions, selectedSpeedId, updateState, setSelectedSpeedId],
	);

	const handleSpeedChange = useCallback(
		(speed: PlaybackSpeed) => {
			if (!selectedSpeedId) return;
			updateState({
				speedRegions: speedRegions.map((s) => (s.id === selectedSpeedId ? { ...s, speed } : s)),
			});
		},
		[speedRegions, selectedSpeedId, updateState],
	);

	// Audio Handlers
	const handleSelectAudio = useCallback(
		(id: string | null) => setSelectedAudioId(id),
		[setSelectedAudioId],
	);

	const handleAudioAdded = useCallback(
		(span: Span, audioPath: string) => {
			const newAudio = {
				id: `audio-${Date.now()}`,
				startMs: span.start,
				endMs: span.end,
				audioPath: audioPath,
				volume: 1,
				muted: false,
				soloed: false,
				fadeInMs: 0,
				fadeOutMs: 0,
			};
			updateState({ audioRegions: [...audioRegions, newAudio] });
			setSelectedAudioId(newAudio.id);
		},
		[audioRegions, updateState, setSelectedAudioId],
	);

	const handleAudioSpanChange = useCallback(
		(id: string, span: Span) => {
			updateState({
				audioRegions: audioRegions.map((a) =>
					a.id === id ? { ...a, startMs: span.start, endMs: span.end } : a,
				),
			});
		},
		[audioRegions, updateState],
	);

	const handleAudioDelete = useCallback(
		(id: string) => {
			updateState({ audioRegions: audioRegions.filter((a) => a.id !== id) });
			if (selectedAudioId === id) setSelectedAudioId(null);
		},
		[audioRegions, selectedAudioId, updateState, setSelectedAudioId],
	);

	const handleAudioVolumeChange = useCallback(
		(id: string, volume: number) => {
			updateState({
				audioRegions: audioRegions.map((a) => (a.id === id ? { ...a, volume } : a)),
			});
		},
		[audioRegions, updateState],
	);

	const handleAudioMutedChange = useCallback(
		(id: string, muted: boolean) => {
			updateState({
				audioRegions: audioRegions.map((a) => (a.id === id ? { ...a, muted } : a)),
			});
		},
		[audioRegions, updateState],
	);

	const handleAudioSoloedChange = useCallback(
		(id: string, soloed: boolean) => {
			updateState({
				audioRegions: audioRegions.map((a) => (a.id === id ? { ...a, soloed } : a)),
			});
		},
		[audioRegions, updateState],
	);

	const handleAudioFadeInMsChange = useCallback(
		(id: string, fadeInMs: number) => {
			updateState({
				audioRegions: audioRegions.map((a) => (a.id === id ? { ...a, fadeInMs } : a)),
			});
		},
		[audioRegions, updateState],
	);

	const handleAudioFadeOutMsChange = useCallback(
		(id: string, fadeOutMs: number) => {
			updateState({
				audioRegions: audioRegions.map((a) => (a.id === id ? { ...a, fadeOutMs } : a)),
			});
		},
		[audioRegions, updateState],
	);

	// Annotation Handlers
	const handleSelectAnnotation = useCallback(
		(id: string | null) => setSelectedAnnotationId(id),
		[setSelectedAnnotationId],
	);

	const handleAnnotationAdded = useCallback(
		(span: Span) => {
			const newAnno = {
				id: `anno-${Date.now()}`,
				startMs: span.start,
				endMs: span.end,
				type: "text" as AnnotationType,
				content: "New Annotation",
				position: { x: 0.5, y: 0.5 },
				size: { width: 200, height: 100 },
				style: {},
			} as any;
			updateState({ annotationRegions: [...annotationRegions, newAnno] });
			setSelectedAnnotationId(newAnno.id);
		},
		[annotationRegions, updateState, setSelectedAnnotationId],
	);

	const handleAnnotationSpanChange = useCallback(
		(id: string, span: Span) => {
			updateState({
				annotationRegions: annotationRegions.map((a) =>
					a.id === id ? { ...a, startMs: span.start, endMs: span.end } : a,
				),
			});
		},
		[annotationRegions, updateState],
	);

	const handleAnnotationDelete = useCallback(
		(id: string) => {
			updateState({ annotationRegions: annotationRegions.filter((a) => a.id !== id) });
			if (selectedAnnotationId === id) setSelectedAnnotationId(null);
		},
		[annotationRegions, selectedAnnotationId, updateState, setSelectedAnnotationId],
	);

	const handleAnnotationPositionChange = useCallback(
		(id: string, position: { x: number; y: number }) => {
			updateState({
				annotationRegions: annotationRegions.map((a) => (a.id === id ? { ...a, position } : a)),
			});
		},
		[annotationRegions, updateState],
	);

	const handleAnnotationSizeChange = useCallback(
		(id: string, size: { width: number; height: number }) => {
			updateState({
				annotationRegions: annotationRegions.map((a) => (a.id === id ? { ...a, size } : a)),
			});
		},
		[annotationRegions, updateState],
	);

	const handleAnnotationContentChange = useCallback(
		(id: string, content: string, textContent?: string, imageContent?: string) => {
			updateState({
				annotationRegions: annotationRegions.map((a) =>
					a.id === id ? { ...a, content, textContent, imageContent } : a,
				),
			});
		},
		[annotationRegions, updateState],
	);

	const handleAnnotationTypeChange = useCallback(
		(id: string, type: AnnotationType) => {
			updateState({
				annotationRegions: annotationRegions.map((a) => (a.id === id ? { ...a, type } : a)),
			});
		},
		[annotationRegions, updateState],
	);

	const handleAnnotationStyleChange = useCallback(
		(id: string, style: any) => {
			updateState({
				annotationRegions: annotationRegions.map((a) =>
					a.id === id ? { ...a, style: { ...a.style, ...style } } : a,
				),
			});
		},
		[annotationRegions, updateState],
	);

	const handleAnnotationFigureDataChange = useCallback(
		(id: string, figureData: any) => {
			updateState({
				annotationRegions: annotationRegions.map((a) =>
					a.id === id ? { ...a, figureData: { ...a.figureData, ...figureData } } : a,
				),
			});
		},
		[annotationRegions, updateState],
	);

	const handleAnnotationBlurIntensityChange = useCallback(
		(id: string, blurIntensity: number) => {
			updateState({
				annotationRegions: annotationRegions.map((a) =>
					a.id === id ? { ...a, blurIntensity } : a,
				),
			});
		},
		[annotationRegions, updateState],
	);

	// Caption Handlers
	const handleSelectCaption = useCallback(
		(id: string | null) => setSelectedCaptionId(id),
		[setSelectedCaptionId],
	);

	const handleCaptionSpanChange = useCallback(
		(id: string, span: Span) => {
			updateState({
				autoCaptions: autoCaptions.map((c: any) =>
					c.id === id ? { ...c, startMs: span.start, endMs: span.end } : c,
				),
			});
		},
		[autoCaptions, updateState],
	);

	const handleClearAutoCaptions = useCallback(() => {
		updateState({ autoCaptions: [] });
		setSelectedCaptionId(null);
	}, [updateState, setSelectedCaptionId]);

	const handleAutoSuggestZooms = useCallback(() => {
		setAutoSuggestZoomsTrigger((prev) => prev + 1);
		setActiveEffectSection("zooms");
	}, [setAutoSuggestZoomsTrigger, setActiveEffectSection]);

	const handleAutoSuggestZoomsConsumed = useCallback(() => {
		setAutoSuggestZoomsTrigger(0);
	}, [setAutoSuggestZoomsTrigger]);

	const handleSelectMaster = useCallback(() => {
		updateState({ isMasterSelected: true });
		setSelectedZoomId(null);
		setSelectedTrimId(null);
		setSelectedSpeedId(null);
		setSelectedAudioId(null);
		setSelectedAnnotationId(null);
		setSelectedCaptionId(null);
	}, [
		updateState,
		setSelectedZoomId,
		setSelectedTrimId,
		setSelectedSpeedId,
		setSelectedAudioId,
		setSelectedAnnotationId,
		setSelectedCaptionId,
	]);

	return {
		handleSelectZoom,
		handleZoomAdded,
		handleZoomSpanChange,
		handleZoomDelete,
		handleZoomDepthChange,
		handleZoomFocusChange,
		handleZoomSuggested,
		handleSelectTrim,
		handleTrimAdded,
		handleTrimSpanChange,
		handleTrimDelete,
		handleSelectSpeed,
		handleSpeedAdded,
		handleSpeedSpanChange,
		handleSpeedDelete,
		handleSpeedChange,
		handleSelectAudio,
		handleAudioAdded,
		handleAudioSpanChange,
		handleAudioDelete,
		handleAudioVolumeChange,
		handleAudioMutedChange,
		handleAudioSoloedChange,
		handleAudioFadeInMsChange,
		handleAudioFadeOutMsChange,
		handleSelectAnnotation,
		handleAnnotationAdded,
		handleAnnotationSpanChange,
		handleAnnotationDelete,
		handleAnnotationPositionChange,
		handleAnnotationSizeChange,
		handleAnnotationContentChange,
		handleAnnotationTypeChange,
		handleAnnotationStyleChange,
		handleAnnotationFigureDataChange,
		handleAnnotationBlurIntensityChange,
		handleSelectCaption,
		handleCaptionSpanChange,
		handleClearAutoCaptions,
		handleSelectMaster,
		handleAutoSuggestZooms,
		handleAutoSuggestZoomsConsumed,
	};
}
