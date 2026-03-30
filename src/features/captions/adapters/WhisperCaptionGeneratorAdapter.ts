import {
	CaptionGenerationOptions,
	CaptionGeneratorPort,
} from "../domain/ports/CaptionGeneratorPort";

export class WhisperCaptionGeneratorAdapter implements CaptionGeneratorPort {
	async generate(options: CaptionGenerationOptions) {
		return await window.electronAPI.generateAutoCaptions(options);
	}

	onProgress(callback: (progress: number) => void) {
		return window.electronAPI.onAutoCaptionProgress(({ progress }) => callback(progress));
	}
}
