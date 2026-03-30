import type { RecordingStoragePort } from "../domain/ports/RecordingStoragePort";
import type { CaptureResult, ScreenCapturePort } from "../domain/ports/ScreenCapturePort";

export class StopRecordingUseCase {
	constructor(
		private screenCapturePort: ScreenCapturePort,
		private storagePort: RecordingStoragePort,
	) {}

	async execute(webcamPath: string | null): Promise<CaptureResult> {
		const result = await this.screenCapturePort.stopNativeCapture();
		await this.storagePort.setRecordingStatus(false);

		if (!result.success || !result.path) {
			// Possibly recovery needed
			const recoveredPath = await this.screenCapturePort.recoverNativeCapture();
			if (recoveredPath.success && recoveredPath.path) {
				await this.storagePort.setCurrentSession({
					videoPath: recoveredPath.path,
					webcamPath,
				});
				await this.storagePort.switchToEditor();
				return recoveredPath;
			}
			return result;
		}

		let finalPath = result.path;

		// Check for specific native Windows capture muxing needed
		const platform = await this.storagePort.getPlatform();
		if (platform === "win32") {
			try {
				const muxResult = await this.storagePort.muxNativeWindowsRecording();
				finalPath = muxResult?.path ?? result.path;
			} catch (err) {
				console.warn("[StopRecordingUseCase] Windows muxing failed, using raw output.", err);
			}
		}

		await this.storagePort.setCurrentSession({
			videoPath: finalPath,
			webcamPath,
		});

		await this.storagePort.switchToEditor();

		return {
			...result,
			path: finalPath,
		};
	}
}
