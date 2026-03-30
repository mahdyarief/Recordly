import type { RecordingStoragePort, SessionMetadata } from "../domain/ports/RecordingStoragePort";

export class ElectronRecordingStorageAdapter implements RecordingStoragePort {
	async storeVideo(
		arrayBuffer: ArrayBuffer,
		fileName: string,
	): Promise<{ success: boolean; path: string; error?: string }> {
		const result = await window.electronAPI.storeRecordedVideo(arrayBuffer, fileName);
		return {
			success: result.success,
			path: result.path ?? "",
			error: result.message,
		};
	}

	async setCurrentSession(metadata: SessionMetadata): Promise<void> {
		if (metadata.webcamPath) {
			await window.electronAPI.setCurrentRecordingSession({
				videoPath: metadata.videoPath,
				webcamPath: metadata.webcamPath,
				timeOffsetMs: metadata.timeOffsetMs ?? 0,
			});
		} else {
			await window.electronAPI.setCurrentVideoPath(metadata.videoPath);
		}
	}

	async setCurrentVideoPath(path: string): Promise<void> {
		await window.electronAPI.setCurrentVideoPath(path);
	}

	async getPlatform(): Promise<string> {
		return await window.electronAPI.getPlatform();
	}

	async switchToEditor(): Promise<void> {
		await window.electronAPI.switchToEditor();
	}

	async setRecordingStatus(active: boolean): Promise<void> {
		await window.electronAPI.setRecordingState(active);
	}

	async muxNativeWindowsRecording(): Promise<{ success: boolean; path?: string }> {
		return await window.electronAPI.muxNativeWindowsRecording();
	}

	async getCountdownDelay(): Promise<number> {
		const result = await window.electronAPI.getCountdownDelay();
		return result.success ? result.delay : 3;
	}

	async setCountdownDelay(delay: number): Promise<void> {
		await window.electronAPI.setCountdownDelay(delay);
	}

	onRecordingStateChanged(callback: (state: { recording: boolean }) => void): () => void {
		return window.electronAPI.onRecordingStateChanged(callback);
	}
}
