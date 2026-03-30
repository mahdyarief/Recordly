export interface WebcamCaptureOptions {
	deviceId?: string;
	width: number;
	height: number;
	frameRate: number;
}

export interface WebcamCapturePort {
	getStream(options: WebcamCaptureOptions): Promise<MediaStream>;
}
