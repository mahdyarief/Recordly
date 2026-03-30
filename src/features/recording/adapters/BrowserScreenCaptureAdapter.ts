import type {
	CaptureResult,
	CaptureSource,
	ScreenCapturePort,
} from "../domain/ports/ScreenCapturePort";

export class BrowserScreenCaptureAdapter implements ScreenCapturePort {
	private mediaRecorder: MediaRecorder | null = null;
	private stream: MediaStream | null = null;

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

	async startNativeCapture(): Promise<CaptureResult> {
		return { success: false, message: "Native capture NOT supported in browser adapter." };
	}

	async stopNativeCapture(): Promise<CaptureResult> {
		if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
			this.mediaRecorder.stop();
		}
		return { success: true };
	}

	async isNativeCaptureAvailable(): Promise<{ available: boolean }> {
		return { available: false };
	}

	async recoverNativeCapture(): Promise<CaptureResult> {
		return { success: false };
	}

	async getSelectedSource(): Promise<CaptureSource | null> {
		return null;
	}

	async hideOsCursor(): Promise<void> {}

	onRecordingInterrupted(): () => void {
		return () => {};
	}

	onStopRecordingFromTray(): () => void {
		return () => {};
	}

	// Browser specific methods to be called by service
	getMediaRecorder(): MediaRecorder | null {
		return this.mediaRecorder;
	}

	setMediaRecorder(recorder: MediaRecorder | null) {
		this.mediaRecorder = recorder;
	}

	setStream(stream: MediaStream | null) {
		this.stream = stream;
	}

	getStream(): MediaStream | null {
		return this.stream;
	}
}
