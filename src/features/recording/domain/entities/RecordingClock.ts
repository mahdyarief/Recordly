export interface RecordingClockState {
	startTimeMs: number;
	accumulatedPausedDurationMs: number;
	pauseStartedAtMs: number | null;
}

export function createRecordingClock(startTimeMs: number): RecordingClockState {
	return {
		startTimeMs,
		accumulatedPausedDurationMs: 0,
		pauseStartedAtMs: null,
	};
}

export function pauseClock(state: RecordingClockState, pausedAtMs: number): RecordingClockState {
	if (state.pauseStartedAtMs !== null) return state;
	return {
		...state,
		pauseStartedAtMs: pausedAtMs,
	};
}

export function resumeClock(state: RecordingClockState, resumedAtMs: number): RecordingClockState {
	if (state.pauseStartedAtMs === null) return state;

	const pauseDuration = Math.max(0, resumedAtMs - state.pauseStartedAtMs);
	return {
		...state,
		accumulatedPausedDurationMs: state.accumulatedPausedDurationMs + pauseDuration,
		pauseStartedAtMs: null,
	};
}

export function getClockDurationMs(state: RecordingClockState, nowMs: number): number {
	const totalElapsed = nowMs - state.startTimeMs;

	if (state.pauseStartedAtMs !== null) {
		const currentPauseDuration = Math.max(0, nowMs - state.pauseStartedAtMs);
		return Math.max(0, totalElapsed - (state.accumulatedPausedDurationMs + currentPauseDuration));
	}

	return Math.max(0, totalElapsed - state.accumulatedPausedDurationMs);
}
