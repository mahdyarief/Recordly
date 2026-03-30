import { RecordingSession, RecordingSettings, RecordingStatus } from "../entities/RecordingSession";

export interface RecordingPort {
	start(settings: RecordingSettings): Promise<void>;
	pause(): Promise<void>;
	resume(): Promise<void>;
	stop(): Promise<RecordingSession>;
	cancel(): Promise<void>;
	getStatus(): RecordingStatus;
	onStatusChange(callback: (status: RecordingStatus) => void): () => void;
	preparePermissions(): Promise<boolean>;
}
