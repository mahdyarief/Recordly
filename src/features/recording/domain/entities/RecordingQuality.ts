import { RECORDING_SESSION_CONSTANTS } from "./RecordingSession";

const {
	TARGET_WIDTH,
	TARGET_HEIGHT,
	HIGH_FRAME_RATE_THRESHOLD,
	BITRATE_4K,
	BITRATE_QHD,
	BITRATE_BASE,
	HIGH_FRAME_RATE_BOOST,
	QHD_WIDTH,
	QHD_HEIGHT,
} = RECORDING_SESSION_CONSTANTS;

const FOUR_K_PIXELS = TARGET_WIDTH * TARGET_HEIGHT;
const QHD_PIXELS = QHD_WIDTH * QHD_HEIGHT;

export function computeBitrate(width: number, height: number, frameRate: number): number {
	const pixels = width * height;
	const highFrameRateBoost = frameRate >= HIGH_FRAME_RATE_THRESHOLD ? HIGH_FRAME_RATE_BOOST : 1;

	if (pixels >= FOUR_K_PIXELS) {
		return Math.round(BITRATE_4K * highFrameRateBoost);
	}

	if (pixels >= QHD_PIXELS) {
		return Math.round(BITRATE_QHD * highFrameRateBoost);
	}

	return Math.round(BITRATE_BASE * highFrameRateBoost);
}

export function computeWebcamBitrate(): number {
	return RECORDING_SESSION_CONSTANTS.WEBCAM_BITRATE;
}
