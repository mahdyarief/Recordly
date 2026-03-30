import type {
	CaptureResult,
	CaptureSource,
	NativeCaptureOptions,
	ScreenCapturePort,
} from "../domain/ports/ScreenCapturePort";

export class ElectronNativeScreenCaptureAdapter implements ScreenCapturePort {
	async getSources(): Promise<CaptureSource[]> {
		const sources = await window.electronAPI.getSources({
			types: ["screen", "window"],
			thumbnailSize: { width: 1, height: 1 },
			fetchWindowIcons: false,
		});
		return sources.map((s) => ({
			id: s.id,
			name: s.name,
			display_id: s.display_id,
		}));
	}

	async startNativeCapture(
		source: CaptureSource,
		options: NativeCaptureOptions,
	): Promise<CaptureResult> {
		return await window.electronAPI.startNativeScreenRecording(source, {
			capturesSystemAudio: options.capturesSystemAudio,
			capturesMicrophone: options.capturesMicrophone,
			microphoneDeviceId: options.microphoneDeviceId,
			microphoneLabel: options.microphoneLabel,
		});
	}

	async stopNativeCapture(): Promise<CaptureResult> {
		return await window.electronAPI.stopNativeScreenRecording();
	}

	async isNativeCaptureAvailable(): Promise<{ available: boolean }> {
		if (typeof window.electronAPI.isNativeWindowsCaptureAvailable === "function") {
			return await window.electronAPI.isNativeWindowsCaptureAvailable();
		}
		// For Mac, if it's macOS, we assume it's available or handled by startNativeScreenRecording check.
		return { available: true };
	}

	async recoverNativeCapture(): Promise<CaptureResult> {
		if (typeof window.electronAPI.recoverNativeScreenRecording === "function") {
			return await window.electronAPI.recoverNativeScreenRecording();
		}
		return { success: false };
	}

	async pauseNativeCapture(): Promise<CaptureResult> {
		return await window.electronAPI.pauseNativeScreenRecording();
	}

	async resumeNativeCapture(): Promise<CaptureResult> {
		return await window.electronAPI.resumeNativeScreenRecording();
	}

	async hideOsCursor(): Promise<void> {
		await window.electronAPI.hideOsCursor?.();
	}

	async getSelectedSource(): Promise<CaptureSource | null> {
		const source = await window.electronAPI.getSelectedSource();
		if (!source) return null;
		return {
			id: source.id,
			name: source.name,
			display_id: source.display_id,
		};
	}

	onRecordingInterrupted(
		callback: (state: { reason: string; message: string }) => void,
	): () => void {
		return window.electronAPI.onRecordingInterrupted(callback);
	}

	onStopRecordingFromTray(callback: () => void): () => void {
		return window.electronAPI.onStopRecordingFromTray(callback);
	}
}
