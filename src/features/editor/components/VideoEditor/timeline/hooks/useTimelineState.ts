import type { Range } from "dnd-timeline";
import { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

const FALLBACK_RANGE_MS = 1000;

export function useTimelineState(totalMs: number, currentTimeMs: number) {
	const [range, setRange] = useState<Range>(() =>
		totalMs > 0 ? { start: 0, end: totalMs } : { start: 0, end: FALLBACK_RANGE_MS },
	);
	const [keyframes, setKeyframes] = useState<{ id: string; time: number }[]>([]);
	const [selectedKeyframeId, setSelectedKeyframeId] = useState<string | null>(null);
	const [selectAllBlocksActive, setSelectAllBlocksActive] = useState(false);
	const isTimelineFocusedRef = useRef(false);

	useEffect(() => {
		setRange(totalMs > 0 ? { start: 0, end: totalMs } : { start: 0, end: FALLBACK_RANGE_MS });
	}, [totalMs]);

	const addKeyframe = useCallback(() => {
		if (totalMs === 0) return;
		const time = Math.max(0, Math.min(currentTimeMs, totalMs));
		if (keyframes.some((kf) => Math.abs(kf.time - time) < 1)) return;
		setKeyframes((prev) => [...prev, { id: uuidv4(), time }]);
	}, [currentTimeMs, totalMs, keyframes]);

	const handleKeyframeMove = useCallback(
		(id: string, newTime: number) => {
			setKeyframes((prev) =>
				prev.map((kf) =>
					kf.id === id ? { ...kf, time: Math.max(0, Math.min(newTime, totalMs)) } : kf,
				),
			);
		},
		[totalMs],
	);

	return {
		range,
		setRange,
		keyframes,
		setKeyframes,
		selectedKeyframeId,
		setSelectedKeyframeId,
		selectAllBlocksActive,
		setSelectAllBlocksActive,
		isTimelineFocusedRef,
		addKeyframe,
		handleKeyframeMove,
	};
}
