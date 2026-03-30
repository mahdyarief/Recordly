import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useDI } from "@/shared/lib/useDI";
import { PauseRecordingUseCase } from "../services/PauseRecordingUseCase";
import { PreparePermissionsUseCase } from "../services/PreparePermissionsUseCase";
import { StartRecordingUseCase } from "../services/StartRecordingUseCase";
import { StopRecordingUseCase } from "../services/StopRecordingUseCase";

export function useRecorder() {
	const di = useDI();

	// Ports
	const storageAdapter = useRef(di.recordingStorage);
	const permissionsAdapter = useRef(di.permissions);
	const screenCaptureAdapter = useRef(di.screenCapture);
	const countdownAdapter = useRef(di.countdown);

	// Services
	const permissionsUseCase = useRef(
		new PreparePermissionsUseCase(permissionsAdapter.current, storageAdapter.current),
	);
	const startUseCase = useRef(new StartRecordingUseCase(screenCaptureAdapter.current));
	const stopUseCase = useRef(
		new StopRecordingUseCase(screenCaptureAdapter.current, storageAdapter.current),
	);
	const pauseUseCase = useRef(new PauseRecordingUseCase(screenCaptureAdapter.current));

	// State
	const [recording, setRecording] = useState(false);
	const [paused, setPaused] = useState(false);
	const [countdownActive, setCountdownActive] = useState(false);
	const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
	const [isMacOS, setIsMacOS] = useState(false);

	const [microphoneEnabled, setMicrophoneEnabled] = useState(false);
	const [microphoneDeviceId, setMicrophoneDeviceId] = useState<string | undefined>(undefined);
	const [systemAudioEnabled, setSystemAudioEnabled] = useState(false);
	const [webcamEnabled, setWebcamEnabled] = useState(false);
	const [webcamDeviceId, setWebcamDeviceId] = useState<string | undefined>(undefined);
	const [countdownDelay, setCountdownDelayState] = useState(3);

	// Load platform and preferences
	useEffect(() => {
		let mounted = true;

		void storageAdapter.current.getPlatform().then((p) => {
			if (mounted) setIsMacOS(p === "darwin");
		});

		void storageAdapter.current.getCountdownDelay().then((delay) => {
			if (mounted) setCountdownDelayState(delay);
		});

		const removeStateListener = storageAdapter.current.onRecordingStateChanged?.(
			(state: { recording: boolean }) => {
				if (mounted) setRecording(state.recording);
			},
		);

		const removeInterruptedListener = screenCaptureAdapter.current.onRecordingInterrupted?.(
			(state) => {
				if (mounted) {
					setRecording(false);
					setPaused(false);
					toast.error(state.message);
				}
			},
		);

		const removeTickListener = countdownAdapter.current.onCountdownTick?.((seconds) => {
			if (mounted) {
				setRemainingSeconds(seconds);
				if (seconds === 0) {
					setCountdownActive(false);
					setRemainingSeconds(null);
				}
			}
		});

		return () => {
			mounted = false;
			removeStateListener?.();
			removeInterruptedListener?.();
			removeTickListener?.();
		};
	}, []);

	// Use refs for latest state in tray listener
	const recordingRef = useRef(recording);
	useEffect(() => {
		recordingRef.current = recording;
	}, [recording]);

	const stopRecording = useCallback(async () => {
		const result = await stopUseCase.current.execute(null); // TODO: handle webcam path
		if (result.success) {
			setRecording(false);
			setPaused(false);
		}
	}, []);

	useEffect(() => {
		const removeTrayListener = screenCaptureAdapter.current.onStopRecordingFromTray?.(() => {
			if (recordingRef.current) {
				void stopRecording();
			}
		});
		return () => removeTrayListener?.();
	}, [stopRecording]);

	const setCountdownDelay = useCallback((delay: number) => {
		setCountdownDelayState(delay);
		void storageAdapter.current.setCountdownDelay(delay);
	}, []);

	const preparePermissions = useCallback(async (options: { startup?: boolean } = {}) => {
		return await permissionsUseCase.current.execute(options);
	}, []);

	const startCaptureFlow = useCallback(async () => {
		const source = await screenCaptureAdapter.current.getSelectedSource();
		if (!source) {
			toast.error("Please select a source to record");
			return;
		}

		const executeStart = async () => {
			const result = await startUseCase.current.execute({
				source,
				microphoneEnabled,
				microphoneDeviceId,
				systemAudioEnabled,
				webcamEnabled,
				webcamDeviceId,
			});

			if (result.success) {
				setRecording(true);
			}
		};

		if (countdownDelay > 0) {
			setCountdownActive(true);
			setRemainingSeconds(countdownDelay);
			const countdownResult = await countdownAdapter.current.startCountdown(countdownDelay);
			if (countdownResult.success && !countdownResult.cancelled) {
				await executeStart();
			} else {
				setCountdownActive(false);
				setRemainingSeconds(null);
			}
		} else {
			await executeStart();
		}
	}, [
		countdownDelay,
		microphoneEnabled,
		microphoneDeviceId,
		systemAudioEnabled,
		webcamEnabled,
		webcamDeviceId,
	]);

	const toggleRecording = useCallback(async () => {
		if (recording) {
			await stopRecording();
		} else if (countdownActive) {
			await countdownAdapter.current.cancelCountdown();
			setCountdownActive(false);
			setRemainingSeconds(null);
		} else {
			await startCaptureFlow();
		}
	}, [recording, countdownActive, startCaptureFlow, stopRecording]);

	const pauseRecording = useCallback(async () => {
		const result = await pauseUseCase.current.execute();
		if (result.success) {
			setPaused(true);
		} else {
			toast.error(result.message || "Failed to pause recording");
		}
	}, []);

	const resumeRecording = useCallback(async () => {
		const result = await pauseUseCase.current.resume();
		if (result.success) {
			setPaused(false);
		} else {
			toast.error(result.message || "Failed to resume recording");
		}
	}, []);

	const cancelRecording = useCallback(async () => {
		if (countdownActive) {
			await countdownAdapter.current.cancelCountdown();
			setCountdownActive(false);
			setRemainingSeconds(null);
		} else if (recording) {
			await stopRecording();
		}
		setRecording(false);
		setPaused(false);
	}, [recording, countdownActive, stopRecording]);

	return {
		recording,
		paused,
		countdownActive,
		remainingSeconds,
		toggleRecording,
		pauseRecording,
		resumeRecording,
		cancelRecording,
		preparePermissions,
		isMacOS,
		microphoneEnabled,
		setMicrophoneEnabled,
		microphoneDeviceId,
		setMicrophoneDeviceId,
		systemAudioEnabled,
		setSystemAudioEnabled,
		webcamEnabled,
		setWebcamEnabled,
		webcamDeviceId,
		setWebcamDeviceId,
		countdownDelay,
		setCountdownDelay,
	};
}
