export interface SessionMetadata {
	videoPath: string;
	webcamPath?: string | null;
	timeOffsetMs?: number;
}

export interface RecordingStoragePort {
	storeVideo(
		arrayBuffer: ArrayBuffer,
		fileName: string,
	): Promise<{ success: boolean; path: string; error?: string }>;
	setCurrentSession(metadata: SessionMetadata): Promise<void>;
	setCurrentVideoPath(path: string): Promise<void>;
	getPlatform(): Promise<string>;
	switchToEditor(): Promise<void>;
	setRecordingStatus(active: boolean): Promise<void>;
	muxNativeWindowsRecording(): Promise<{ success: boolean; path?: string }>;
	getCountdownDelay(): Promise<number>;
	setCountdownDelay(delay: number): Promise<void>;
	onRecordingStateChanged(callback: (state: { recording: boolean }) => void): () => void;
}
