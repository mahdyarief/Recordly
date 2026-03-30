export interface CaptureSource {
	id: string;
	name: string;
	display_id?: string;
}

export interface NativeCaptureOptions {
	capturesSystemAudio: boolean;
	capturesMicrophone: boolean;
	microphoneDeviceId?: string;
	microphoneLabel?: string;
}

export interface CaptureResult {
	success: boolean;
	path?: string;
	error?: string;
	message?: string;
	userNotified?: boolean;
}

export interface ScreenCapturePort {
	getSources(): Promise<CaptureSource[]>;
	startNativeCapture(source: CaptureSource, options: NativeCaptureOptions): Promise<CaptureResult>;
	stopNativeCapture(): Promise<CaptureResult>;
	isNativeCaptureAvailable(): Promise<{ available: boolean }>;
	recoverNativeCapture(): Promise<CaptureResult>;
	pauseNativeCapture?(): Promise<CaptureResult>;
	resumeNativeCapture?(): Promise<CaptureResult>;
	getSelectedSource(): Promise<CaptureSource | null>;
	hideOsCursor(): Promise<void>;
	onRecordingInterrupted(
		callback: (state: { reason: string; message: string }) => void,
	): () => void;
	onStopRecordingFromTray(callback: () => void): () => void;
}
