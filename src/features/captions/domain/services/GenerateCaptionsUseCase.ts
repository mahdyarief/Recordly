import { CaptionGenerationOptions, CaptionGeneratorPort } from "../ports/CaptionGeneratorPort";

export class GenerateCaptionsUseCase {
	constructor(private readonly captionGenerator: CaptionGeneratorPort) {}

	async execute(options: CaptionGenerationOptions) {
		const result = await this.captionGenerator.generate(options);

		if (result.success && result.cues) {
			// Logic to save cues to project would go here or be handled by the caller
			// For now, we just return the result
		}

		return result;
	}

	onProgress(callback: (progress: number) => void) {
		return this.captionGenerator.onProgress(callback);
	}
}
