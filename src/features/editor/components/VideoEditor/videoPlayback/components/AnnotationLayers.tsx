import React from "react";
import { AnnotationOverlay } from "@/features/editor/components/renderers/AnnotationOverlay";
import { type AnnotationRegion } from "../../types";

interface AnnotationLayersProps {
	annotationRegions: AnnotationRegion[];
	selectedAnnotationId: string | null;
	currentTime: number;
	overlayRef: React.RefObject<HTMLDivElement | null>;
	onSelectAnnotation?: (id: string | null) => void;
	onAnnotationPositionChange?: (id: string, position: { x: number; y: number }) => void;
	onAnnotationSizeChange?: (id: string, size: { width: number; height: number }) => void;
}

export function AnnotationLayers({
	annotationRegions,
	selectedAnnotationId,
	currentTime,
	overlayRef,
	onSelectAnnotation,
	onAnnotationPositionChange,
	onAnnotationSizeChange,
}: AnnotationLayersProps) {
	const filtered = (annotationRegions || []).filter((annotation) => {
		if (typeof annotation.startMs !== "number" || typeof annotation.endMs !== "number")
			return false;
		if (annotation.id === selectedAnnotationId) return true;
		const timeMs = Math.round(currentTime * 1000);
		return timeMs >= annotation.startMs && timeMs <= annotation.endMs;
	});

	const sorted = [...filtered].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

	const handleAnnotationClick = (clickedId: string) => {
		if (!onSelectAnnotation) return;
		if (clickedId === selectedAnnotationId && sorted.length > 1) {
			const currentIndex = sorted.findIndex((a) => a.id === clickedId);
			const nextIndex = (currentIndex + 1) % sorted.length;
			onSelectAnnotation(sorted[nextIndex].id);
		} else {
			onSelectAnnotation(clickedId);
		}
	};

	return (
		<>
			{sorted.map((annotation) => (
				<AnnotationOverlay
					key={annotation.id}
					annotation={annotation}
					isSelected={annotation.id === selectedAnnotationId}
					containerWidth={overlayRef.current?.clientWidth || 800}
					containerHeight={overlayRef.current?.clientHeight || 600}
					onPositionChange={(id, pos) => onAnnotationPositionChange?.(id, pos)}
					onSizeChange={(id, size) => onAnnotationSizeChange?.(id, size)}
					onClick={handleAnnotationClick}
					zIndex={annotation.zIndex}
					isSelectedBoost={annotation.id === selectedAnnotationId}
				/>
			))}
		</>
	);
}
