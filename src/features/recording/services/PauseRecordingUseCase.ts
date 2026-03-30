import type { ScreenCapturePort } from "../domain/ports/ScreenCapturePort";

export class PauseRecordingUseCase {
	constructor(private screenCapturePort: ScreenCapturePort) {}

	async execute(): Promise<{ success: boolean; message?: string }> {
		// Only native capture currently supports IPC-based pause in this implementation
		if (this.screenCapturePort.pauseNativeCapture) {
			return await this.screenCapturePort.pauseNativeCapture();
		}
		return { success: false, message: "Pause not supported for current capture method." };
	}

	async resume(): Promise<{ success: boolean; message?: string }> {
		if (this.screenCapturePort.resumeNativeCapture) {
			return await this.screenCapturePort.resumeNativeCapture();
		}
		return { success: false, message: "Resume not supported for current capture method." };
	}
}
