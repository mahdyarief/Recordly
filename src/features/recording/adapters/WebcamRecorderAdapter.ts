import type { WebcamCaptureOptions, WebcamCapturePort } from "../domain/ports/WebcamCapturePort";

export class WebcamRecorderAdapter implements WebcamCapturePort {
	async getStream(options: WebcamCaptureOptions): Promise<MediaStream> {
		return await navigator.mediaDevices.getUserMedia({
			video: options.deviceId
				? {
						deviceId: { exact: options.deviceId },
						width: { ideal: options.width },
						height: { ideal: options.height },
						frameRate: { ideal: options.frameRate, max: options.frameRate },
					}
				: {
						width: { ideal: options.width },
						height: { ideal: options.height },
						frameRate: { ideal: options.frameRate, max: options.frameRate },
					},
			audio: false,
		});
	}
}
