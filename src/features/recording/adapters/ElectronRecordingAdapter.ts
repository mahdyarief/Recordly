export class ElectronRecordingAdapter {
	async getPlatform() {
		return await window.electronAPI.getPlatform();
	}

	async getScreenRecordingPermissionStatus() {
		return await window.electronAPI.getScreenRecordingPermissionStatus();
	}

	async openScreenRecordingPreferences() {
		return await window.electronAPI.openScreenRecordingPreferences();
	}

	async getAccessibilityPermissionStatus() {
		return await window.electronAPI.getAccessibilityPermissionStatus();
	}

	async requestAccessibilityPermission() {
		return await window.electronAPI.requestAccessibilityPermission();
	}

	async openAccessibilityPreferences() {
		return await window.electronAPI.openAccessibilityPreferences();
	}

	async getSelectedSource() {
		return await window.electronAPI.getSelectedSource();
	}

	async startNativeScreenRecording(source: any, options: any) {
		return await window.electronAPI.startNativeScreenRecording(source, options);
	}

	async stopNativeScreenRecording() {
		return await window.electronAPI.stopNativeScreenRecording();
	}

	async muxNativeWindowsRecording() {
		return await window.electronAPI.muxNativeWindowsRecording();
	}

	async recoverNativeScreenRecording() {
		return await window.electronAPI.recoverNativeScreenRecording();
	}

	async setCurrentRecordingSession(session: {
		videoPath: string;
		webcamPath: string | null;
		timeOffsetMs: number;
	}) {
		return await window.electronAPI.setCurrentRecordingSession(session);
	}

	async setCurrentVideoPath(path: string) {
		return await window.electronAPI.setCurrentVideoPath(path);
	}

	async switchToEditor() {
		return await window.electronAPI.switchToEditor();
	}

	async setRecordingState(active: boolean) {
		return await window.electronAPI.setRecordingState(active);
	}

	async getSources(options: any) {
		return await window.electronAPI.getSources(options);
	}

	async storeRecordedVideo(arrayBuffer: ArrayBuffer, fileName: string) {
		return await window.electronAPI.storeRecordedVideo(arrayBuffer, fileName);
	}

	onStopRecordingFromTray(callback: () => void) {
		return window.electronAPI.onStopRecordingFromTray(callback);
	}

	onRecordingStateChanged(callback: (state: any) => void) {
		return window.electronAPI.onRecordingStateChanged(callback);
	}

	onRecordingInterrupted(callback: (state: any) => void) {
		return window.electronAPI.onRecordingInterrupted(callback);
	}
}
