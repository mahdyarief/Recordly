import type {
	CaptureResult,
	CaptureSource,
	ScreenCapturePort,
} from "../domain/ports/ScreenCapturePort";

export interface StartRecordingOptions {
	source: CaptureSource;
	microphoneEnabled: boolean;
	microphoneDeviceId?: string;
	microphoneLabel?: string;
	systemAudioEnabled: boolean;
	webcamEnabled: boolean;
	webcamDeviceId?: string;
}

export class StartRecordingUseCase {
	constructor(private screenCapturePort: ScreenCapturePort) {}

	async execute(options: StartRecordingOptions): Promise<CaptureResult> {
		// Attempt native capture first if available
		const nativeAvailable = await this.screenCapturePort.isNativeCaptureAvailable();
		if (nativeAvailable.available) {
			const nativeResult = await this.screenCapturePort.startNativeCapture(options.source, {
				capturesSystemAudio: options.systemAudioEnabled,
				capturesMicrophone: options.microphoneEnabled,
				microphoneDeviceId: options.microphoneDeviceId,
				microphoneLabel: options.microphoneLabel,
			});
			if (nativeResult.success) return nativeResult;
		}

		// Fallback to browser capture is handled by the caller/adapter for now
		return { success: false, message: "Native capture failed or unavailable" };
	}
}
