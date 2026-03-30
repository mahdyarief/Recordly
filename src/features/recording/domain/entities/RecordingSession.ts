export const RECORDING_SESSION_CONSTANTS = {
	TARGET_FRAME_RATE: 60,
	TARGET_WIDTH: 3840,
	TARGET_HEIGHT: 2160,
	QHD_WIDTH: 2560,
	QHD_HEIGHT: 1440,
	BITRATE_4K: 45_000_000,
	BITRATE_QHD: 28_000_000,
	BITRATE_BASE: 18_000_000,
	HIGH_FRAME_RATE_THRESHOLD: 60,
	HIGH_FRAME_RATE_BOOST: 1.7,
	DEFAULT_WIDTH: 1920,
	DEFAULT_HEIGHT: 1080,
	CODEC_ALIGNMENT: 2,
	RECORDER_TIMESLICE_MS: 1000,
	BITS_PER_MEGABIT: 1_000_000,
	MIN_FRAME_RATE: 30,
	CHROME_MEDIA_SOURCE: "desktop",
	RECORDING_FILE_PREFIX: "recording-",
	VIDEO_FILE_EXTENSION: ".webm",
	AUDIO_BITRATE_VOICE: 128_000,
	AUDIO_BITRATE_SYSTEM: 192_000,
	MIC_GAIN_BOOST: 1.4,
	WEBCAM_BITRATE: 8_000_000,
	WEBCAM_WIDTH: 1280,
	WEBCAM_HEIGHT: 720,
	WEBCAM_FRAME_RATE: 30,
	WEBCAM_SUFFIX: "-webcam",
} as const;

export interface RecordingSession {
	id: string;
	timestamp: number;
	videoPath: string;
	webcamPath: string | null;
	timeOffsetMs: number;
	durationMs: number;
}

export interface RecordingSettings {
	microphoneEnabled: boolean;
	microphoneDeviceId?: string;
	systemAudioEnabled: boolean;
	webcamEnabled: boolean;
	webcamDeviceId?: string;
	countdownDelay: number;
}

export type RecordingState = "idle" | "countdown" | "recording" | "paused" | "stopping";

export interface RecordingStatus {
	state: RecordingState;
	durationMs: number;
	progress?: number;
}
